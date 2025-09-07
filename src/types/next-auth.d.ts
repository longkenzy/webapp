import NextAuth, { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status?: string;
      loginTime?: number;
      department?: string;
      employee?: {
        id: string;
        fullName: string;
        position: string;
        department: string;
      };
    } & DefaultSession["user"]; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    status?: string;
    loginTime?: number;
    department?: string;
    employee?: {
      id: string;
      fullName: string;
      position: string;
      department: string;
    };
  }
}


