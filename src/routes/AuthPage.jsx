import React, { useState } from "react";
import { signIn, signUp } from "../storage/auth/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../storage/auth/AuthContext.jsx";



export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    try {
      if (mode === "login") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);

      // Go to your default route (keep your params model)
      navigate("/1/1", { replace: true });
    } catch (err) {
      setError(err?.message || "Auth failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617]/70 p-6">
        <h1 className="text-lg font-semibold text-white">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs text-slate-300">Email</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Password</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-white text-black font-medium py-2 hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm hover:bg-white/5"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          disabled={busy}
        >
          {mode === "login" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
