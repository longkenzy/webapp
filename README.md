IT Work Manager – Next.js (App Router) + Tailwind + Prisma + NextAuth

### Stack
- Next.js (App Router, TS)
- TailwindCSS
- Prisma + PostgreSQL (Neon)
- NextAuth (Credentials)
- Deploy: Vercel + Neon

### Features
- RBAC: ADMIN, IT_LEAD, IT_STAFF, USER (middleware + utilities)
- Auth: Login/Register/Forgot password (Credentials, bcrypt)
- Modules: Tickets (CRUD, assign, status, priority), Worklog, Comment, KPI, Schedule, Partner, Employee
- UI: Admin/User dashboards, ticket list, calendar placeholder, KPI stats

### Local setup
1) Install deps:
```bash
npm install
```
2) Create `.env.local` with:
```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-secret"
```
3) Generate client and push schema, then seed:
```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```
4) Dev:
```bash
npm run dev
```

### Neon setup
- Create a free Neon project and database, copy the connection string, append `?sslmode=require`.
- Set `DATABASE_URL` in Vercel Project Settings → Environment Variables.

### Vercel deploy
- Import the repo into Vercel.
- Set env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- After deploy, run `npx prisma migrate deploy --schema src/prisma/schema.prisma` if using migrations.

### Seed accounts
- admin@it.local / Passw0rd!
- lead@it.local / Passw0rd!
- staff1@it.local / Passw0rd!
- staff2@it.local / Passw0rd!
- user1@it.local / Passw0rd!
- user2@it.local / Passw0rd!

### Notes
- Middleware protects non-public routes by session cookie.
- Role checks enforced in API routes and page layouts.
