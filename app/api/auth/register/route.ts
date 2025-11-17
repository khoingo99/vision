// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";

const Schema = z.object({
  username: z
    .string()
    .min(4, "아이디는 4자 이상")
    .max(16, "아이디는 16자 이하")
    .regex(/^[a-zA-Z0-9_]+$/, "영문/숫자/_만 허용"),
  name: z.string().trim().nullish().transform((v) => v ?? null),
  email: z.string().email("이메일 형식이 올바르지 않습니다.").transform((s) => s.toLowerCase()),
  phone: z
    .string()
    .transform((s) => s.replace(/[^\d]/g, "")) // chỉ giữ số
    .refine((v) => /^\d{9,15}$/.test(v), "전화번호 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상"),
});

// Nhận cả JSON và FormData
async function readBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string") obj[k] = v;
    });
    return obj;
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await readBody(req);
    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Bad Request";
      return NextResponse.json({ ok: false, message: msg }, { status: 400 });
    }

    const { username, name, email, phone, password } = parsed.data;

    // Kiểm tra trùng username/email
    const existed = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });
    if (existed) {
      const msg =
        existed.username === username ? "Username already exists" : "Email already exists";
      return NextResponse.json({ ok: false, message: msg }, { status: 409 });
    }

    await prisma.user.create({
      data: {
        username,
        name,
        email,
        phone,
        passwordHash: await hash(password, 10),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Prisma duplicate (race condition)
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "Duplicated username/email" },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
}
