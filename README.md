# Auth-only Next.js Starter (NextAuth + Prisma, SQLite)

## Chạy nhanh
```bash
pnpm i
# Windows PowerShell: Copy-Item .\.env.example .\.env
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm dev
# http://localhost:3000
```
- Vào **/signup** để tạo tài khoản, sau đó **/signin**.
- Đổi `NEXTAUTH_SECRET` trong `.env` thành chuỗi ngẫu nhiên ≥ 32 ký tự.