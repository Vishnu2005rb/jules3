"""
Review Screenshot Analyzer - PaddleOCR + OpenCV
Classifies Google review screenshots for the hackathon platform.

Usage:
    python analyze.py <image_path> [reviewer_name]

Output JSON:
    {
        "status":        "selected" | "review" | "rejected",
        "reason":        "...",
        "rating":        1-5 or null,
        "text_preview":  "...",
        "reviewer_name": "...",
        "name_matched":  true/false
    }

Status:
    selected  - rating >= 3, written review, name matched
    review    - name mismatch / unclear (admin checks)
    rejected  - rating < 3, or no written review
"""

import sys
import json
import re
import os
import base64
import tempfile
import numpy as np
import cv2

os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['PADDLE_DISABLE_ONEDNN'] = '1'
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'


def log(msg):
    print(f"[Analyze] {msg}", file=sys.stderr, flush=True)


# ── OCR ───────────────────────────────────────────────────────────────────────

_ocr = None


def get_ocr():
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR
        _ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    return _ocr


def extract_text_and_boxes(path):
    """Run PaddleOCR. Returns (full_text, boxes) where boxes = [(text, x, y)]."""
    ocr = get_ocr()
    result = ocr.ocr(path, cls=True)
    lines, boxes = [], []
    if result and result[0]:
        for item in result[0]:
            box  = item[0]
            text = item[1][0]
            conf = item[1][1]
            if conf < 0.3:
                continue
            x = sum(pt[0] for pt in box) / 4
            y = sum(pt[1] for pt in box) / 4
            lines.append(text)
            boxes.append((text, x, y))
    log(f"OCR: {len(lines)} lines extracted")
    if lines:
        log(f"First 5: {lines[:5]}")
    return '\n'.join(lines), boxes


# ── Desktop Layout Detection & Crop ──────────────────────────────────────────

def detect_and_crop_desktop(image_path):
    """
    Detect if the image is a desktop Google Maps/Reviews screenshot
    (wide aspect ratio with a map panel on the right side).

    If detected, crop to just the left review sidebar and save to a temp file.
    Returns the path to use for OCR (either the original or the cropped temp file).

    Desktop layout signals:
    - Aspect ratio > 1.6 (wider than tall)
    - Right half has significantly higher colour saturation (map tiles)

    The review sidebar is typically the left 30-35% of the image.
    We crop to left 38% to be safe and include the full sidebar.
    """
    img = cv2.imread(image_path)
    if img is None:
        return image_path, False

    h, w = img.shape[:2]
    aspect = w / max(h, 1)

    # Only consider wide images as potential desktop screenshots
    if aspect < 1.5:
        log(f"Portrait/square image (aspect={aspect:.2f}) — no crop needed")
        return image_path, False

    # Compare saturation of left vs right half
    mid = w // 2
    left_half  = img[:, :mid, :]
    right_half = img[:, mid:, :]

    left_sat  = float(cv2.cvtColor(left_half,  cv2.COLOR_BGR2HSV)[:, :, 1].mean())
    right_sat = float(cv2.cvtColor(right_half, cv2.COLOR_BGR2HSV)[:, :, 1].mean())

    log(f"Aspect={aspect:.2f}, left_sat={left_sat:.1f}, right_sat={right_sat:.1f}")

    # If right side is significantly more saturated → map panel detected
    if right_sat > left_sat * 1.4:
        # Crop to left 38% — covers the full review sidebar
        crop_w = int(w * 0.38)
        cropped = img[:, :crop_w, :]

        # Save to temp file so OCR reads the cropped image
        tmp_path = image_path.replace('.png', '_cropped.png').replace('.jpg', '_cropped.jpg')
        if tmp_path == image_path:
            tmp_path = image_path + '_cropped.png'
        cv2.imwrite(tmp_path, cropped)

        log(f"Desktop layout detected — cropped to left {crop_w}px ({int(crop_w/w*100)}% of {w}px width)")
        log(f"Cropped image saved: {tmp_path} ({crop_w}x{h})")
        return tmp_path, True

    log(f"Wide image but no map detected (right_sat not dominant) — no crop")
    return image_path, False


# ── OCR-Based Star Detection (Primary) ───────────────────────────────────────

