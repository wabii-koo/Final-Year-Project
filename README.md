# 🛡️ GuardianGate — Digital Parent-School Communication System

**GuardianGate** is a secure, role-controlled, and structured portal designed for **Hawi Dandi Boru School** to bridge the communication gap between guardians, teachers, and school administrators. 

The system ensures seamless interaction, accountability, and transparency through real-time notifications, direct messaging, homework tracking, academic report card releases, secure student pickup authorization, and automated KYC registration for guardians.


## 🚀 Tech Stack

### Frontend
* **Framework**: Next.js 14 (App Router)
* **Library**: React 18
* **Styling**: Tailwind CSS v4
* **State Management & Data Fetching**: TanStack React Query (v5) & React Query (v3)
* **Form Management**: React Hook Form
* **Client & HTTP**: Axios & JS-Cookie
* **Icons**: Lucide React

### Backend
* **Runtime**: Node.js & TypeScript
* **Framework**: Express.js
* **ORM**: Sequelize ORM
* **Validation**: Joi
* **File Uploads**: Multer (Disk storage for KYC documents, Memory storage for CSVs)
* **Email Service**: Nodemailer (SMTP/Gmail configuration for OTPs & notifications)
* **Security**: Helmet, Compression, Cors, Express-Rate-Limit, BCryptJS, JSON Web Tokens (JWT)

### Database
* **Engine**: PostgreSQL (Hosted on Supabase)
* **Local/Alternative Schema**: MySQL Schema Support (`/database`)


## 🏛️ System Architecture & Roles Matrix

The platform is designed with a strict Role-Based Access Control (RBAC) mechanism. The roles and their privileges include:

| Role | Privileges & Responsibilities |
| :--- | :--- |
| **👑 Director** | Accesses global statistics, reads system-wide Audit Logs, reviews academic/communication reports, and unlocks or overrides report cards. |
| **📋 Registrar** | Manages the student database, imports students via CSV, manages student-classroom-teacher mappings, and reviews, approves, or rejects guardian registration requests (KYC check). |
| **✏️ Teacher** | Posts homework assignments to assigned classrooms, monitors guardian view states (`viewedAt` logs), and tracks homework completion. |
| **🏫 Homeroom Teacher** | Manages classroom activities, communicates directly with assigned guardians, drafts student report cards (conduct, grades, and attendance), and processes student pickup requests. |
| **👥 Guardian** | Self-registers via OTP and KYC validation, tracks child's homework, sends direct feedback, chats with the homeroom teacher, receives notifications, views report cards, and submits student pickup requests. |


## 🛠️ Installation & Setup Guide

### Prerequisites
* **Node.js**: v18.x or v20.x
* **Database**: PostgreSQL Instance (e.g. Supabase) or local MySQL instance

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the variables in `.env`:
   ```ini
   PORT=3000
   NODE_ENV=development

   # Supabase / PostgreSQL Connection string
   DB_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
   DB_DIALECT=postgres

   # JWT Security Key
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h

   # Nodemailer SMTP Email Configurations
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_gmail_app_password
   MAIL_FROM=your_email@gmail.com
   ```
5. Run the TypeScript build and start the server:
   * **Development Mode (Hot Reloading)**:
     ```bash
     npm run dev
     ```
   * **Production Build & Run**:
     ```bash
     npm run build
     npm start
     ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend/` directory:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
4. Start the frontend Next.js dev server:
   * **Development Mode**:
     ```bash
     npm run dev
     ```
   * **Production Build & Run**:
     ```bash
     npm run build
     npm start
     ```
   * Access the web application at `http://localhost:3001` (configured for port 3001 to avoid conflicts).

## 💎 Core Feature Workflows

