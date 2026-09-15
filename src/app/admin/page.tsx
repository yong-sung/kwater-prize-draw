"use client";
import { useState } from "react";
import { AdminLogin } from "@/features/admin/AdminLogin";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
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
