# 📦 Node Modules & Algorithms Used in GuardianGate

This document explains every Node.js module and every algorithm or technique
used in the **GuardianGate – Digital Parent-School Communication System**.
Each entry shows **what the module is**, **where it is used** in the code,
and **why it was chosen**.

---

## 🖥️ BACKEND

### ─────────────────────────────────────────
### 🔐 Security & Authentication Modules
### ─────────────────────────────────────────

---

### 1. `bcryptjs` — Password Hashing
**Version:** `^2.4.3`
**Algorithm Used:** **Blowfish (bcrypt)**

**What it is:**
A library that converts plain-text passwords into a secure, unreadable hash
before they are stored in the database. It also provides a function to compare
a plain-text password against a stored hash during login.

**Where it is used in the code:**

| File | Line(s) | What Happens |
|---|---|---|
| `backend/src/services/authService.ts` | Line 37–44 | Hashes new user passwords with 12 salt rounds; compares on login |
| `backend/src/controllers/guardianRegistrationController.ts` | Line 177 | Hashes the password when a guardian completes registration |
| `backend/src/controllers/userController.ts` | Line 173 | Hashes the password when an admin creates a new user |

**How the algorithm works:**
```
Plain Password  →  bcrypt.hash(password, 12)  →  "$2a$12$xK9mZ..." (stored in DB)
Login attempt   →  bcrypt.compare(input, hash) →  true or false
```
- The number `12` is the **salt rounds** (work factor). It means the hash
  computation is repeated **2¹² = 4,096 times**, making brute-force attacks
  extremely slow.
- A random **salt** is mixed into every hash, so two identical passwords
  produce completely different hash strings — preventing rainbow table attacks.

**Code from your project:**
```ts
// backend/src/services/authService.ts
static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
```

---

### 2. `jsonwebtoken` — Session Tokens
**Version:** `^9.0.2`
**Algorithm Used:** **HS256 (HMAC-SHA256)**

**What it is:**
A library for creating and verifying JSON Web Tokens (JWT). After a user
logs in, the server signs a token and sends it to the client. Every
subsequent API request carries this token so the server knows who is making
the request without needing to query the database again.

**Where it is used in the code:**

| File | Line(s) | What Happens |
|---|---|---|
| `backend/src/services/authService.ts` | Line 20 | Signs a new JWT token on successful login |
| `backend/src/services/authService.ts` | Line 30 | Verifies and decodes a JWT token |
| `backend/src/middleware/auth.ts` | Line 24 | Checks the token on every protected API request |

**How the algorithm works:**
```
Header  = { "alg": "HS256", "typ": "JWT" }
Payload = { userId, email, role, permissions, iat, exp }
Signature = HMAC_SHA256(Base64(Header) + "." + Base64(Payload), JWT_SECRET)

Final Token = Base64(Header) . Base64(Payload) . Signature
```
- **HS256** = HMAC with SHA-256. The server signs the payload using the
  `JWT_SECRET` from your `.env` file.
- The token **expires after 24 hours** (`JWT_EXPIRES_IN=24h`).
- If someone tampers with the token, the signature will no longer match
  and the request is rejected with `403 Forbidden`.

**Code from your project:**
```ts
// backend/src/services/authService.ts
return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' }); // on login

const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; // on each request
```

**Token payload contains:**
```json
{
  "userId": 42,
  "email": "guardian@example.com",
  "role": "guardian",
  "permissions": ["read:homework", "read:report_card"],
  "iat": 1717359999,
  "exp": 1717446399
}
```

---

### 3. `crypto` (Node.js Built-in) — OTP Generation
**Algorithm Used:** **CSPRNG (Cryptographically Secure Pseudo-Random Number Generation)**

**What it is:**
Node.js has a built-in `crypto` module that uses the operating system's
hardware entropy source to generate truly unpredictable random numbers.
Your project uses it to generate the 6-digit OTP codes emailed to guardians
during registration.

**Where it is used in the code:**

| File | Line(s) | What Happens |
|---|---|---|
| `backend/src/services/otpService.ts` | Line 30 | Generates a 6-digit unpredictable OTP code |

**How the algorithm works:**
```
crypto.randomInt(100000, 999999)  →  e.g. 483921
```
- **Why not `Math.random()`?** — `Math.random()` is a **pseudo-random**
  generator seeded from the current time. It is predictable and can be
  reverse-engineered by attackers. `crypto.randomInt` draws from the OS
  entropy pool and is **cryptographically unpredictable**.

