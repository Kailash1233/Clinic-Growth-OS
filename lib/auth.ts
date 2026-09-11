import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.code) return null;

        const ok = await verifyOtp(credentials.identifier, credentials.code);
        if (!ok) return null;

        const isEmail = credentials.identifier.includes("@");
        const where = isEmail ? { email: credentials.identifier } : { phone: credentials.identifier };

        let user = await prisma.user.findFirst({ where });
        if (!user) {
          user = await prisma.user.create({
            data: isEmail ? { email: credentials.identifier } : { phone: credentials.identifier },
          });
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          phone: user.phone ?? undefined,
          role: user.role,
          clinicId: user.clinicId ?? undefined,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.clinicId = (user as any).clinicId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).role = token.role;
        (session.user as any).clinicId = token.clinicId;
      }
      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getServerAuthSession();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return session.user as { id: string; role: "owner" | "admin"; clinicId?: string; email?: string; phone?: string };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
