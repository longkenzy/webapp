import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!atLeast(session?.user.role, Role.IT_LEAD)) return null;
  const cfg = await db.kPIConfig.findFirst();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="rounded border p-4">
        <div className="text-sm opacity-70">First Response (min)</div>
        <div className="text-lg">{cfg?.firstResponseMinutes}</div>
      </div>
    </div>
  );
}


