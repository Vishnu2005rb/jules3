# CertiVerify AI: System Audit & Weakness Report

## System Intention
CertiVerify AI is designed as a production-ready SaaS platform for hackathons and events. Its core purpose is to automate the verification of participant contributions (specifically Google Reviews) and issue cryptographic, tamper-proof certificates. It aims to reduce manual administrative overhead while maintaining a high bar for authenticity through AI-powered OCR and fraud detection.

## Architecture Overview
- **Frontend**: Next.js 16 (App Router) with Tailwind CSS and Framer Motion for a premium dark-themed UI.
- **Backend**: Next.js Route Handlers (API) following the "proxy" convention. Logic is encapsulated in service layers (e.g., `submissionService.ts`).
- **Database**: PostgreSQL with Prisma ORM for type-safe data access.
- **AI/OCR**: A hybrid approach using `analyze.py` (Python) with PaddleOCR for high-accuracy text extraction and OpenCV for visual element detection.
- **Security**: JWT-based authentication with secure cookie policies, SHA-256 hashing for integrity, and IP-based rate limiting.
- **Validation**: Schema-based input validation using `Zod` across critical endpoints.
- **Delivery**: Multi-provider SMTP fallback mechanism for reliable certificate dispatch via email.

## Remediated Weaknesses

### 1. Hardcoded Security Defaults
- **Weakness**: `src/middleware.ts` and the admin login route contained a hardcoded fallback JWT secret.
- **Remediation**: Removed the hardcoded fallback. The application now explicitly throws an error at startup if `JWT_SECRET` is missing.

### 2. Duplicate Detection Evasion
- **Weakness**: The duplicate detection logic used simple string matching for emails.
- **Remediation**: Implemented robust email normalization (canonicalization). The system now strips dots and plus-extensions for common providers before performing duplicate checks.

### 3. Lack of Rate Limiting
- **Weakness**: Critical API endpoints like `/api/submissions` and `/api/admin/login` were vulnerable to brute-force and DoS.
- **Remediation**: Implemented an in-memory rate limiter that restricts submissions and login attempts per IP.

### 4. Minimal Input Validation
- **Weakness**: Critical API endpoints accepted JSON payloads with minimal validation.
- **Remediation**: Integrated `Zod` to strictly validate all incoming data for submissions and admin logins, preventing malformed or malicious payloads.

### 5. Admin Session Management
- **Weakness**: Admin tokens were valid for 24 hours with loose cookie policies and missing security headers.
- **Remediation**: Reduced token lifetime to 12 hours, set `SameSite: Strict` for the `admin_token` cookie, and added security headers (`X-Frame-Options`, etc.) to admin responses.

### 6. Code Structure & Maintainability
- **Weakness**: Complex business logic was tightly coupled within API route handlers.
- **Remediation**: Refactored the submission process into a dedicated `submissionService`, improving testability and separation of concerns.

## Outstanding Weaknesses & Recommendations

### 1. OCR Resource Exhaustion
- **Status**: **Outstanding**
- **Vulnerability**: Each submission triggers a synchronous call to `analyze.py`, which is resource-intensive.
- **Recommendation**: Move OCR processing to an asynchronous worker queue (e.g., BullMQ) to prevent API timeouts and handle traffic spikes gracefully.

### 2. Admin Token Revocation
- **Status**: **Outstanding**
- **Vulnerability**: No mechanism for manual token revocation before expiry.
- **Recommendation**: Implement a session-store or blacklist for revoked tokens to allow immediate logout in case of compromise.
