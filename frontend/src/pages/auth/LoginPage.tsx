import { type FormEvent, useState } from "react";

import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import axios from "axios";

import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const sessionExpired = searchParams.get("reason") === "session-expired";

  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Already Logged In
  |--------------------------------------------------------------------------
  */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading RecruitX...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  /*
  |--------------------------------------------------------------------------
  | Submit Login
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Unable to log in");
      } else {
        setError("Unable to log in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg sm:p-8">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="RecruitX logo"
            className="mx-auto mb-2 h-20 w-20 object-contain"
          />

          <div className="mb-3 text-3xl font-bold text-slate-900">RecruitX</div>

          <p className="text-sm text-slate-500">
            Recruitment & Internship Management System
          </p>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to continue to RecruitX.
          </p>
        </div>

        {sessionExpired && !error && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Your session has expired. Please sign in again.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@recruitx.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          RecruitX Staff Portal
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
