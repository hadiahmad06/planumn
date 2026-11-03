"use client";
import { useEffect, useState, type FormEvent } from "react";
import { browserSupabase } from "./client";
import { passwordRules, validPassword } from "./validation";
const field =
  "mt-1 w-full rounded-row border border-border-strong bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-accent";
/** Written by Michael's Codex. Signup without a session awaits confirmation. */
export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (
      mode === "register" &&
      (!validPassword(password) || password !== confirmation)
    ) {
      setError("Check the password requirements and matching confirmation.");
      return;
    }
    setPending(true);
    try {
      const client = browserSupabase();
      const result =
        mode === "login"
          ? await client.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
          : await client.auth.signUp({
              email: email.trim(),
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            });
      if (result.error) throw result.error;
      if (result.data.session) onSuccess?.();
      else {
        setMessage("Check your email for a confirmation link, then sign in.");
        setCooldown(60);
      }
      setPassword("");
      setConfirmation("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
    } finally {
      setPending(false);
    }
  }
  async function resend() {
    setPending(true);
    setError("");
    try {
      const { error } = await browserSupabase().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setCooldown(60);
      setMessage("Confirmation email sent. Check your inbox.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email could not be sent.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        {(["login", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-row border px-3 py-2 ${mode === value ? "border-accent bg-accent-soft text-accent" : "border-border"}`}
          >
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <label className="block">
        Email
        <input
          className={field}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block">
        Password
        <input
          className={field}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {mode === "register" && (
        <>
          <label className="block">
            Confirm password
            <input
              className={field}
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <ul className="space-y-1 text-xs text-text-secondary">
            {passwordRules.map((rule) => (
              <li key={rule.label}>
                {rule.test(password) ? "✓ " : "○ "}
                {rule.label}
              </li>
            ))}
          </ul>
        </>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {message && (
        <div role="status">
          <p>{message}</p>
          <button
            type="button"
            className="mt-2 text-accent underline disabled:opacity-50"
            disabled={cooldown > 0 || pending}
            onClick={() => void resend()}
          >
            {cooldown ? `Resend in ${cooldown}s` : "Resend confirmation"}
          </button>
        </div>
      )}
      <button
        disabled={pending}
        className="w-full rounded-row bg-accent px-4 py-2.5 font-medium text-surface hover:bg-accent-hover disabled:opacity-50"
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
