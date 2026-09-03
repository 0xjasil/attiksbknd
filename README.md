# Attiks Architecture Backend API (PostgreSQL + Prisma)

Production-ready backend API service for Attiks Architecture built with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL**.

---

## 🏗 Architecture & Features

- **PostgreSQL Database** with full relational schema via **Prisma ORM**.
- **Admin JWT Authentication** with password hashing using bcrypt.
- **RESTful Endpoints** for:
  - **Projects** (`/api/projects`) — Full CRUD, category filtering, search, featured queries.
  - **Leads & Inquiries** (`/api/leads`) — Client inquiry capture, consultation booking, status tracking.
  - **Awards & Honors** (`/api/awards`) — Recognition showcase and honors management.
  - **Directors & Leadership** (`/api/directors`) — Leadership profiles and portfolio consultation.
  - **Testimonials** (`/api/testimonials`) — Client quote management.
  - **Media & Journal** (`/api/blog`) — Articles and publications.
  - **Analytics & Dashboard** (`/api/stats`) — Aggregate metrics and audit breakdown.
- **Input Validation** via Zod schemas.
- **Security**: Helmet headers, CORS policies, JWT bearer protection.
- **Automated Database Seeding**: Pre-seeded with Attiks portfolio, awards, directors, and default admin.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd F:\attiks_bknd
npm install
```

### 2. Configure Database (`.env`)
Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/attiks_db?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET="attiks_super_secret_jwt_key_change_in_production_2026"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Run Prisma Migrations & Seed
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to PostgreSQL
npm run prisma:push

# (Or create formal migration):
# npm run prisma:migrate

# Seed database with initial data & admin user
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 🔑 Default Admin Credentials (from Seed)
- **Email**: `admin@attiks.in`
- **Password**: `AttiksAdmin2026!`

---

## 🛠 Available Scripts
- `npm run dev` — Start server in watch mode with `tsx`
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run compiled production server
- `npm run prisma:generate` — Generate Prisma client
- `npm run prisma:push` — Sync schema directly to PostgreSQL
- `npm run prisma:studio` — Launch visual database browser
- `npm run prisma:seed` — Seed initial projects and admin user
