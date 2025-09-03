"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok) setMsg("Registered. You can now login.");
    else setMsg(data.error || "Error");
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded border px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded border px-3 py-2 bg-transparent" />
        </div>
        {msg && <p className="text-sm">{msg}</p>}
        <button disabled={loading} className="w-full bg-black text-white rounded py-2 disabled:opacity-50">{loading ? "Submitting..." : "Register"}</button>
      </form>
    </div>
  );
}