def detect_rating_from_ocr(boxes, name_y, next_reviewer_y=None):
    """
    Detect star rating by reading star characters from OCR boxes.

    Strategy:
    1. Find the "X months/weeks/days ago" timestamp box — it's always on the
       SAME LINE as the stars. Use its Y as the precise star-row anchor.
    2. Search for unicode star characters (★ ☆) near that Y.
    3. Count only FILLED stars (★) for the rating.

    Returns int 1-5 or None.
    """
    if name_y is None:
        return None

    search_top    = name_y + 10
    search_bottom = name_y + 150
    if next_reviewer_y is not None:
        search_bottom = min(search_bottom, next_reviewer_y - 5)

    # ── Step A: Find the timestamp line Y (most reliable anchor) ─────────────
    # "3 months ago", "2 weeks ago", "just now", "a week ago", "Edited ..."
    timestamp_y = None
    timestamp_pattern = re.compile(
        r'(\d+\s+(month|week|day|hour|minute|year)s?\s+ago'
        r'|just\s+now'
        r'|a\s+(week|month|day)\s+ago'
        r'|edited)',
        re.IGNORECASE
    )
    for text, x, y in boxes:
        if not (search_top <= y <= search_bottom):
            continue
        if timestamp_pattern.search(text):
            timestamp_y = y
            log(f"Timestamp line found: '{text}' y={round(y)}")
            break

    # ── Step B: Search for star characters near the timestamp Y ──────────────
    # If we found a timestamp, search within ±20px of it (same line)
    # Otherwise fall back to the full search window
    if timestamp_y is not None:
        star_search_top    = timestamp_y - 20
        star_search_bottom = timestamp_y + 20
    else:
        star_search_top    = search_top
        star_search_bottom = search_bottom

    candidates = []
    for text, x, y in boxes:
        if not (star_search_top <= y <= star_search_bottom):
            continue
        t = text.strip()

        # Strip trailing metadata: "★★★☆☆ 3 months ago" → "★★★☆☆"
        t_clean = re.sub(
            r'\s*(edited|just now|new|\d+\s+\w+\s+ago|a\s+\w+\s+ago|·|\|).*',
            '', t, flags=re.IGNORECASE
        ).strip()

        # Unicode stars — count FILLED stars only for the rating
        filled  = t_clean.count('\u2605')  # ★ filled star
        outline = t_clean.count('\u2606')  # ☆ outline star
        total   = filled + outline

        if total > 0 and total <= 5:
            rating_val = filled if filled > 0 else total
            candidates.append((y, rating_val, t_clean))
            log(f"OCR star box y={round(y)}: '{t}' → cleaned='{t_clean}' filled={filled} outline={outline} → rating={rating_val}")
            continue

        # Asterisk pattern: "***", "****", etc.
        stripped = re.sub(r'\s*(edited|just now|new|\d+\s+\w+\s+ago).*', '', t, flags=re.IGNORECASE).strip()
        asterisks = stripped.count('*')
        non_ast   = len(stripped.replace('*', '').replace(' ', ''))
        if 1 <= asterisks <= 5 and non_ast <= 2:
            candidates.append((y, asterisks, stripped))
            log(f"OCR asterisk box y={round(y)}: '{t}' count={asterisks}")

    if not candidates:
        log(f"OCR star detection: no candidates in y=[{round(star_search_top)}, {round(star_search_bottom)}]")
        return None

    candidates.sort(key=lambda c: c[0])
    chosen_y, rating, chosen_text = candidates[0]
    log(f"OCR stars chosen: '{chosen_text}' y={round(chosen_y)} rating={rating}")
    return rating if rating > 0 else None


# ── "Your review" section anchor ─────────────────────────────────────────────

def find_your_review_y(boxes):
    """
    Find the Y position of the 'Your review' section header in Google Maps layout.
    Returns the Y coordinate or None.
    """
    for text, x, y in boxes:
        tl = text.strip().lower()
        if tl in ('your review', 'your reviews', 'my review'):
            log(f"Found 'Your review' section at y={round(y)}")
            return y
    return None


