# Multi-College Platform Evolution Architecture & Migration Plan

Transforming CampusConnectAI from a single-institution application into a secure, scalable multi-college campus portal platform where multiple institutions operate independently with strict data isolation, customized branding, college-scoped AI knowledge retrieval, and tiered administration.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architectural Decisions Awaiting Your Confirmation Before Phase 2 Execution:**
>
> 1. **Migration of Existing Unassigned Records**:
>    - Existing student accounts, notices, and FAQs in your database currently lack a `collegeId`.
>    - **Recommended Approach**: Establish a flagship founding college (e.g., *"Apex Institute of Technology / CampusConnect Central Campus"* with slug `main-campus`) and safely associate legacy records with this college ID via a non-destructive database migration script. No student records or historical notices will be deleted or orphaned.
>
> 2. **Administrator Role Hierarchy**:
>    - **Platform Super Admin**: Uses the existing environment-secured credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`) to oversee college approvals, platform metrics, and create college admins.
>    - **College Admin**: Managed in the database with their own credentials and scoped to a single `collegeId`. College Admins cannot alter other colleges or access platform super-admin controls.
>
> 3. **AI Chatbot Knowledge Boundary**:
>    - When a student at College A asks a question, the vector/text search strictly applies `{ collegeId: student.collegeId }` to both FAQs and uploaded documents. Documents uploaded by College B will never be included in College A's context, preventing cross-institutional leakage.

---

## 1. Codebase Audit: Current State vs. Multi-College Target

### A. Current File & Component Inventory

```
Root:
├── server.js                        # Single-server entrypoint (Express + Vite dev middleware on port 3000)
├── package.json                     # Unified dependencies (React 19, Node 22, Express 5, Mongoose 9)
├── .env.example                     # Production-hardened environment template
└── scripts/audit_test.cjs           # Live integration test suite (11/11 passing)

Backend:
├── models/
│   ├── Document.js                  # Lacks collegeId
│   ├── FAQ.js                       # Lacks collegeId
│   ├── Notice.js                    # Lacks collegeId
│   ├── Student.js                   # Lacks collegeId; global unique on rollNumber/email
│   └── mockData.js                  # Flat in-memory fallback
├── controllers/
│   ├── adminController.js           # Single admin via env credentials
│   ├── chatController.js            # Unscoped FAQ & Document search
│   ├── documentController.js        # Unscoped file upload & text extraction
│   ├── faqController.js             # Unscoped FAQ CRUD
│   ├── noticeController.js          # Unscoped Notice CRUD
│   └── studentController.js         # Unscoped student registration & login
├── middleware/
│   └── adminAuth.js                 # Verifies role === 'admin'
└── routes/
    ├── adminRoutes.js               # POST /api/admin/login
    ├── chatRoutes.js                # POST /api/chat/ask
    ├── documentRoutes.js            # POST /api/documents/upload
    ├── faqRoutes.js                 # GET, POST /api/faqs
    ├── noticeRoutes.js              # GET, POST /api/notices
    └── studentRoutes.js             # POST /api/students/register, /login

