"use client";
import { useEffect, useState } from "react";
import { AdminLogin } from "@/features/admin/AdminLogin";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/event", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => {
        if (active && response.ok) setAuthenticated(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      {authenticated ? (
        <AdminDashboard />
      ) : (
        <AdminLogin onSuccess={() => setAuthenticated(true)} />
      )}
    </main>
  );
}