def find_timestamp_y(boxes, name_y, next_reviewer_y=None):
    """
    Find the Y position of the timestamp line ("3 months ago", "2 weeks ago", etc.)
    that appears on the SAME LINE as the star rating.

    Searches between name_y+10 and name_y+150 (or next_reviewer_y).
    Returns the Y coordinate or None.
    """
    if name_y is None:
        return None

    search_top    = name_y + 10
    search_bottom = name_y + 150
    if next_reviewer_y is not None:
        search_bottom = min(search_bottom, next_reviewer_y - 5)

    ts_pattern = re.compile(
        r'(\d+\s+(month|week|day|hour|minute|year)s?\s+ago'
        r'|just\s+now'
        r'|a\s+(week|month|day)\s+ago'
        r'|edited)',
        re.IGNORECASE
    )

    for text, x, y in boxes:
        if not (search_top <= y <= search_bottom):
            continue
        if ts_pattern.search(text):
            log(f"Timestamp found: '{text}' y={round(y)}")
            return y

    return None


# ── HSV Visual Star Detection (Fallback) ─────────────────────────────────────

def detect_rating_visual(path, name_y_px=None, name_x_px=None, next_reviewer_y=None,
                         your_review_y=None, timestamp_y_px=None):
    """
    Count filled yellow/gold stars using HSV color detection.

    Works for all Google review layouts:
    - Mobile app (multiple reviewer cards, no timestamp on some)
    - Desktop Maps (left panel + map)
    - Desktop browser (single or multiple reviews)

    Anchor priority (most precise first):
    1. timestamp_y_px  — same line as stars (±30px window)
    2. name_y_px       — search name_y+10 to min(name_y+150, next_reviewer_y)
    3. your_review_y   — Google Maps "Your review" section

    Map layout: crops to left 40% when right half is a map.
    """
    img = cv2.imread(path)
    if img is None:
        log("WARNING: cv2.imread returned None")
        return None

    h, w = img.shape[:2]
    log(f"Image size: {w}x{h}, name_y={name_y_px}, next_reviewer_y={next_reviewer_y}, ts_y={timestamp_y_px}")

    # ── Detect map layout: crop to left panel if right side is a map ─────────
    right_half = img[:, w//2:, :]
    right_hsv  = cv2.cvtColor(right_half, cv2.COLOR_BGR2HSV)
    right_sat  = float(right_hsv[:, :, 1].mean())
    left_half  = img[:, :w//2, :]
    left_hsv_  = cv2.cvtColor(left_half, cv2.COLOR_BGR2HSV)
    left_sat   = float(left_hsv_[:, :, 1].mean())

    if right_sat > left_sat * 1.5:
        log(f"Map layout: cropping to left 40% (right_sat={right_sat:.1f}, left_sat={left_sat:.1f})")
        crop_w = int(w * 0.40)
        img = img[:, :crop_w, :]
        w = crop_w

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Gold/yellow star range
    lower = np.array([15, 100, 100])
    upper = np.array([40, 255, 255])
    mask  = cv2.inRange(hsv, lower, upper)

    kernel = np.ones((3, 3), np.uint8)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Adaptive min_area — mobile screenshots have smaller stars
    min_area = max((w * h) * 0.000008, 20)

    # Absolute minimum Y to consider — skip everything above the reviewer's name.
    # The overall rating section (4.5 ★★★★½) is always ABOVE the first reviewer's
    # name. By ignoring all blobs above name_y, we never confuse the overall
    # rating stars with the reviewer's personal stars.
    # Use name_y - 5px as the cutoff (small buffer for alignment tolerance).
    # If name_y is unknown, fall back to skipping the top 15% of the image.
    if name_y_px is not None:
        blob_min_y = max(name_y_px - 5, 0)
    else:
        blob_min_y = h * 0.15

    blobs = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        M = cv2.moments(cnt)
        if M["m00"] <= 0:
            continue
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        # ── KEY FIX: skip blobs above the reviewer's name ──────────────────
        if cy < blob_min_y:
            continue
        x_bb, y_bb, bw, bh = cv2.boundingRect(cnt)
        # Skip wide rectangles (bar chart bars)
        if bw / max(bh, 1) > 4.0:
            continue
        # Skip very tall blobs
        if bh / max(bw, 1) > 4.0:
            continue
        blobs.append((cx, cy, area))

    log(f"Gold blobs found: {len(blobs)}")
    if not blobs:
        return None

    # Group blobs into horizontal rows
    blobs.sort(key=lambda b: b[1])
    row_tol = max(h * 0.025, 8)
    rows, cur = [], [blobs[0]]
    for i in range(1, len(blobs)):
        if abs(blobs[i][1] - blobs[i-1][1]) < row_tol:
            cur.append(blobs[i])
        else:
            rows.append(cur)
            cur = [blobs[i]]
    rows.append(cur)

    row_info = [{'count': len(r), 'avg_y': sum(b[1] for b in r) / len(r),
                 'min_x': min(b[0] for b in r), 'max_x': max(b[0] for b in r)}
                for r in rows]
    log(f"Star rows: {[(r['count'], round(r['avg_y'])) for r in row_info]}")

    # ── Case 1: Timestamp anchor (most precise — same line as stars) ──────────
    if timestamp_y_px is not None:
        window_top    = timestamp_y_px - 30
        window_bottom = timestamp_y_px + 30
        cands = [r for r in row_info if window_top < r['avg_y'] < window_bottom and 1 <= r['count'] <= 5]
        log(f"Timestamp window [{round(window_top)},{round(window_bottom)}]: {[(r['count'], round(r['avg_y'])) for r in cands]}")
        if cands:
            chosen = min(cands, key=lambda r: abs(r['avg_y'] - timestamp_y_px))
            log(f"Chosen (timestamp): count={chosen['count']} y={round(chosen['avg_y'])}")
            return min(chosen['count'], 5)

    # ── Case 2: Name anchor — search between name and next reviewer ───────────
    if name_y_px is not None:
        # Stars are always 10–150px below the name
        window_top    = name_y_px + 10
        window_bottom = name_y_px + 150
        # Hard boundary: never go past the next reviewer
        if next_reviewer_y is not None:
            window_bottom = min(window_bottom, next_reviewer_y - 5)

        log(f"Name window [{round(window_top)},{round(window_bottom)}]")
        cands = [r for r in row_info if window_top < r['avg_y'] < window_bottom and 1 <= r['count'] <= 5]
        log(f"Candidates: {[(r['count'], round(r['avg_y'])) for r in cands]}")

        if cands:
            # Pick the row closest to the name (topmost = this reviewer's stars)
            chosen = min(cands, key=lambda r: r['avg_y'])
            log(f"Chosen (name anchor): count={chosen['count']} y={round(chosen['avg_y'])}")
            return min(chosen['count'], 5)

    # ── Case 3: "Your review" section anchor ─────────────────────────────────
    if your_review_y is not None:
        window_top    = your_review_y + 10
        window_bottom = your_review_y + 150
        if next_reviewer_y is not None:
            window_bottom = min(window_bottom, next_reviewer_y - 5)
        cands = [r for r in row_info if window_top < r['avg_y'] < window_bottom and 1 <= r['count'] <= 5]
        if cands:
            chosen = min(cands, key=lambda r: r['avg_y'])
            log(f"Chosen (your_review anchor): count={chosen['count']} y={round(chosen['avg_y'])}")
            return min(chosen['count'], 5)

    # ── Case 4: No anchor — pick first valid row below top 20% ───────────────
    fallback = [r for r in row_info if 1 <= r['count'] <= 5 and r['avg_y'] > h * 0.20]
    if fallback:
        chosen = min(fallback, key=lambda r: r['avg_y'])
        log(f"Chosen (no anchor fallback): count={chosen['count']} y={round(chosen['avg_y'])}")
        return min(chosen['count'], 5)

    log("No star row found")
    return None


# ── Name Matching ─────────────────────────────────────────────────────────────

def edit_distance(a, b):
    if len(a) < len(b):
        a, b = b, a
    row = list(range(len(b) + 1))
    for c1 in a:
        nr = [row[0] + 1]
        for j, c2 in enumerate(b):
            nr.append(min(row[j] + (c1 != c2), row[j+1] + 1, nr[-1] + 1))
        row = nr
    return row[-1]


def find_name_position(boxes, submitted_name):
    """Find (y, x) pixel position of the reviewer's name using fuzzy matching."""
    name_tokens = set(re.findall(r'[a-z]+', submitted_name.lower()))
    for text, x, y in boxes:
        line_tokens = re.findall(r'[a-z]+', text.lower())
        for nt in name_tokens:
            if len(nt) < 3:
                continue
            for lt in line_tokens:
                if edit_distance(nt, lt) <= (1 if len(nt) <= 5 else 2):
                    log(f"Name '{submitted_name}' found at y={round(y)}, x={round(x)} in '{text}'")
                    return y, x
    return None, None


def find_next_reviewer_y(boxes, submitted_name, name_y):
    """
    Find Y position of the NEXT reviewer's name after the matched user.
    Accepts single-word names (e.g. 'Sushmi') and multi-word names.
    Returns None if no next reviewer found.
    """
    if name_y is None:
        return None

    name_tokens = set(re.findall(r'[a-z]+', submitted_name.lower()))
    candidates = []

    for text, x, y in boxes:
        if y <= name_y + 10:
            continue
        tokens = text.split()
        if not (1 <= len(tokens) <= 4):
            continue
        if not re.match(r'[A-Z]', text):
            continue
        if re.search(r'[\d.!?,]', text):
            continue
        if len(text) > 50:
            continue
        tl = text.lower()
        if re.match(r'^(sort|most|newest|highest|lowest|overview|reviews|photos|about|like|share|press|add|cancel|post|google|maps|all|edit|helpful|report|recents|saved|layers|hackathon|learning|embedded|webinar|tarcin|robotic)', tl):
            continue
        if re.search(r'\d+\s*(review|photo|star|month|week|year|day)', tl):
            continue
        line_tokens = set(re.findall(r'[a-z]+', tl))
        if name_tokens & line_tokens:
            continue
        letter_tokens = [t for t in line_tokens if len(t) >= 3]
        if not letter_tokens:
            continue
        candidates.append((y, text))

    if not candidates:
        return None

    candidates.sort(key=lambda c: c[0])
    next_y, next_name = candidates[0]
    log(f"Next reviewer: '{next_name}' at y={round(next_y)}")
    return next_y


def check_name_in_text(full_text, submitted_name):
    """Check if submitted name appears in OCR text (exact or fuzzy)."""
    submitted_tokens = set(re.findall(r'[a-z]+', submitted_name.lower()))
    ocr_tokens = set(re.findall(r'[a-z]+', full_text.lower()))
    if not submitted_tokens:
        return True, "No name to check"

    matched = submitted_tokens & ocr_tokens
    if matched:
        score = len(matched) / len(submitted_tokens)
        return True, f"Name '{submitted_name}' matched ({', '.join(matched)}, {score:.0%})"

    for nt in submitted_tokens:
        if len(nt) < 3:
            continue
        for ot in ocr_tokens:
            if len(ot) < 3:
                continue
            if edit_distance(nt, ot) <= (1 if len(nt) <= 5 else 2):
                return True, f"Name '{submitted_name}' fuzzy matched ('{nt}'~'{ot}')"

    return None, f"Name '{submitted_name}' not found in screenshot"


# ── Review Text Detection ─────────────────────────────────────────────────────

NOISE_WORDS = {
    'hover', 'to', 'react', 'weeks', 'ago', 'months', 'month', 'week', 'review', 'reviews',
    'write', 'a', 'the', 'and', 'or', 'in', 'at', 'google', 'maps', 'more', 'see', 'all',
    'photos', 'directions', 'call', 'share', 'outside', 'local', 'guide', 'star', 'stars',
    'insert', 'default', 'certificate', 'search', 'gemini', 'edited',
    'careers', 'courses', 'about', 'contact', 'join', 'team', 'why',
    'deep', 'tech', 'startup', 'pioneering', 'future', 'education',
    'logic', 'based', 'gamified', 'coding', 'internships', 'hands'
}

UI_LABELS = {
    'recents', 'saved', 'overview', 'reviews', 'about', 'layers',
    'share', 'like', 'close', 'more',
    's', 'k', 'j', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 't', 'u', 'v', 'w', 'x', 'y', 'z'
}


def classify_review_quality(review_text: str) -> str:
    """
    Classify the quality of the review text.

    Returns:
      'genuine'  — meaningful review with enough content (≥ 4 meaningful words)
      'short'    — too short or single low-effort word (hold for admin)
      'empty'    — no text, only symbols/punctuation, or whitespace only (hold)

    Rules:
    - Empty / only special chars / only punctuation → 'empty'
    - Single word or very short (< 15 chars of real letters) → 'short'
    - All low-effort words (good, ok, nice, etc.) → 'short'
    - Meaningful content → 'genuine'
    """
    if not review_text or not review_text.strip():
        return 'empty'

    text = review_text.strip()

    # Only special characters, numbers, punctuation — no real letters
    letters_only = re.sub(r'[^a-zA-Z\s]', '', text).strip()
    if len(letters_only) < 3:
        return 'empty'

    # Count meaningful words (≥ 4 chars, not noise)
    LOW_EFFORT = {
        'good', 'ok', 'okay', 'nice', 'great', 'fine', 'cool', 'wow',
        'best', 'bad', 'poor', 'worst', 'love', 'hate', 'like', 'well',
        'very', 'much', 'more', 'less', 'just', 'only', 'also', 'even',
        'super', 'amazing', 'awesome', 'excellent', 'perfect', 'wonderful',
    }

    words = re.findall(r'[a-zA-Z]{3,}', text.lower())
    meaningful = [w for w in words if w not in LOW_EFFORT and len(w) >= 4]

    # All words are low-effort single-word responses
    if len(words) <= 2 and all(w in LOW_EFFORT for w in words):
        return 'short'

    # Very short — fewer than 4 meaningful words
    if len(meaningful) < 4:
        return 'short'

    return 'genuine'


def has_written_review(boxes, full_text, submitted_name, image_path=""):
    """
    Check if the reviewer wrote actual text (not just stars).
    Returns (has_review: bool, review_text: str).
    """
    name_y, name_x = find_name_position(boxes, submitted_name)

    if name_y is not None and name_x is not None:
        review_words = []
        review_lines_raw = []
        skipped_reviews = False

        img_cv = cv2.imread(image_path) if image_path else None
        img_w = img_cv.shape[1] if img_cv is not None else 1920
        x_min = max(0, name_x - 200)
        x_max = min(img_w * 0.65, name_x + 500)

        name_idx = None
        for i, (text, x, y) in enumerate(boxes):
            if abs(y - name_y) < 5:
                name_idx = i
                break

        start_idx = (name_idx + 1) if name_idx is not None else 0

        for text, x, y in boxes[start_idx:]:
            tl = text.lower().strip()

            if x < x_min or x > x_max:
                continue
            if re.search(r'(weeks?|months?|days?|hours?)\s*ago', tl):
                continue
            if re.match(r'^[\*\s\u2605\u2606\u2b50kkxy]+$', tl, re.IGNORECASE):
                continue
            if re.search(r'\d+\s+reviews?', tl):
                if not skipped_reviews:
                    skipped_reviews = True
                    continue
                else:
                    break

            words = text.split()
            if (2 <= len(words) <= 4
                    and re.match(r'[A-Z]', text)
                    and not re.search(r'[.!?,]', text)
                    and not any(c.isdigit() for c in text)
                    and len(text) < 40
                    and tl not in UI_LABELS
                    and not any(w in UI_LABELS for w in tl.split())):
                break

            if tl in {'like', 'share', 'press and hold to react', 'helpful', 'report'}:
                break

            meaningful = [w for w in re.findall(r'[a-z]{4,}', tl) if w not in NOISE_WORDS]
            review_words.extend(meaningful)
            if meaningful:
                review_lines_raw.append(text)

        review_text = ' '.join(review_lines_raw)
        log(f"Review words: {len(review_words)}, text: '{review_text[:100]}'")
        return len(review_words) >= 3, review_text

    all_meaningful = [w for w in re.findall(r'[a-z]{4,}', full_text.lower()) if w not in NOISE_WORDS]
    log(f"Fallback: {len(all_meaningful)} meaningful words")
    return len(all_meaningful) >= 15, ""


# ── Main Classifier ───────────────────────────────────────────────────────────

def classify(image_path, submitted_name=""):
    """
    Classify a Google review screenshot.

    Automatically detects desktop layout (wide image with map panel) and
    crops to the review sidebar before running OCR — making it equivalent
    to a mobile screenshot for the rest of the pipeline.

    Returns dict: { status, reason, rating, text_preview, reviewer_name, name_matched }
    """
    if not os.path.exists(image_path):
        return {"status": "rejected", "reason": "Image file not found",
                "rating": None, "text_preview": "", "reviewer_name": "", "name_matched": False}

    # ── Step 0: Detect desktop layout and crop if needed ─────────────────────
    # This must happen BEFORE OCR so all coordinates are in the cropped space
    ocr_path, was_cropped = detect_and_crop_desktop(image_path)

    try:
        full_text, boxes = extract_text_and_boxes(ocr_path)
    except Exception as e:
        if was_cropped and os.path.exists(ocr_path):
            try: os.unlink(ocr_path)
            except Exception: pass
        return {"status": "rejected", "reason": f"OCR failed: {str(e)}",
                "rating": None, "text_preview": "", "reviewer_name": "", "name_matched": False}

    # Step 1: Find name position
    name_y, name_x = find_name_position(boxes, submitted_name) if submitted_name else (None, None)

    # Step 2: Find next reviewer boundary
    next_reviewer_y = find_next_reviewer_y(boxes, submitted_name, name_y) if (submitted_name and name_y is not None) else None

    # Step 2b: Find "Your review" section anchor (Google Maps layout)
    your_review_y = find_your_review_y(boxes)

    # Step 2c: Find timestamp line Y ("3 months ago" — same line as stars)
    timestamp_y = find_timestamp_y(boxes, name_y, next_reviewer_y)

    # Step 3: Detect star rating
    # Primary: read star characters from OCR boxes
    # For "Your review" layout, use your_review_y as the search anchor
    ocr_anchor_y = your_review_y if your_review_y is not None else name_y
    rating = detect_rating_from_ocr(boxes, ocr_anchor_y, next_reviewer_y)
    if rating is not None:
        log(f"Rating from OCR text: {rating}")

    # Fallback 1: HSV visual detection — use ocr_path (cropped if desktop)
    if rating is None:
        rating = detect_rating_visual(
            ocr_path, name_y, name_x, next_reviewer_y,
            your_review_y=your_review_y,
            timestamp_y_px=timestamp_y
        )
        if rating is not None:
            log(f"Rating from HSV visual: {rating}")

    # Fallback 2: Regex in full text
    if rating is None:
        for pat in [r'\b([1-5])\s*/\s*5\b', r'\b([1-5])\s*stars?\b']:
            m = re.search(pat, full_text, re.IGNORECASE)
            if m:
                rating = int(m.group(1))
                log(f"Rating from regex: {rating}")
                break

    # Fallback 3: Look for star count near "Your review" or name in OCR boxes
    # Google Maps sometimes renders "4" or "4.0" as a text box next to the stars
    if rating is None and (your_review_y is not None or name_y is not None or timestamp_y is not None):
        anchor = timestamp_y if timestamp_y is not None else (your_review_y if your_review_y is not None else name_y)
        for text, x, y in boxes:
            if not (anchor - 30 <= y <= anchor + 30):
                continue
            t = text.strip()
            # Match standalone digit 1-5 or "4.0", "3.0" etc.
            m = re.match(r'^([1-5])(?:\.0)?$', t)
            if m:
                candidate = int(m.group(1))
                log(f"Rating from standalone digit near anchor: '{t}' y={round(y)} → {candidate}")
                rating = candidate
                break

    log(f"Final rating: {rating}")

    # Step 4: Detect review text — use ocr_path (cropped if desktop)
    has_review, review_text = has_written_review(boxes, full_text, submitted_name, ocr_path)
    text_preview = (review_text or full_text)[:200].replace('\n', ' ')

    # Step 5: Name matching
    if submitted_name:
        name_matched, name_reason = check_name_in_text(full_text, submitted_name)
    else:
        name_matched, name_reason = True, "No name to check"

    # Step 6: Extract reviewer name from boxes
    reviewer_name = ""
    if submitted_name:
        for text, x, y in boxes:
            cleaned = re.sub(r'\s+\d+\s*(review|photo)s?.*', '', text, flags=re.IGNORECASE).strip()
            tokens = cleaned.split()
            if (2 <= len(tokens) <= 4
                    and re.match(r'[A-Z]', cleaned)
                    and not re.search(r'[.!?,\d]', cleaned)
                    and len(cleaned) < 50):
                nm_tokens = set(re.findall(r'[a-z]+', submitted_name.lower()))
                cl_tokens = set(re.findall(r'[a-z]+', cleaned.lower()))
                if nm_tokens & cl_tokens:
                    reviewer_name = cleaned
                    break

    log(f"name_matched={name_matched}, has_review={has_review}, rating={rating}")

    # Classify review text quality
    review_quality = classify_review_quality(review_text)
    log(f"Review quality: '{review_quality}' (text='{review_text[:60]}')")

    # Helper: clean up temp cropped file before returning
    def _cleanup():
        if was_cropped and os.path.exists(ocr_path):
            try: os.unlink(ocr_path)
            except Exception: pass

    # ── Classification Rules (aligned with new scoring spec) ─────────────────

    # Rule 1: No name match → REJECT immediately
    if name_matched is None:
        _cleanup()
        return {"status": "rejected",
                "reason": f"Name not found in screenshot — {name_reason}. Submission rejected.",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": False}

    # Rule 2: 1 star → REJECT
    if rating is not None and rating == 1:
        _cleanup()
        return {"status": "rejected",
                "reason": f"1-star rating — minimum 3 stars required for approval.",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": bool(name_matched)}

    # Rule 3: 2 stars → HOLD
    if rating is not None and rating == 2:
        _cleanup()
        return {"status": "review",
                "reason": f"2-star rating — held for admin review (minimum 3 stars for auto-approval).",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": bool(name_matched)}

    # Rule 4: No written review text at all → REJECT
    if not has_review and review_quality == 'empty':
        _cleanup()
        return {"status": "rejected",
                "reason": f"No written review text found (rating: {rating}/5). A written review is required.",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": bool(name_matched)}

    # Rule 5: Review text is too short or low-effort → HOLD (even with 5 stars)
    # e.g. "good", "ok", "nice", single words, only punctuation
    if review_quality in ('short', 'empty'):
        _cleanup()
        return {"status": "review",
                "reason": f"Review text is too short or low-effort ('{review_text[:40]}') — held for admin review. A meaningful written review is required.",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": bool(name_matched)}

    # Rule 6: Rating ≥ 3 + genuine review + name matched → SELECTED
    if rating is not None and rating >= 3 and review_quality == 'genuine':
        _cleanup()
        return {"status": "selected",
                "reason": f"Valid review — {name_reason}, rating {rating}/5, genuine review text",
                "rating": rating, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": True}

    # Rule 7: Rating not detected but name matched + genuine review → HOLD
    if name_matched and review_quality == 'genuine':
        _cleanup()
        return {"status": "review",
                "reason": f"Genuine review text found but star rating could not be detected — held for admin review.",
                "rating": None, "text_preview": text_preview,
                "reviewer_name": reviewer_name, "name_matched": True}

    # Rule 8: Fallback → HOLD
    _cleanup()
    return {"status": "review",
            "reason": f"Rating or review quality unclear — held for manual admin review.",
            "rating": None, "text_preview": text_preview,
            "reviewer_name": reviewer_name, "name_matched": bool(name_matched)}


# ── CLI Entry Point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "rejected", "reason": "Usage: python analyze.py <image_path> [name]"}))
        sys.exit(1)

    image_arg = sys.argv[1]
    submitted_name = sys.argv[2] if len(sys.argv) > 2 else ""

    tmp_path = None
    if image_arg == "-":
        raw = sys.stdin.read().strip()
        if ',' in raw:
            raw = raw.split(',', 1)[1]
        try:
            img_bytes = base64.b64decode(raw)
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name
            image_arg = tmp_path
        except Exception as e:
            print(json.dumps({"status": "rejected", "reason": f"base64 decode failed: {e}"}))
            sys.exit(1)

    try:
        result = classify(image_arg, submitted_name)
        print(json.dumps(result))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