**Code from your project:**
```ts
// backend/src/services/otpService.ts
static async generateOTP(identifier: string): Promise<string> {
    const code = crypto.randomInt(100000, 999999).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // expires in 10 min

    await OTPModel.upsert({ identifier, code, expiresAt, attempts: 0 });
    return code;
}
```

**OTP Security Rules applied in your code:**
- ✅ Expires in **10 minutes**
- ✅ Maximum **3 attempts** — after that the OTP is deleted
- ✅ Deleted from the database immediately after successful verification
- ✅ UPSERT logic: requesting a new OTP replaces the old one

---

### ─────────────────────────────────────────
### ✅ Validation Module
### ─────────────────────────────────────────

---

### 4. `joi` — Input Validation
**Version:** `^17.11.0`
**Algorithm Used:** **Schema-Based Pattern Matching with Regex**

**What it is:**
A validation library that checks incoming request data against strict rules
before any database logic runs. If the data is invalid, it immediately returns
`422 Unprocessable Entity` with detailed error messages.

**Where it is used in the code:**

| File | Line(s) | Validates |
|---|---|---|
| `backend/src/middleware/validation.ts` | Line 31–90 | Guardian registration form |
| `backend/src/middleware/validation.ts` | Line 92–101 | Login form |
| `backend/src/middleware/validation.ts` | Line 103–118 | Messages |
| `backend/src/middleware/validation.ts` | Line 120–140 | Notifications |
| `backend/src/middleware/validation.ts` | Line 161–185 | Homework creation |
| `backend/src/middleware/validation.ts` | Line 219–244 | Events |

**Regex Algorithms used in your validation schemas:**

| Field | Regex Pattern | What It Enforces |
|---|---|---|
| Ethiopian Phone | `/^(?:\+251\|251\|0)[97]\d{8}$/` | Valid Ethio Telecom / Safaricom format |
| Password Strength | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])/` | Upper + Lower + Number + Special char |
| Fayda ID (FIN) | `/^[0-9]{12}$/` | Exactly 12 digits — Ethiopian National ID |
| Email | `Joi.string().email()` | Standard RFC 5322 email format |
| Student DOB | `Joi.date().iso()` | ISO 8601 date format (YYYY-MM-DD) |

**Code from your project:**
```ts
// backend/src/middleware/validation.ts

// Ethiopian phone number validation
phoneNo: Joi.string()
    .pattern(/^(?:\+251|251|0)[97]\d{8}$/)
    .messages({ 'string.pattern.base': 'Invalid Ethiopian phone number' }),

// Password strength enforcement
password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]/)
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special char' }),
```

---

### ─────────────────────────────────────────
### 📧 Email Module
### ─────────────────────────────────────────

---

### 5. `nodemailer` — Email Delivery
**Version:** `^6.9.7`
**Protocol Used:** **SMTP over SSL (Port 465)**

**What it is:**
A module that connects to Gmail's SMTP server and sends HTML emails.
Used in your project specifically to deliver OTP verification codes to
guardians during the registration flow.

**Where it is used in the code:**

| File | Line(s) | What Happens |
|---|---|---|
| `backend/src/services/otpService.ts` | Line 7–18 | Creates the SMTP transporter |
| `backend/src/services/otpService.ts` | Line 97–124 | Sends the OTP HTML email |

**Configuration used:**
```ts
// backend/src/services/otpService.ts
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,   // smtp.gmail.com
    port: Number(process.env.MAIL_PORT),  // 465
    secure: true,                  // SSL encryption on port 465
    auth: {
        user: process.env.MAIL_USER,  // webiikoo@gmail.com
        pass: process.env.MAIL_PASS,  // Gmail App Password
    }
});
```

---

### ─────────────────────────────────────────
### 📁 File Upload Module
### ─────────────────────────────────────────

---

### 6. `multer` — File Upload Handler
**Version:** `^1.4.5-lts.1`

**What it is:**
Middleware for handling `multipart/form-data` HTTP requests, which is the
encoding type used when uploading files from a browser form.

**Where it is used in the code:**

| File | Line(s) | What It Handles |
|---|---|---|
| `backend/src/routes/registration.ts` | Line 28–54 | KYC document uploads |
| `backend/src/routes/registration.ts` | Line 56–71 | CSV student bulk imports |

**Two separate configurations in your project:**

**Instance 1 — KYC Document Uploads (Disk Storage)**
```ts
// Saves files physically to uploads/documents/ folder
const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/documents/',
        filename: (req, file, cb) => {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },           // 5 MB max
    fileFilter: (req, file, cb) => {
        // Allows: JPG, PNG, PDF only
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// Accepts 3 fields: certificate, idFront, idBack
upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'idFront',     maxCount: 1 },
    { name: 'idBack',      maxCount: 1 }
])
```

**Instance 2 — CSV Student Imports (Memory Storage)**
```ts
// Keeps file in RAM buffer — processed and discarded, never saved to disk
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        // Allows: CSV files only
        const isCSV = file.originalname.toLowerCase().endsWith('.csv');
        cb(null, isCSV);
    }
});
```

---

### ─────────────────────────────────────────
### 🌐 Web Server & HTTP Modules
### ─────────────────────────────────────────

---

### 7. `express` — Web Server Framework
**Version:** `^4.18.2`

**What it is:** The core HTTP server framework. All API routes, middleware
chains, and request/response handling are built on top of Express.

**Where it is used:** `backend/src/app.ts` — the main server entry point.

**Routes registered in your project:**
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/registration/validate
POST   /api/registration/verify-otp
POST   /api/registration/complete
GET    /api/homework
POST   /api/homework
GET    /api/messages
POST   /api/messages
GET    /api/notifications
POST   /api/notifications
GET    /api/pickup-requests
POST   /api/pickup-requests
GET    /api/report-cards
POST   /api/registration/registrar/pending
GET    /api/director/stats
GET    /api/registration/registrar/audit-logs
```

