import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export default async function UserSchedulePage() {
  const session = await getSession();
  const schedules = await db.schedule.findMany({ where: { userId: session?.user.id }, orderBy: { startAt: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">My Schedule</h1>
      <ul className="space-y-2">
        {schedules.map((s) => (
          <li key={s.id} className="rounded border p-3">
            <div className="font-medium">{s.title}</div>
            <div className="text-xs opacity-70">{s.startAt.toISOString()} → {s.endAt.toISOString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


