import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

type GuestUser = {
  id: "guest";
  email: null;
  user_metadata: {
    full_name: "Atleta";
  };
};

interface AuthContextValue {
  user: User | GuestUser;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

interface AuthModalContextValue {
  isOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const guestUser: GuestUser = {
  id: "guest",
  email: null,
  user_metadata: {
    full_name: "Atleta",
  },
};

const AuthContext = createContext<AuthContextValue>({
  user: guestUser,
  session: null,
  loading: false,
  isAuthenticated: false,
  signOut: async () => {},
  setSession: () => {},
});

const AuthModalContext = createContext<AuthModalContextValue>({
  isOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const authValue = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? guestUser,
    session,
    loading: false,
    isAuthenticated: Boolean(session?.user),
    signOut: async () => setSession(null),
    setSession,
  }), [session]);

  const modalValue = useMemo<AuthModalContextValue>(() => ({
    isOpen,
    openAuthModal: () => setIsOpen(true),
    closeAuthModal: () => setIsOpen(false),
  }), [isOpen]);

  return (
    <AuthContext.Provider value={authValue}>
      <AuthModalContext.Provider value={modalValue}>
        {children}
      </AuthModalContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useAuthModal = () => useContext(AuthModalContext);