---

### 8. `helmet` — HTTP Security Headers
**Version:** `^7.1.0`
**Algorithm Used:** **Secure HTTP Header Injection**

**What it is:** Sets protective HTTP response headers automatically on every
request to defend against common browser-based attacks.

**Where it is used:** `backend/src/app.ts` Line 37

**Headers it sets:**
```
X-Frame-Options: DENY               → prevents clickjacking
X-XSS-Protection: 1; mode=block    → blocks cross-site scripting
X-Content-Type-Options: nosniff    → prevents MIME sniffing attacks
Strict-Transport-Security: max-age=... → forces HTTPS
```

---

### 9. `cors` — Cross-Origin Resource Sharing
**Version:** `^2.8.5`

**What it is:** Controls which origins (domains) are allowed to make HTTP
requests to the backend. Without this, the browser blocks all frontend API
calls to a different port/domain.

**Where it is used:** `backend/src/app.ts` Line 48

**Configuration:**
```ts
// backend/src/app.ts
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
            callback(null, true);  // ✅ Allow
        } else {
            callback(new Error('Not allowed by CORS'));  // ❌ Block
        }
    },
    credentials: true,   // Allows cookies and authorization headers
}));
```

---

### 10. `express-rate-limit` — Brute Force Protection
**Version:** `^7.1.5`
**Algorithm Used:** **Sliding Window Rate Limiter**

**What it is:** Tracks how many requests each IP address makes within a
time window. If the limit is exceeded, the IP is temporarily blocked.

**Where it is used:** `backend/src/app.ts` Line 62–74

```ts
// backend/src/app.ts
const limiter = rateLimit({
    windowMs: 900000,    // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 100, // 100 req in production
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);
```

---

### 11. `compression` — Gzip Compression
**Version:** `^1.7.4`
**Algorithm Used:** **Gzip / Deflate**

**What it is:** Compresses all HTTP response bodies before sending them
to the client. Smaller responses = faster page loads.

**Where it is used:** `backend/src/app.ts` Line 77

---

### 12. `morgan` — HTTP Request Logger
**Version:** `^1.10.0`

**What it is:** Logs every incoming HTTP request to the console with the
method, route, status code, and response time.

**Where it is used:** `backend/src/app.ts` Line 78

```
Output example:
GET /api/homework 200 14ms
POST /api/registration/validate 422 5ms
```

---

### 13. `sequelize` + `pg` + `pg-hstore` — Database ORM
**Versions:** `sequelize ^6.35.2` · `pg ^8.20.0` · `pg-hstore ^2.3.4`

**What it is:** Sequelize is an Object-Relational Mapper (ORM) that lets
you interact with the PostgreSQL database using TypeScript classes instead
of writing raw SQL queries. `pg` is the PostgreSQL driver. `pg-hstore`
handles serializing JSON data into PostgreSQL's hstore format.

