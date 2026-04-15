"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Błąd rejestracji");
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Błąd połączenia z serwerem");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,oklch(0.2_0.03_60),oklch(0.12_0.02_50))]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛸</div>
          <h1 className="text-2xl font-bold tracking-wide text-primary">REJESTRACJA</h1>
          <p className="text-sm text-muted-foreground mt-1">Dołącz do Centrum Dowodzenia UFOLODZY</p>
          <p className="text-xs text-primary/50 mt-1 font-mono">Travian RoF x3</p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg shadow-primary/5 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">
                Nazwa użytkownika
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="np. twoj_nick"
                required
                autoFocus
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">
                Nick w Travianie (opcjonalnie)
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="np. PeterPage"
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Hasło
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 znaków"
                required
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
                Potwierdź hasło
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Powtórz hasło"
                required
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={loading}
            >
              {loading ? "Rejestracja..." : "🛸 Zarejestruj się"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              Masz już konto?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 underline underline-offset-2">
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
          © 2026 UFOLODZY Alliance
        </p>
      </div>
    </div>
  );
}
