import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

// validate & chuẩn hoá theo DB mới
const Schema = z.object({
  username: z.string()
    .min(4, "아이디는 4자 이상")
    .max(16, "아이디는 16자 이하")
    .regex(/^[a-zA-Z0-9_]+$/, "영문/숫자/_만 허용"),
  name: z.string().trim().optional(),              // name là optional trong DB
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  phone: z.string()                                 // phone bắt buộc
    .transform(s => s.replace(/[\s\-\(\)\.]/g, "")) // bỏ khoảng trắng, -, (), .
    .refine(v => /^\d{9,15}$/.test(v), "전화번호 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response("Bad Request", { status: 400 });
    }

    const { username, name, email, phone, password } = parsed.data;

    // check trùng username/email
    const [byUser, byEmail] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    ]);
    if (byUser)  return new Response("Username already exists", { status: 409 });
    if (byEmail) return new Response("Email already exists",    { status: 409 });

    // tạo user
    await prisma.user.create({
      data: {
        username,
        name: name?.trim() || null,                 // DB cho phép null
        email: email.toLowerCase(),
        phone,                                      // đã được chuẩn hoá
        passwordHash: await hash(password, 10),
      },
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
