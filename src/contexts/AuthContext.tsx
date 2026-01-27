import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user } = await api.getCurrentUser();
      setUser(user);
    } catch (error) {
      setUser(null);
      api.setToken(null);
    }
  };

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          // Token invalid, clear it
          api.setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};



















