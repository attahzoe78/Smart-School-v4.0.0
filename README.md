# Smart School v4.0.0

**Modern and Complete School Automation Software** for the Nigerian Market.

Developed and built by **Sisi Technology Ltd**, Jos Plateau State, Nigeria.

---

## Overview

Smart School is a comprehensive school management system that suites almost every school or educational institution — from student admission to student leaving, from fees collection to exam results. It includes **25+ modules** with **8 inbuilt user panels**.

### User Roles (8 Panels)

| Role | Description |
|------|-------------|
| Super Admin | Full system access |
| Admin | School administration |
| Accountant | Fees & payroll management |
| Teacher | Teaching & homework |
| Receptionist | Front office |
| Librarian | Library management |
| Parent | Child monitoring |
| Student | Student portal |

### Modules (25+)

**Academics:** Student Information, Attendance, Examinations, Homework, Download Center

**Human Resource:** Staff Directory, Departments, Designations, Staff Attendance, Payroll, Leave Management

**Finance:** Fees Collection, Expenses

**Front Office:** Admission Enquiry, Visitor Book, Phone Call Log, Postal Dispatch/Receive, Complaints

**Library:** Books, Issue/Return

**Content (CMS):** Pages, News, Events, Gallery, Banners, Menus, Media Manager

**Facilities:** Hostel, Transport

**System:** Roles & Permissions (ACL), Settings, Certificates & ID Cards, Calendar & Tasks

---

## Technology Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with shadcn/ui (New York style)
- **Database:** Prisma ORM with SQLite
- **State Management:** Zustand (client) + TanStack Query (server)
- **Charts:** Recharts
- **Icons:** Lucide React

---

## Installation

Smart School is a **web install application** — it includes a built-in installation wizard.

### Prerequisites

- Node.js 18+ or Bun runtime
- A modern web browser

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/attahzoe78/Smart-School-v4.0.0.git
   cd Smart-School-v4.0.0
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Initialize the database**
   ```bash
   bun run db:push
   ```
   > **Note:** The `.env` file is auto-created on first run. You don't need to manually set up environment variables — the setup script (`scripts/setup.js`) runs automatically before `dev`, `build`, and `db:*` commands. It creates `.env` with a relative SQLite path (`file:./db/custom.db`) that works on any machine.

4. **Start the development server**
   ```bash
   bun run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

6. **Follow the installation wizard** — the app will guide you through:
   - School details configuration
   - Super Admin account creation
   - Database initialization (creates default classes, subjects, departments, roles, etc.)

7. **Log in** with the credentials you created during installation.

### Demo Data (Optional)

After installation, click the **"Load demo data"** button in the top bar to populate the system with sample Nigerian data (students, staff, fees, library books, enquiries, events, etc.).

---

## Default Login (after installation)

The credentials are set during the installation wizard. For demo purposes:

| Field | Value |
|-------|-------|
| Username | `superadmin` |
| Password | (set during installation) |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server (port 3000) |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

---

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema (all 25+ modules)
├── src/
│   ├── app/
│   │   ├── api/               # API routes (18 endpoints)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main entry (install/login/app router)
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── layout/            # App shell, sidebar, topbar, footer
│   │   ├── screens/           # All module screens
│   │   ├── shared/            # Reusable components (StatCard, etc.)
│   │   ├── ui/                # shadcn/ui components
│   │   └── providers.tsx      # Theme & Query providers
│   ├── lib/                   # Utilities, constants, auth, format
│   ├── store/                 # Zustand store
│   └── hooks/                 # Custom hooks
├── public/                    # Static assets
└── package.json
```

---

## Web Install Features

- **Installation Wizard** — Multi-step setup on first launch
- **System Settings** — Configure school info, currency (₦), timezone (Africa/Lagos)
- **Reset System** — Factory reset from Settings → System tab
- **Clear Data** — Remove all records while keeping configuration
- **Reinstall** — Redirects back to installation wizard

---

## Localization for Nigeria

- **Currency:** Nigerian Naira (₦ / NGN)
- **Timezone:** Africa/Lagos
- **States:** All 36 Nigerian states + FCT
- **Curriculum:** Nigerian subjects (Mathematics, English, Civic Education, CRS, IRS, Hausa, Yoruba, Igbo, etc.)
- **Classes:** Creche → Nursery → KG → Primary 1-6 → JSS 1-3 → SSS 1-3
- **Demo Data:** Authentic Nigerian names, cities, and phone numbers

---

## Version 4.0.0 New Features

- Front CMS module (Pages, News, Events, Gallery, Banners, Menus, Media Manager)
- Human Resource with Payroll module
- Front Office with Admission Enquiry module
- ACL-based Roles and Permission module
- Certificate and ID Card Print module
- Homework module with evaluation reports
- Calendar with ToDo List module
- Student Timeline
- Fees Carry Forward
- Auto Backup using Cron
- Online payment support in student panel
- And many more...

---

## License

Proprietary — © Sisi Technology Ltd, Jos Plateau State, Nigeria.

---

## Developer

**Sisi Technology Ltd**
Jos, Plateau State, Nigeria

For support, inquiries, or customization, please contact the developer.
