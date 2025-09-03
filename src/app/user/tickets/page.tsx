import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export default async function UserTicketsPage() {
  const session = await getSession();
  const tickets = await db.ticket.findMany({
    where: { requesterId: session?.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">My Tickets</h1>
      <div className="grid gap-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded border p-3">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs opacity-70">{t.status} · {t.priority}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


