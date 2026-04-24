# CertiVerify AI: Advanced Hackathon Verification Platform

A premium, production-ready SaaS application for hackathons that automates the verification of participant project reviews and issues cryptographic, tamper-proof certificates.

---

## 🎨 Modern Premium UI
- **Visual Excellence**: Dark-themed, glassmorphism UI with neon purple/blue glowing effects.
- **Fluid UX**: Staggered entry animations, smooth transitions, and hover-reactive elements powered by Framer Motion.
- **Design Studio**: Integrated visual builders for custom submission forms and certificate layouts.

## 🚀 Intelligent Core Features
- **AI-Powered OCR**: Automated text extraction and validation from review screenshots.
- **Cryptographic Trust**: Certificates feature unique Ledger IDs and QR codes for instant public verification.
- **Fraud Intelligence**: Image hashing (SHA-256) and similarity checks to prevent duplicate claims.
- **Automated Workflow**: Real-time scoring and instant dispatch of high-quality PDFs via SMTP.

---

## 💻 VS Code Step-by-Step Installation Guide

Follow these instructions to set up the CertiVerify AI platform on your local machine using Visual Studio Code.

### 1. Initial Setup
*   **Install Node.js**: Ensure you have [Node.js (v20+)](https://nodejs.org/) installed.
*   **VS Code Extensions**: (Recommended) Install the **Prisma** and **Tailwind CSS IntelliSense** extensions.

### 2. Project Initialization
1.  **Open VS Code** and use the terminal (`Ctrl+` or `Cmd+`):
    ```bash
    git clone <repository-url>
    cd hackathon-platform
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```

### 3. Environment Configuration
1.  In the VS Code explorer, create a new file named **`.env`** in the project's root folder.
2.  Paste and configure the following required variables:
    ```env
    # 🗄️ Database (PostgreSQL)
    DATABASE_URL="postgresql://user:password@host:port/db_name?sslmode=require"

    # 🔐 Security
    JWT_SECRET="your_secure_random_string_here"

    # 📧 Email Delivery (SMTP)
    SMTP_HOST="smtp.gmail.com"
    SMTP_PORT=465
    SMTP_USER="your-email@gmail.com"
    SMTP_PASS="your-app-specific-password"
    SMTP_FROM="Certificates <certificates@yourdomain.com>"

    # 🌐 Application
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

### 4. Database Orchestration
1.  **Sync Schema**: Apply the Prisma schema to your PostgreSQL instance:
    ```bash
    npx prisma db push
    ```
2.  **Seed Admin Account**: Create the default administrator account:
    ```bash
    node seed.mjs
    ```
    *Credentials: Username: `admin` | Password: `admin123`*

### 5. Launch the Platform
1.  **Start Dev Server**:
    ```bash
    npm run dev
    ```
2.  **Access Port**: Open your browser to **`http://localhost:3000`**.

---

## 🔐 Admin & Management Flow

1.  **Authentication**: Navigate to `/admin/login` and enter the credentials from the seeding step.
2.  **Design Layouts**: Use the **Design Studio** (Template Manager) to build custom submission protocols and certificate blueprints.
3.  **Deploy Events**: In the **Event Controller**, create a new event and link your designed templates.
4.  **Monitor Intelligence**: Access the **Admin Dashboard** to view real-time AI scores, OCR outputs, and manage approval overrides.

---

## 🛠️ Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| **Prisma Not Initialized** | Run `npx prisma generate` to rebuild the client. |
| **Authentication Loops** | Ensure `JWT_SECRET` is set in `.env` and restart the server. |
| **Email Not Sending** | Verify SMTP credentials and ensure "Less Secure Apps" or "App Passwords" are enabled for Gmail. |
| **OCR Accuracy** | Ensure uploaded screenshots are clear and contain the exact event keywords defined in the Event settings. |

---

## 📂 Visual Project Map

```text
hackathon-platform/
├── src/
│   ├── app/              # UI Components, Layouts, and API Logic
│   └── lib/              # AI (OCR), PDF Engine, and Security Logic
├── prisma/               # Database Schema (schema.prisma)
├── public/               # Global static assets
├── seed.mjs              # Admin initialization script
├── .env                  # <--- SECURE CONFIGURATION (Create this!)
├── package.json          # Dependency manifest
└── README.md             # This comprehensive guide
```

## 📄 License
Licensed under MIT. Built for the future of decentralized hackathon verification.