Frontend:
├── src/App.jsx                      # Single campus UI (Hero, Quick Links, Notices, FAQs, Chat modal)
├── src/pages/AdminDashboard.jsx     # Single-tenant admin panel
└── src/App.css, index.css           # Styling
```

### B. Features to Reuse Directly
* **Document Extraction Engine**: `pdf-parse`, `mammoth`, and `multer` pipelines in `documentController.js`.
* **Campus AI Chat Interface & Fallback System**: Multi-turn UI, suggestion chips, source citation badges, and FAQ matching in `App.jsx` and `chatController.js`.
* **Security & Auth Core**: Bcrypt password hashing, JWT signing, route protection middleware, and production-mode enforcement.
* **Component Styling & Layouts**: Hero headers, notice cards, FAQ accordions, utility navigation bars, and responsive layouts.

---

## 2. Multi-Tenant Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CAMPUSCONNECTAI HUB                                    │
│   Landing Page (Directory of Approved Colleges)  ──────►  College Selection           │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ Selects College (e.g. slug: 'mit')
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              COLLEGE-SCOPED PORTAL                                     │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ College Branding (Custom Theme Tokens, Logo, Colors, Header)                   │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│         │                                                 │                            │
│         ▼                                                 ▼                            │
│   [Student Experience]                              [College Admin]                    │
│   - Scoped Registration & Login                     - Manage Notices for College A     │
│   - Personalized Dashboard                          - Manage FAQs for College A        │
│   - College-Specific Notices                        - Upload Docs for College A        │
│   - College-Specific FAQs                           - Strict College Boundary          │
│   - AI Chatbot (College A Knowledge Base Only)                                         │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND TENANT ISOLATION                                │
│   - All Requests validated against verified JWT claims (token.collegeId)               │
│   - Server-enforced query filters: { collegeId: req.user.collegeId }                   │
│   - Zero trust for client-provided body/param college IDs                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Evolution

### 3.1 New Model: `College.js`
```javascript
{
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g. "apex-tech"
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "APEX"
  logo: { type: String, default: "" },
  tagline: { type: String, default: "Excellence in Education & Innovation" },
  location: {
    city: { type: String, default: "Campus City" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" }
  },
  description: { type: String, required: true },
  branding: {
    primaryColor: { type: String, default: "#05192e" },
    secondaryColor: { type: String, default: "#d4af37" },
    accentColor: { type: String, default: "#2563eb" },
    campusImage: { type: String, default: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=90" }
  },
  contact: {
    email: { type: String, lowercase: true },
    phone: { type: String },
    website: { type: String }
  },
  status: { type: String, enum: ["active", "pending", "inactive"], default: "active" },
  isApproved: { type: Boolean, default: true }
}
```

### 3.2 New Model: `CollegeAdmin.js`
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true },
  role: { type: String, default: "college_admin", immutable: true },
  isActive: { type: Boolean, default: true }
}
```

### 3.3 Enhanced Models with `collegeId`
* **`Student.js`**:
  * Add: `collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true }`
  * Compound Unique Indexes:
    * `{ collegeId: 1, email: 1 }` (unique)
    * `{ collegeId: 1, rollNumber: 1 }` (unique — allowing duplicate roll numbers across different colleges)
* **`Notice.js`**:
  * Add: `collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true }`
  * Compound Index: `{ collegeId: 1, publishedAt: -1 }`
* **`FAQ.js`**:
  * Add: `collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true }`
  * Compound Index: `{ collegeId: 1, category: 1 }`
* **`Document.js`**:
  * Add: `collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true, index: true }`

---

## 4. API Endpoints Specification

### 4.1 Public Directory & College Discovery
* `GET /api/colleges`: Returns list of approved, active colleges with summary details for the central landing page.
* `GET /api/colleges/:slug`: Returns full public profile and branding configuration for a specific college.
* `POST /api/colleges/register`: Public endpoint allowing institutions to apply for platform listing (status: `pending`).

### 4.2 Super Admin Platform Management (`superAdminAuth`)
* `GET /api/superadmin/colleges`: View all colleges including pending submissions.
* `PATCH /api/superadmin/colleges/:id/status`: Approve, activate, or suspend college access.
* `POST /api/superadmin/colleges/:id/admins`: Provision a dedicated college administrator account.
* `GET /api/superadmin/stats`: Total counts of colleges, students, notices, and system health.

### 4.3 College-Scoped Student Authentication
* `POST /api/colleges/:collegeId/students/register`: Registers a student within the specified college.
* `POST /api/colleges/:collegeId/students/login`: Authenticates the student. Validates that the account belongs specifically to `:collegeId`. Generates JWT containing `{ studentId, collegeId, role: 'student' }`.

### 4.4 College Admin Authentication & Operations (`collegeAdminAuth`)
* `POST /api/college-admin/login`: Authenticates college admin. Generates JWT containing `{ adminId, collegeId, role: 'college_admin', email }`.
* `POST /api/college-admin/notices`: Creates notice bound strictly to admin's `token.collegeId`.
* `POST /api/college-admin/faqs`: Creates FAQ bound strictly to admin's `token.collegeId`.
* `POST /api/college-admin/documents/upload`: Uploads and parses document bound strictly to `token.collegeId`.
* `PATCH /api/college-admin/branding`: Updates college theme colors, tagline, and contact information.

### 4.5 College-Scoped Student Portal & AI Retrieval
* `GET /api/colleges/:collegeId/notices`: Returns notices strictly belonging to `:collegeId`.
* `GET /api/colleges/:collegeId/faqs`: Returns FAQs strictly belonging to `:collegeId`.
* `POST /api/colleges/:collegeId/chat/ask`: AI Chatbot query. Searches exclusively FAQs and documents where `{ collegeId }`.

---

## 5. Security & Isolation Verification Strategy

| Test Scenario | Verification Mechanism | Expected Result |
| :--- | :--- | :--- |
| **Cross-Tenant Student Isolation** | Student from College A tries accessing `/api/colleges/:collegeB/notices` with College A JWT | **`403 Forbidden`** |
| **Cross-Tenant Admin Isolation** | College A Admin attempts to post notice to College B | **`403 Forbidden`** (Admin can only write to their own `token.collegeId`) |
| **Chatbot Knowledge Containment** | Student at College A asks about a unique phrase present only in College B's uploaded document | **No match from College B**; College A answers only with College A data |
| **Super Admin Boundary** | College Admin or Student token attempts to access `/api/superadmin/*` | **`403 Forbidden`** |
| **Unauthenticated Protection** | Anonymous user tries uploading document or modifying notices | **`401 Unauthorized`** |
| **In-Memory Demo Segregation** | Running offline without MongoDB | Memory store correctly segregates collections by `collegeId` |

---

## 6. Phased Rollout Plan

* **Phase 1: Audit and Plan** *(Current Turn)* — Complete comprehensive architecture and schema review. Await user approval.
* **Phase 2: Core Multi-College Foundation** — College model, CollegeAdmin model, automated schema migration for existing records, super-admin approval workflows, and tenant-scoped auth middleware.
* **Phase 3: Portals & UI Evolution** — Central landing directory, college selection flow, college-branded student portal, college admin dashboard, and tenant-isolated AI chatbot.
* **Phase 4: Comprehensive Verification** — Update test suite to 16+ integration checks covering cross-tenant containment, build verification, and clean error handling.
