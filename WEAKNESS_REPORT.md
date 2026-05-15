# CertiVerify AI: System Audit & Weakness Report

## System Intention
CertiVerify AI is designed as a production-ready SaaS platform for hackathons and events. Its core purpose is to automate the verification of participant contributions (specifically Google Reviews) and issue cryptographic, tamper-proof certificates. It aims to reduce manual administrative overhead while maintaining a high bar for authenticity through AI-powered OCR and fraud detection.

## Architecture Overview
- **Frontend**: Next.js (App Router) with Tailwind CSS and Framer Motion for a premium dark-themed UI.
- **Backend**: Next.js Route Handlers encapsulated in service layers (e.g., `submissionService.ts`).
- **Database**: PostgreSQL with Prisma ORM for type-safe data access. Indexed `canonicalEmail` for fast duplicate detection.
- **AI/OCR**: A hybrid approach using `analyze.py` (Python) with PaddleOCR for text extraction and OpenCV for visual detection, protected by a concurrency control mechanism.
- **Security**: JWT-based authentication with `RevokedToken` support, `SameSite: Strict` cookie policies, and IP-based rate limiting.
- **Validation**: Schema-based input validation using `Zod` across critical endpoints.
- **Delivery**: Multi-provider SMTP fallback mechanism for reliable certificate dispatch via email.

## Remediated Weaknesses

### 1. Hardcoded Security Defaults
- **Weakness**: Hardcoded fallback JWT secrets in middleware and login routes.
- **Remediation**: Removed all hardcoded fallbacks. Application now fails fast if `JWT_SECRET` is missing.

### 2. Duplicate Detection Evasion & Performance
- **Weakness**: Simple email string matching was bypassable by Gmail aliases. In-memory filtering was inefficient.
- **Remediation**: Implemented robust email normalization and added an indexed `canonicalEmail` field to the database for efficient, bypass-resistant duplicate checks.

### 3. Lack of Rate Limiting
- **Weakness**: Critical API endpoints like `/api/submissions` and `/api/admin/login` were vulnerable to brute-force.
- **Remediation**: Implemented an IP-based rate limiter (5 req/10m for submissions, 5 req/15m for login).

### 4. Minimal Input Validation
- **Weakness**: Critical API endpoints accepted raw JSON payloads with minimal validation.
- **Remediation**: Integrated `Zod` for strict schema validation of all incoming data.

### 5. Admin Session Management & Revocation
- **Weakness**: Admin tokens had long lifetimes (24h) and no revocation mechanism.
- **Remediation**: Reduced token lifetime to 12 hours, enforced `SameSite: Strict` cookie policies, and implemented a token revocation list (logout support).

### 6. OCR Resource Exhaustion
- **Weakness**: Unbounded concurrent OCR processes could crash the server.
- **Remediation**: Implemented a semaphore-based concurrency control mechanism to limit simultaneous Python processes.

### 7. Code Structure & Stability
- **Weakness**: Coupled business logic and numerous TypeScript errors in the build.
- **Remediation**: Refactored logic into service layers and resolved all TypeScript errors (FormTemplateBuilder, seed scripts, loggers).

## Future Scalability & Risk Audit (Potential Issues)

### 1. Database Connection Pooling
- **Risk**: Prisma may exhaust PostgreSQL connection limits under high concurrent load if not using a pooler (e.g., PgBouncer).

### 2. PDF Font Constraints (UTF-8)
- **Risk**: Standard PDF fonts do not support full UTF-8. Non-Latin scripts or emojis in participant names may be stripped despite sanitization. Future migration to custom font embedding is recommended.

### 3. In-Memory Rate Limiting in Serverless
- **Risk**: The current rate limiter uses local memory. In a distributed/serverless environment (like Vercel), limits will be enforced per-instance rather than globally.
- **Recommendation**: Migrate to a Redis-based rate limiter for distributed accuracy.

### 4. OCR Process Management
- **Risk**: Synchronous process spawning for OCR can still lead to latency issues.
- **Recommendation**: Move to a background worker pattern (BullMQ/Redis) for long-running tasks.