### 🛡️ Guardian KYC Self-Registration Flow
```mermaid
sequenceDiagram
    participant G as Guardian (Client)
    participant B as Backend Server
    participant E as SMTP Email Service
    participant R as Registrar (Dashboard)
    
    G->>B: 1. Submit Registration Form (Email, Name, Phone, Child Name)
    B->>B: Generate 6-Digit OTP & Store in DB
    B->>E: Send OTP to Guardian Email
    E-->>G: Deliver OTP Email
    G->>B: 2. Submit OTP Code for Verification
    B-->>G: OTP Verified successfully
    G->>B: 3. Complete KYC Upload (Birth Cert, ID Front, ID Back)
    B->>B: Store files in upload/documents/ & Create PendingRegistration
    R->>B: 4. Fetch Pending Registrations & Documents
    Note over R: Registrar inspects ID images & matches student names
    alt Approvable Data
        R->>B: Approve Registration
        B->>B: Create active User (Role: guardian) & Map to Student
        B->>E: Send Login details to Guardian
    else Discrepancy Found
        R->>B: Reject Registration (Specify reason)
        B->>B: Set Status to "correction_required"
        B->>E: Notify Guardian with Rejection Reason
        G->>B: Re-upload corrected documents (Up to 3 attempts)
    end

### 💬 Chat Messaging & Soft Deletion
Guardians can message their child's Homeroom Teacher. To protect message history for audit and compliance, the system utilizes a **soft delete mechanism**:
* `deleted_by_sender`: Setting this to `TRUE` hides the message from the sender's dashboard.
* `deleted_by_receiver`: Setting this to `TRUE` hides the message from the recipient's dashboard.
* The message remains intact in the database for admin audit purposes.

### 🚗 Student Pickup Requests
Guardians can pre-authorize individuals to pick up their child. Security validations include:
* **Fayda Identification Number (Ethiopian National ID)**: Validated strictly against a `12-digit` pattern constraint.
* **Ethiopian Phone Format**: Validated strictly against local prefix rules (`+251`, `251`, or `0` followed by `9` or `7` and `8` digits).
* **Processing**: Homeroom Teachers review request parameters (authorized name, phone, relationship, date, and notes) and either **Approve** or **Reject** the request.

### 📝 Bulk Student Imports (Registrar)
Registrars can upload a CSV to import students into classrooms.
* **Required CSV Fields**: `fullName`, `dob` (YYYY-MM-DD), `emergencyContact` (Ethiopian phone format), `classLevel`.
* A sample template `students_template.csv` is available in the root folder for formatting reference.

## 📊 Database Models & Schema Design

The system runs on Sequelize with dynamic mapping to PostgreSQL tables. Key entities include:

* **`User`**: Account records for Directors, Registrars, Teachers, and Guardians. Contains password hashes, roles, and status fields.
* **`Student`**: Holds child details (`fullName`, `dob`, `emergencyContact`) and maps to a `guardianId` and `classId`.
* **`Classroom`**: Links a class level (e.g., Grade 1-A) to teachers and homeroom teachers.
* **`Homework`**: Assignments containing description, subject, class mapping, and due dates.
* **`HomeworkView` / `HomeworkFeedback`**: Tracks when a guardian views a homework item (`viewedAt`) and any completion comments left by the parent.
* **`Message`**: Stores user-to-user communication.
* **`PickupRequest`**: Authorization requests for child pickups.
* **`ReportCard`**: Term evaluations including subject grades, conduct, and teacher comments.
* **`PendingRegistration` / `OTP`**: Pre-login tables storing verification states and document path strings for new guardians.
* **`SystemLog`**: Log auditing for critical admin operations.


## 🔒 Security Measures
* **Security Headers**: Configured using `Helmet` middleware.
* **API Rate Limiting**: Limit of 100 requests per 15-minute window for active production endpoints (unrestricted/high limit for local development testing).
* **GZIP Compression**: Handled on Express responses via `compression`.
* **Input Validation**: Hardened with strict `Joi` schemas on all inputs.
* **Authentication**: Cookie-based or Header Authorization Bearer JWT verification.


## 📄 License
This project is licensed under the **MIT License**. For queries, contact support at `hawischool@gmail.com`.
