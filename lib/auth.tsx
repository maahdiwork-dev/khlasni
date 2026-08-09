"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

// Demo auth: any credentials sign you into the one hardcoded freelancer account.
// Session lives in localStorage. Never reuse this pattern for real user data.

export type User = {
  id: string;
  name: string;
  email: string;
};

const DEMO_USER: User = {
  id: "u_sami",
  name: "Sami Trabelsi",
  email: "sami@khlasni.tn",
};

type AuthResult = { ok: true } | { ok: false; error: string };

const SESSION_KEY = "khlasni_session";

// The session is read through useSyncExternalStore so React stays in sync
// with localStorage (including same-tab writes from logIn/logOut)
// without the hydration flash a mount effect + setState would cause.
const sessionListeners = new Set<() => void>();

function notifySessionChange() {
  for (const listener of sessionListeners) listener();
}

function subscribeToSession(listener: () => void) {
  sessionListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

let cachedRaw: string | null = null;
let cachedSession: User | null = null;

function readSessionSnapshot(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function readServerSessionSnapshot(): User | null {
  return null;
}

function writeSession(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  notifySessionChange();
}

type Auth = {
  user: User | null;
  logIn: (email: string, password: string) => AuthResult;
  logOut: () => void;
};

const AuthCtx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    subscribeToSession,
    readSessionSnapshot,
    readServerSessionSnapshot
  );

  const logIn: Auth["logIn"] = useCallback(() => {
    writeSession(DEMO_USER);
    return { ok: true };
  }, []);

  const logOut = useCallback(() => {
    writeSession(null);
  }, []);

  const value = useMemo(() => ({ user, logIn, logOut }), [user, logIn, logOut]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
