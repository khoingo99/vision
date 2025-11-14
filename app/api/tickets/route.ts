import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/* ----------------------- GET: list + summary -----------------------
   /api/tickets?page=1&size=10&q=keyword&type=NETWORK&status=NEW
   Trả về:
   {
     page, size, total, items: [...],
     summary: {
       NEW, ASSIGNED, IN_PROGRESS, REVIEW, HOLD, CANCELED, DONE, TOTAL
     }
   }
-------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
    const size   = Math.min(100, Math.max(1, Number(searchParams.get("size") ?? 10)));
    const q      = (searchParams.get("q") || "").trim();
    const type   = (searchParams.get("type") || "").toUpperCase();
    const status = (searchParams.get("status") || "").toUpperCase();

    const where: any = {};
    if (q) {
      where.OR = [{ title: { contains: q } }, { content: { contains: q } }];
    }
    if (type)   where.type   = type;
    if (status) where.status = status;

    const skip = (page - 1) * size;

    const [total, items, grouped] = await prisma.$transaction([
  prisma.ticket.count({ where }),
  prisma.ticket.findMany({
    where,
    skip,
    take: size,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, username: true } },
      attachments: true,
      // assignee: { select: { id: true, name: true, username: true } }, // nếu có quan hệ
    },
  }),
  prisma.ticket.groupBy({
    by: ["status"],
    where,                         // đếm theo đúng bộ lọc hiện tại
    _count: { _all: true },        // <- dùng _count, có thể dùng _all để đếm số dòng trong nhóm
    orderBy: { status: "asc" },    // <- thêm orderBy theo field trong `by`
  }),
]);

// Tổng hợp số lượng theo trạng thái
const summary = {
  NEW: 0,
  ASSIGNED: 0,
  IN_PROGRESS: 0,
  REVIEW: 0,
  HOLD: 0,
  CANCELED: 0,
  DONE: 0,
  TOTAL: total,
};

for (const g of grouped) {
  const key = g.status as keyof typeof summary;

  // Thu hẹp: chỉ lấy _all khi _count là object
  let cnt = 0;
  if (g._count && typeof g._count === 'object' && '_all' in g._count) {
    cnt = (g._count as { _all?: number })._all ?? 0;
  }
  summary[key] = cnt;
}

   return NextResponse.json({
  ok: true,
  data: { page, size, total, items, summary },
});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: err?.message ?? "Server error" },
      { status: 500 },
    );
  }
}


/* ----------------------- POST: create ticket ---------------------- */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    // NextAuth default: user.id là string
    const authorId = token?.sub ?? undefined;

    const form = await req.formData();
    const type = String(form.get("type") || "OTHER").toUpperCase();
    const title = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "").trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    // Lưu file local (dev) — deploy thì đổi sang S3/Cloudinary
    const files = form.getAll("files").filter(Boolean) as File[];
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const attachments: {
      name: string;
      url: string;
      size: number;
      mimetype: string;
    }[] = [];

    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const name = `${randomUUID()}${path.extname(f.name)}`;
      await writeFile(path.join(uploadDir, name), buf);
      attachments.push({
        name: f.name,
        url: `/uploads/${name}`,
        size: f.size,
        mimetype: f.type || "application/octet-stream",
      });
    }

    const created = await prisma.ticket.create({
      data: {
        type,
        status: "NEW",
        title,
        content,
        ...(authorId ? { authorId } : {}),
        attachments: attachments.length ? { create: attachments } : undefined,
      },
      include: { attachments: true, author: true },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
