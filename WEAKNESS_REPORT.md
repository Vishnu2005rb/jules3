# CertiVerify AI: System Audit & Weakness Report

## System Intention
CertiVerify AI is designed as a production-ready SaaS platform for hackathons and events. Its core purpose is to automate the verification of participant contributions (specifically Google Reviews) and issue cryptographic, tamper-proof certificates. It aims to reduce manual administrative overhead while maintaining a high bar for authenticity through AI-powered OCR and fraud detection.

## Architecture Overview
- **Frontend**: Next.js 16 (App Router) with Tailwind CSS and Framer Motion for a premium dark-themed UI.
- **Backend**: Next.js Route Handlers (API) following the "proxy" convention.
- **Database**: PostgreSQL with Prisma ORM for type-safe data access.
- **AI/OCR**: A hybrid approach using `analyze.py` (Python) with PaddleOCR for high-accuracy text extraction and OpenCV for visual element detection (e.g., star ratings).
- **Security**: JWT-based authentication for admin routes, SHA-256 hashing for certificate integrity and screenshot deduplication.
- **Delivery**: Multi-provider SMTP fallback mechanism for reliable certificate dispatch via email.

## Identified & Remediated Weaknesses

### 1. Hardcoded Security Defaults (Remediated)
- **Weakness**: `src/middleware.ts` and the admin login route contained a hardcoded fallback JWT secret. If the `JWT_SECRET` environment variable was missing, the system would default to a known, insecure key.
- **Impact**: An attacker could forge administrative tokens if they knew the default key, gaining full access to the event management and participant data.
- **Remediation**: Removed the hardcoded fallback. The application now explicitly throws an error at startup or runtime if the `JWT_SECRET` is not provided in the environment.

### 2. Duplicate Detection Evasion (Remediated)
- **Weakness**: The duplicate detection logic used simple string matching for emails.
- **Impact**: Participants could bypass the "one certificate per person" rule by using Gmail sub-addresses (e.g., `user+extra@gmail.com`) or variations with dots (e.g., `u.s.er@gmail.com`), which most providers deliver to the same inbox.
- **Remediation**: Implemented robust email normalization (canonicalization). The system now strips dots and plus-extensions for common providers before performing duplicate checks.

### 3. Certificate Data Mangling (Remediated)
- **Weakness**: The `sanitize` function in the PDF generation logic silently stripped characters that were incompatible with the standard PDF `WinAnsi` encoding.
- **Impact**: Names with non-Latin characters or certain symbols would appear "mangled" or missing parts on the final certificate, leading to poor user experience and perceived system failure.
- **Remediation**: Enhanced the `sanitize` function to log warnings for character removal. This provides immediate feedback in server logs for troubleshooting and highlights the need for future UTF-8 font embedding support.

## Outstanding Weaknesses & Recommendations

### 1. Lack of Rate Limiting
- **Status**: **Outstanding**
- **Vulnerability**: Critical API endpoints such as `/api/submissions` and `/api/admin/login` do not have built-in rate limiting.
- **Recommendation**: Implement a middleware or utility (e.g., using Upstash Redis or a local memory cache) to limit the number of requests per IP/Email within a specific timeframe to prevent brute-force and DoS attacks.

### 2. Minimal Input Validation
- **Status**: **Outstanding**
- **Vulnerability**: While basic presence checks exist, complex fields like `socialLinks` and `dynamicFields` (JSON) are accepted with minimal validation.
- **Recommendation**: Integrate a schema validation library like `Zod` to strictly define and validate the structure of all incoming request bodies.

### 3. OCR Resource Exhaustion
- **Status**: **Outstanding**
- **Vulnerability**: Each submission triggers a call to `analyze.py`, which spawns a Python process and runs PaddleOCR (a resource-intensive task).
- **Recommendation**: Move OCR processing to an asynchronous worker queue (e.g., BullMQ) to prevent API timeouts and handle traffic spikes gracefully without overwhelming the main application server.

### 4. Admin Session Management
- **Status**: **Outstanding**
- **Vulnerability**: Admin tokens are valid for 24 hours without a mechanism for revocation (other than expiry).
- **Recommendation**: Implement a session-store or a blacklist for revoked tokens to allow immediate logout/session termination in case of compromise.