**Where it is used:** `backend/src/database/connection.ts` and all files
in `backend/src/models/`

**Models defined (= database tables):**

| Model File | Table Name | Purpose |
|---|---|---|
| `User.ts` | `users` | All system users (Director, Registrar, Teacher, Guardian) |
| `Student.ts` | `Students` | Student records linked to a class and a guardian |
| `Classroom.ts` | `Classrooms` | Class levels with assigned teachers |
| `Homework.ts` | `Homework` | Homework assignments posted by teachers |
| `HomeworkView.ts` | `HomeworkViews` | Tracks when a guardian viewed a homework |
| `HomeworkFeedback.ts` | `HomeworkFeedbacks` | Guardian feedback on homework completion |
| `Message.ts` | `messages` | Direct messages between guardians and teachers |
| `Notification.ts` | `Notifications` | School-wide broadcast announcements |
| `ReportCard.ts` | `ReportCards` | Student term grades and teacher comments |
| `PickupRequest.ts` | `PickupRequests` | Student pickup authorizations |
| `PendingRegistration.ts` | `PendingRegistrations` | Guardian KYC applications under review |
| `OTP.ts` | `OTPs` | One-time verification codes |
| `SystemLog.ts` | `SystemLogs` | Audit log of admin/registrar actions |

**Example — how Sequelize replaces raw SQL:**
```ts
// Instead of: SELECT * FROM "Students" WHERE class_id = 5
StudentModel.findAll({ where: { classId: 5 } });
```

---

### 14. `dotenv` — Environment Variables
**Version:** `^16.3.1`

**What it is:** Loads key-value pairs from a `.env` file into `process.env`
so sensitive configuration (database URLs, secrets, passwords) is never
hard-coded in the source code.

**Where it is used:** `backend/src/app.ts` Line 31

**Variables it loads in your project:**
```ini
PORT=3000
NODE_ENV=development
DB_URL=postgresql://...supabase.com.../postgres
JWT_SECRET=super-secret-key-...
MAIL_HOST=smtp.gmail.com
MAIL_USER=webiikoo@gmail.com
MAIL_PASS=...
```

---

### 15. `typescript` — Type Safety
**Version:** `^5.3.3` (both backend and frontend)

**What it is:** A superset of JavaScript that adds static type checking.
Catches bugs at development time (before the code runs) and makes the
codebase self-documenting through interfaces and enums.

**Key types defined in your project:**
```ts
// backend/src/types/index.ts
enum UserRole {
    DIRECTOR        = 'director',
    REGISTRAR       = 'registrar',
    TEACHER         = 'teacher',
    HOMEROOM_TEACHER = 'homeroom_teacher',
    GUARDIAN        = 'guardian'
}
```

---

### ─────────────────────────────────────────
### 🔧 Backend Dev-Only Modules
### ─────────────────────────────────────────

| Module | Version | Purpose |
|---|---|---|
| `nodemon` | ^3.0.2 | Auto-restarts the server on file save during `npm run dev` |
| `ts-node` | ^10.9.2 | Runs `.ts` files directly without compiling to `.js` first |
| `jest` | ^29.7.0 | Unit testing framework |
| `ts-jest` | ^29.1.1 | Lets Jest understand and run TypeScript test files |
| `supertest` | ^6.3.3 | Tests API endpoints directly in Jest without a browser |

---
---

## 🌐 FRONTEND

### ─────────────────────────────────────────
### ⚛️ Core Framework Modules
### ─────────────────────────────────────────

---

### 1. `next` — React Framework
**Version:** `14.0.3`

**What it is:** The full-stack React framework powering the frontend.
Uses the **App Router** (introduced in Next.js 13+) where every folder
inside `src/app/` becomes a URL route automatically.

**Routes in your project:**

| Folder | URL | Who Sees It |
|---|---|---|
| `app/page.tsx` | `/` | Public landing page |
| `app/auth/login/` | `/auth/login` | Login page |
| `app/auth/register/` | `/auth/register` | Guardian self-registration |
| `app/dashboard/` | `/dashboard` | All logged-in users |
| `app/dashboard/homework/` | `/dashboard/homework` | Homework list |
| `app/dashboard/messages/` | `/dashboard/messages` | Chat interface |
| `app/dashboard/notifications/` | `/dashboard/notifications` | Announcements |
| `app/dashboard/pickup/` | `/dashboard/pickup` | Pickup requests |
| `app/dashboard/report-cards/` | `/dashboard/report-cards` | Academic reports |
| `app/dashboard/registrar/` | `/dashboard/registrar` | Registrar dashboard |
| `app/dashboard/director/` | `/dashboard/director` | Director dashboard |
| `app/dashboard/audit-logs/` | `/dashboard/audit-logs` | System audit logs |

