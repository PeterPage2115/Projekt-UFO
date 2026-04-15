"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Nieprawidłowa nazwa użytkownika lub hasło");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,oklch(0.2_0.03_60),oklch(0.12_0.02_50))]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛸</div>
          <h1 className="text-2xl font-bold tracking-wide text-primary">PROJEKT UFO</h1>
          <p className="text-sm text-muted-foreground mt-1">Centrum Dowodzenia Sojuszu UFOLODZY</p>
          <p className="text-xs text-primary/50 mt-1 font-mono">Travian RoF x3</p>
        </div>

        {/* Card */}
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
                placeholder="twój nick"
                required
                autoFocus
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
                placeholder="••••••••"
                required
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={loading}
            >
              {loading ? "Logowanie..." : "⚔️ Zaloguj się"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              Nie masz konta?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 underline underline-offset-2">
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
          © 2026 UFOLODZY Alliance
        </p>
      </div>
    </div>
  );
}
