import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(c) {
        if (!c?.username || !c?.password) return null;
        const user = await prisma.user.findUnique({ where: { username: c.username.trim() } });
        if (!user) return null;
        const ok = await compare(c.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name, username: user.username } as any : null;
      }
    })
  ],
  pages: { signIn: "/signin" },
  secret: process.env.NEXTAUTH_SECRET
};
