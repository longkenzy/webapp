import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  debug: false,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - keep session active for a long time
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days - keep JWT active for a long time
  },
  pages: {},
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Optimized single query with necessary fields including department and employee info
          const user = await db.user.findFirst({ 
            where: { 
              OR: [
                { email: credentials.email },
                { username: credentials.email }
              ]
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              department: true,
              password: true,
              employee: {
                select: {
                  id: true,
                  fullName: true,
                  position: true,
                  department: true
                }
              }
            }
          });
          
          if (!user) {
            return null;
          }
          
          // Check if user account is active
          if (user.status !== 'active') {
            throw new Error('ACCOUNT_INACTIVE');
          }
          
          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            return null;
          }
          
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name ?? null, 
            role: user.role, 
            status: user.status,
            department: user.department,
            employee: user.employee
          };
        } catch (error) {
          // Return specific error for inactive account
          if (error instanceof Error && error.message === 'ACCOUNT_INACTIVE') {
            throw new Error('ACCOUNT_INACTIVE');
          }
          
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom field
        token.role = (user as { role?: string }).role;
        token.loginTime = Date.now();
        token.status = (user as { status?: string }).status;
        token.department = (user as { department?: string }).department;
        token.employee = (user as { employee?: any }).employee;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token as { role?: string }).role as Role;
        session.user.loginTime = (token as { loginTime?: number }).loginTime;
        session.user.status = (token as { status?: string }).status;
        session.user.department = (token as { department?: string }).department;
        session.user.employee = (token as { employee?: any }).employee;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days - keep cookie active for a long time
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-here-change-this-in-production",
};


