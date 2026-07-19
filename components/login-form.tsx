"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Anmeldung ist gerade nicht möglich.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("nook konnte nicht erreicht werden. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm text-nook-ink/70">E-Mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-[52px] w-full rounded-[14px] border border-black/10 bg-white/70 px-4 py-3.5 outline-none transition focus:border-nook-teal/50 focus:bg-white focus:ring-4 focus:ring-nook-teal/10"
          placeholder="du@beispiel.ch"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-nook-ink/70">Passwort</span>
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-[52px] w-full rounded-[14px] border border-black/10 bg-white/70 px-4 py-3.5 pr-12 outline-none transition focus:border-nook-teal/50 focus:bg-white focus:ring-4 focus:ring-nook-teal/10"
            placeholder="Dein Passwort"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-nook-muted transition hover:text-nook-ink"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-nook-teal px-5 py-3.5 font-medium text-white shadow-nook transition duration-200 hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <LogIn size={18} />
        )}
        {loading ? "nook wird geöffnet …" : "nook öffnen"}
      </button>

      <p className="text-center text-xs leading-5 text-nook-muted">
        Du bleibst auf diesem Gerät sicher angemeldet.
      </p>
    </form>
  );
}
