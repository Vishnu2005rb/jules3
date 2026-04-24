# AI-Powered Hackathon Certificate & Review Verification Platform

A production-ready, scalable web application for hackathons to automate project review verification and certificate issuance using OCR and dynamic PDF generation.

## 🚀 Features

- **Multi-step Submission:** Easy user flow for details, image upload, and status tracking.
- **AI-Powered OCR:** Automated text extraction from review screenshots using Tesseract.js.
- **Intelligent Scoring:** Automated verification scoring (0-100) with fraud detection.
- **Auto-Approval:** Submissions with high scores are automatically approved and certified.
- **Dynamic Certificates:** Instant PDF generation with unique QR codes for public verification.
- **Admin Dashboard:** Comprehensive management of events, submissions, and analytics.
- **Secure Auth:** JWT-based session management for admin routes.
- **Modern UI:** Responsive, SaaS-style purple/blue gradient theme using Tailwind CSS.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Aiven/Supabase)
- **ORM:** Prisma
- **Auth:** JWT / jose
- **OCR:** Tesseract.js
- **PDF:** pdf-lib & qrcode
- **Email:** Nodemailer (SMTP)
- **Styling:** Tailwind CSS

---

## 💻 Local Development Setup (VS Code)

Follow these steps to get the project running on your local machine:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [Git](https://git-scm.com/)
- A PostgreSQL database (e.g., [Aiven](https://aiven.io/) or local)
- SMTP credentials (e.g., [Gmail App Password](https://support.google.com/accounts/answer/185833))

### 2. Clone the Repository
```bash
git clone <repository-url>
cd hackathon-platform
```

### 3. Install Dependencies
Open your VS Code terminal and run:
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in the **project root directory** (the same folder where `package.json` and `README.md` are located).

Copy the contents of `.env.example` into your new `.env` file and fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Auth
JWT_SECRET="your-super-secret-key-change-this"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Database Setup
Sync your database schema with Prisma:
```bash
npx prisma db push
```

### 6. Start the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🧪 Testing the Flow

1. **Admin Setup:**
   - Go to `/admin/login`.
   - Use `admin` / `password123` (Note: Ensure the Admin user exists in the DB via seed or manual insert).
   - Create an Event in the "Event Manager" section.

2. **User Submission:**
   - Go to `/submit`.
   - Fill in details and upload a screenshot containing the event name.
   - The system will run OCR and provide an instant score.

3. **Verification:**
   - Go to `/verify`.
   - Enter a Certificate ID or scan the QR code from a generated PDF.

---

## 🛠️ Troubleshooting

### Prisma Client Error
If you see `@prisma/client did not initialize yet`, run:
```bash
npx prisma generate
```
This error usually happens if the environment hasn't been synced with the database schema yet.

### Database Connection Issues
Ensure your `DATABASE_URL` in the `.env` file is correct and accessible. If using a cloud provider like Aiven or Supabase, make sure the `sslmode=require` (or `no-verify` depending on setup) parameter is included.

---

## 📂 Project Structure

A visual guide to where your files (including `.env`) should be located:

```text
hackathon-platform/
├── prisma/               # Database schema
├── public/               # Static assets
├── src/                  # Source code
│   ├── app/              # Pages & API routes
│   └── lib/              # Core business logic
├── .env                  # <--- CREATE THIS FILE HERE
├── .env.example          # Template for .env
├── package.json          # Project dependencies
├── prisma.config.ts      # Prisma configuration
└── README.md             # This file
```

- `/src/app`: Next.js pages and API routes.
- `/src/lib`: Core logic (OCR, Certificate Gen, Scoring, Mail).
- `/prisma`: Database schema and configuration.
- `/public`: Static assets.

## 📄 License
MIT
