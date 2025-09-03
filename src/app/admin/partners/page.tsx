import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export default async function PartnersPage() {
  const session = await getSession();
  if (!atLeast(session?.user.role, Role.IT_STAFF)) return null;
  const partners = await db.partner.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Partners</h1>
      <ul className="space-y-2">
        {partners.map((p) => (
          <li key={p.id} className="rounded border p-3 flex justify-between">
            <span>{p.name}</span>
            <span className="text-xs opacity-70">{p.email ?? ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


