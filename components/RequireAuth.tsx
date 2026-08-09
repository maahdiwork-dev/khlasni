"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  // Hydration guard: the first client render uses the server auth snapshot (null),
  // so redirecting immediately bounces logged-in users off deep links on refresh.
  // Wait one effect tick for the real localStorage session before deciding.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
