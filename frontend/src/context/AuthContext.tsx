import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";

import type {
  LoginResponse,
  User,
} from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | Restore Existing Login
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(
        "recruitx_token"
      );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<{
          status: string;
          user: User;
        }>("/auth/me");

        setUser(response.data.user);

        localStorage.setItem(
          "recruitx_user",
          JSON.stringify(response.data.user)
        );
      } catch (error) {
        localStorage.removeItem(
          "recruitx_token"
        );

        localStorage.removeItem(
          "recruitx_user"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login = async (
    email: string,
    password: string
  ) => {
    const response =
      await api.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        }
      );

    localStorage.setItem(
      "recruitx_token",
      response.data.token
    );

    localStorage.setItem(
      "recruitx_user",
      JSON.stringify(response.data.user)
    );

    setUser(response.data.user);
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem(
      "recruitx_token"
    );

    localStorage.removeItem(
      "recruitx_user"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}