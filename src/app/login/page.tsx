"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "登录失败");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-8 w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-6 text-center">Login</h2>
        {error && (
          <p className="text-danger text-sm mb-4 text-center">{error}</p>
        )}
        <input
          name="username"
          type="text"
          placeholder="Username"
          required
          className="w-full bg-background border border-border rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:border-accent"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full bg-background border border-border rounded-lg px-4 py-2 mb-6 text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
