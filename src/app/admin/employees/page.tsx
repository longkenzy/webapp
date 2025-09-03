import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export default async function EmployeesPage() {
  const session = await getSession();
  if (!atLeast(session?.user.role, Role.IT_LEAD)) return null;
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Employees</h1>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="rounded border p-3 flex justify-between">
            <span>{u.email}</span>
            <span className="text-xs opacity-70">{u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