---

### 2. `react` + `react-dom` — UI Library
**Versions:** `^18.2.0`

**What they are:**
- `react` — the core library for building component trees
- `react-dom` — renders React components into the actual browser DOM

---

### ─────────────────────────────────────────
### 📡 Data Fetching Modules
### ─────────────────────────────────────────

---

### 3. `@tanstack/react-query` — Server State Management
**Version:** `^5.8.4`

**What it is:** Handles all data fetching from the backend API. Provides
automatic caching, background refetching, loading/error states, and
cache invalidation after mutations (create/update/delete).

**Where it is used:** Throughout all dashboard pages and components.

**What it replaces:**
```ts
// Without React Query (manual, messy):
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
    fetch('/api/homework').then(r => r.json()).then(setData).finally(() => setLoading(false));
}, []);

// With React Query (clean, automatic caching):
const { data, isLoading } = useQuery({ queryKey: ['homework'], queryFn: fetchHomework });
```

---

### 4. `axios` — HTTP Client
**Version:** `^1.6.2`

**What it is:** Sends HTTP requests from the frontend to the backend API.
Configured with a base URL and an interceptor that automatically attaches
the JWT token from cookies to every outgoing request.

**Where it is used:** `frontend/src/lib/` — the Axios instance configuration.

```ts
// Every request automatically gets the Authorization header:
// Authorization: Bearer eyJhbGci...
```

---

### ─────────────────────────────────────────
### 📝 Form & Input Modules
### ─────────────────────────────────────────

---

### 5. `react-hook-form` — Form Management
**Version:** `^7.48.2`

**What it is:** Manages form state, validation, and submission efficiently.
Used on every form in the project (login, registration, homework creation,
report card, pickup requests).

**Why it's efficient:** It uses **uncontrolled components** and only
re-renders the specific field that changed, rather than re-rendering
the entire form on every keystroke.

---

### ─────────────────────────────────────────
### 🎨 Styling & UI Modules
### ─────────────────────────────────────────

---

### 6. `tailwindcss` — CSS Framework
**Version:** `^4.2.4`

**What it is:** A utility-first CSS framework. Instead of writing custom
CSS classes, you apply pre-built utility classes directly in JSX.

```tsx
// Example from your dashboard layout:
<div className="bg-brand-primary text-white rounded-2xl p-8 shadow-xl hover:-translate-y-2 transition-all">
```

---

### 7. `lucide-react` — Icon Library
**Version:** `^0.294.0`

**What it is:** A collection of clean SVG icons as React components.
Used extensively across the landing page and all dashboard interfaces.

**Icons used in your project include:**
`Shield`, `MessageSquare`, `Bell`, `BarChart3`, `Users`, `GraduationCap`,
`Menu`, `X`, `ChevronRight`, `Target`, `Rocket`, `ArrowRight`, `User`

---

### 8. `clsx` — Conditional Class Names
**Version:** `^2.0.0`

**What it is:** A tiny utility to conditionally join CSS class names together.

```ts
// Example usage:
clsx('base-class', isActive && 'active-class', hasError && 'error-class')
// → 'base-class active-class'   (when isActive=true, hasError=false)
```

---

### 9. `date-fns` — Date Formatting
**Version:** `^2.30.0`

**What it is:** A utility library for parsing, formatting, and manipulating
JavaScript dates. Used for displaying homework due dates, event dates, and
report card periods in human-readable formats.

```ts
// Example:
format(new Date('2026-06-15'), 'MMMM d, yyyy')  →  "June 15, 2026"
```

---

### 10. `js-cookie` — Browser Cookie Access
**Version:** `^3.0.5`

**What it is:** Reads and writes browser cookies. Used to store and retrieve
the JWT token after login, and to clear it on logout.

```ts
// Store token after login:
Cookies.set('token', jwtToken, { expires: 1 }); // expires in 1 day

// Read token for API requests:
const token = Cookies.get('token');

// Clear on logout:
Cookies.remove('token');
```

