"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User } from "./api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem("skillswap_token");
    if (!token) { setLoading(false); return; }
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch {
      localStorage.removeItem("skillswap_token");
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("skillswap_token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("skillswap_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
