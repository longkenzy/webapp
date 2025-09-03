import { getSession } from "@/lib/auth/session";

export default async function UserProfilePage() {
  const session = await getSession();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <div className="rounded border p-4">
        <div>Email: {session?.user.email}</div>
        <div>Role: {session?.user.role}</div>
      </div>
    </div>
  );
}