---

### ─────────────────────────────────────────
### 🔧 Frontend Dev-Only Modules
### ─────────────────────────────────────────

| Module | Version | Purpose |
|---|---|---|
| `eslint` | ^8.56.0 | Lints code for errors and bad patterns |
| `eslint-config-next` | 14.0.3 | Next.js-specific ESLint rules |
| `@typescript-eslint/parser` | ^6.14.0 | Allows ESLint to parse TypeScript syntax |
| `@typescript-eslint/eslint-plugin` | ^6.14.0 | TypeScript-specific linting rules |

---

## 🧠 ALGORITHMS SUMMARY TABLE

| Algorithm | Module | Used For | File Location |
|---|---|---|---|
| **Blowfish (bcrypt)** | `bcryptjs` | Hashing user passwords before DB storage | `src/services/authService.ts` |
| **HMAC-SHA256 (HS256)** | `jsonwebtoken` | Signing and verifying JWT session tokens | `src/services/authService.ts` |
| **CSPRNG** | `crypto` (built-in) | Generating cryptographically secure 6-digit OTPs | `src/services/otpService.ts` |
| **Regex Pattern Matching** | `joi` | Validating Ethiopian phone numbers, Fayda IDs, passwords | `src/middleware/validation.ts` |
| **Sliding Window Rate Limiting** | `express-rate-limit` | Blocking brute-force and DDoS attacks on API | `src/app.ts` |
| **Gzip / Deflate** | `compression` | Compressing HTTP response bodies | `src/app.ts` |
| **Soft Delete (Logical Masking)** | Sequelize (raw query) | Hiding messages without deleting them from DB | `src/database/connection.ts` |
| **SMTP over SSL** | `nodemailer` | Delivering OTP emails via Gmail on port 465 | `src/services/otpService.ts` |
| **Schema-Based ORM Mapping** | `sequelize` | Translating TypeScript models to SQL queries | `src/models/*.ts` |
| **RBAC (Role-Based Access Control)** | Custom middleware | Restricting routes by user role | `src/middleware/auth.ts` |

---

## 📊 FULL DEPENDENCY OVERVIEW

```
BACKEND
├── 🔐 Security
│   ├── bcryptjs        → Password hashing (Blowfish)
│   ├── jsonwebtoken    → Session tokens (HS256)
│   ├── helmet          → HTTP security headers
│   └── express-rate-limit → Brute force protection
│
├── 🗄️  Database
│   ├── sequelize       → ORM / model-to-table mapping
│   ├── pg              → PostgreSQL driver
│   └── pg-hstore       → JSON serialization for PostgreSQL
│
├── ✅ Validation
│   └── joi             → Schema & regex input validation
│
├── 📧 Email
│   └── nodemailer      → SMTP email delivery (OTP)
│
├── 📁 File Uploads
│   └── multer          → Multipart form / file handling
│
├── 🌐 HTTP
│   ├── express         → Web server & routing
│   ├── cors            → Cross-origin access control
│   ├── compression     → Gzip response compression
│   ├── morgan          → HTTP request logging
│   └── dotenv          → Environment variable loading
│
└── 🔧 Dev Tools
    ├── nodemon         → Auto-restart on file change
    ├── ts-node         → Run TypeScript directly
    ├── jest            → Unit testing
    ├── ts-jest         → TypeScript support for Jest
    └── supertest       → API endpoint testing

FRONTEND
├── ⚛️  Core
│   ├── next            → React framework (App Router)
│   ├── react           → UI component library
│   └── react-dom       → Browser DOM renderer
│
├── 📡 Data Fetching
│   ├── @tanstack/react-query → Server state & caching
│   └── axios           → HTTP client for API calls
│
├── 📝 Forms
│   └── react-hook-form → Form state & validation
│
├── 🎨 Styling & UI
│   ├── tailwindcss     → Utility CSS framework
│   ├── lucide-react    → SVG icon components
│   ├── clsx            → Conditional class names
│   └── date-fns        → Date formatting utilities
│
├── 🍪 Auth
│   └── js-cookie       → JWT token cookie access
│
└── 🔧 Dev Tools
    ├── eslint          → Code linting
    ├── eslint-config-next
    └── @typescript-eslint/*  → TypeScript linting
```

---

*Document generated for GuardianGate – Digital Parent-School Communication System*
*Hawi Dandi Boru School · hawischool@gmail.com*
