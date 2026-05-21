// NextAuth v5 (Auth.js) configuration.
//
// Two credentials providers:
//   - "phone-otp" for India seller signin (phone + OTP code from OtpCode table)
//   - "email-password" for US buyer signin (email + bcrypt-hashed password)
//
// Roles live on the User row; the session carries `role` and `id`.

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

const phoneSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6),
});

const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: { phone: {}, code: {} },
      authorize: async (creds) => {
        const parsed = phoneSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { phone, code } = parsed.data;

        const otp = await prisma.otpCode.findFirst({
          where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!otp) return null;

        // Brute-force lockout: burn the OTP after MAX_OTP_ATTEMPTS so an
        // attacker can't keep hammering the same code. Forces them to wait for
        // a new code (which the real user has to request) — and the real user
        // would have used it by now.
        const MAX_OTP_ATTEMPTS = 5;
        if (otp.attempts >= MAX_OTP_ATTEMPTS) {
          await prisma.otpCode.update({
            where: { id: otp.id },
            data: { consumedAt: new Date() },
          });
          return null;
        }

        const ok = await bcrypt.compare(code, otp.codeHash);
        if (!ok) {
          await prisma.otpCode.update({
            where: { id: otp.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        await prisma.otpCode.update({
          where: { id: otp.id },
          data: { consumedAt: new Date() },
        });

        const user = await prisma.user.upsert({
          where: { phone },
          update: { phoneVerified: new Date() },
          create: { phone, phoneVerified: new Date(), role: "SELLER" },
        });

        return { id: user.id, name: user.name ?? null, email: user.email ?? null };
      },
    }),
    Credentials({
      id: "email-password",
      name: "Email",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const parsed = emailSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const account = await prisma.account.findFirst({
          where: { provider: "credentials", providerAccountId: email },
          include: { user: true },
        });
        if (!account?.access_token) return null;

        const ok = await bcrypt.compare(password, account.access_token);
        if (!ok) return null;

        return {
          id: account.user.id,
          email: account.user.email,
          name: account.user.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      if (token?.role) session.user.role = token.role as UserRole;
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user;
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
