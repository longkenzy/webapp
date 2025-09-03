import { Role } from "@prisma/client";

export const RoleHierarchy: Record<Role, number> = {
  [Role.ADMIN]: 4,
  [Role.IT_LEAD]: 3,
  [Role.IT_STAFF]: 2,
  [Role.USER]: 1,
};

export function hasRole(userRole: Role | null | undefined, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function atLeast(userRole: Role | null | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  return RoleHierarchy[userRole] >= RoleHierarchy[minRole];
}


