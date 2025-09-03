import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  debug: false,
  session: { 
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour (3600 seconds)
    updateAge: 60 * 60, // Update session every hour
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
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
        console.log('🔍 NextAuth authorize called with:', { email: credentials?.email });
        console.log('🔧 Environment check - NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
        console.log('🔧 Environment check - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }
        
        try {
          console.log('🔧 Attempting database connection...');
          const user = await db.user.findFirst({ 
            where: { 
              OR: [
                { email: credentials.email },
                { username: credentials.email }
              ]
            } 
          });
          console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found');
          
          if (!user) {
            console.log('❌ User not found');
            return null;
          }
          
          // Check if user account is active
          if (user.status !== 'active') {
            console.log('❌ User account is inactive:', user.status);
            return null;
          }
          
          console.log('🔧 Attempting password comparison...');
          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔐 Password valid:', isValid);
          
          if (!isValid) {
            console.log('❌ Invalid password');
            return null;
          }
          
          console.log('✅ Authorization successful');
          return { id: user.id, email: user.email, name: user.name ?? null, role: user.role, status: user.status };
        } catch (error) {
          console.error('❌ Error in authorize:', error);
          console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
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
        // @ts-expect-error custom field
        token.loginTime = Date.now();
        // @ts-expect-error custom field
        token.status = (user as { status?: string }).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error custom field
        session.user.id = token.sub as string;
        // @ts-expect-error custom field
        session.user.role = (token as { role?: string }).role;
        // @ts-expect-error custom field
        session.user.loginTime = (token as { loginTime?: number }).loginTime;
        // @ts-expect-error custom field
        session.user.status = (token as { status?: string }).status;
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
        maxAge: 60 * 60, // 1 hour
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-here-change-this-in-production",
};


