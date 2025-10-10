import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !atLeast(session.user.role, Role.IT_LEAD)) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  let cfg = null;
  try {
    cfg = await db.kPIConfig.findFirst();
  } catch (error) {
    console.error('Error fetching KPI config:', error);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="rounded border p-4">
        <div className="text-sm opacity-70">Configuration</div>
        <div className="text-lg">KPI Config ID: {cfg?.id || 'No config found'}</div>
      </div>
    </div>
  );
}


