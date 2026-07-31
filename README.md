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

## Deployment on Vercel

Smart School is configured for seamless deployment on Vercel.

### Option A: One-Click Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository: `attahzoe78/Smart-School-v4.0.0`
3. Vercel will auto-detect Next.js settings
4. **Before deploying**, add these Environment Variables:
   - `DATABASE_URL` → your Turso database URL (see below)
   - `DATABASE_AUTH_TOKEN` → your Turso auth token
5. Click **Deploy**

### Option B: Deploy via CLI

```bash
# Get a Vercel token from https://vercel.com/account/tokens
VERCEL_TOKEN=your_token bash scripts/deploy-vercel.sh
```

### Setting up Turso Database (for Vercel)

SQLite files don't persist on Vercel's serverless platform. Use **Turso** (free, SQLite-compatible):

1. **Sign up** at [turso.tech](https://turso.tech)
2. **Create a database:**
   ```bash
   turso db create smart-school
   ```
3. **Get your connection URL:**
   ```bash
   turso db show smart-school --url
   # → libsql://smart-school-yourname.turso.io
   ```
4. **Create an auth token:**
   ```bash
   turso db tokens create smart-school
   ```
5. **Add to Vercel Environment Variables:**
   - `DATABASE_URL` = `libsql://smart-school-yourname.turso.io`
   - `DATABASE_AUTH_TOKEN` = your token
6. **Push the schema to Turso:**
   ```bash
   DATABASE_URL="libsql://smart-school-yourname.turso.io" \
   DATABASE_AUTH_TOKEN="your-token" \
   bun run db:push
   ```
7. **Redeploy** on Vercel — your app is now live with a persistent database!

---

## Windows Desktop Installation (.exe Installer)

Smart School can be installed as a **native Windows desktop application** — no Node.js, Bun, or browser required!

### Download the Installer

1. Go to the [Releases page](https://github.com/attahzoe78/Smart-School-v4.0.0/releases)
2. Download `SmartSchool-Setup-4.0.0.exe`
3. Run the installer
4. Follow the setup wizard (choose install location, create shortcuts)
5. Launch **Smart School** from your Desktop or Start Menu

### System Requirements

- Windows 10 or later (64-bit)
- 2GB RAM minimum (4GB recommended)
- 500MB free disk space
- No internet connection required (fully offline)

### What the Installer Includes

- Complete Next.js application (standalone build)
- Embedded Node.js runtime (via Electron)
- SQLite database engine (bundled)
- All 25+ modules and 8 user panels
- Prisma ORM for database management
- The database is stored in `C:\Users\<user>\AppData\Roaming\Smart School\database\`

### First Launch

On first launch, the app will:
1. Show a splash screen while starting the internal server
2. Open the installation wizard (set up school name, admin account)
3. Create the database tables automatically
4. After setup, you can start using Smart School immediately

### Build the Installer Yourself

To build the Windows .exe from source:

```bash
# Prerequisites: Node.js 18+ and Git
git clone https://github.com/attahzoe78/Smart-School-v4.0.0.git
cd Smart-School-v4.0.0
bun install          # or npm install
bun run dist:win     # builds the .exe installer
```

The installer will be created in the `dist/` folder as `SmartSchool-Setup-4.0.0.exe`.

### GitHub Actions (Automatic Builds)

The repository includes a GitHub Actions workflow (`.github/workflows/build-windows.yml`) that automatically builds the Windows installer when you create a new release tag:

```bash
git tag v4.0.0
git push origin v4.0.0
```

This triggers the build on GitHub's Windows runners and publishes the .exe to the Releases page automatically.

---

## Developer

**Sisi Technology Ltd**
Jos, Plateau State, Nigeria

For support, inquiries, or customization, please contact the developer.
