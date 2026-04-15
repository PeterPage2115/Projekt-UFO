"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-h-[80px] resize-y";

export function NewOperationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"attack" | "fake_and_real" | "scout">(
    "attack"
  );
  const [landingTime, setLandingTime] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          landingTime: landingTime || undefined,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się utworzyć operacji");
      }

      const data = await res.json();
      router.push(`/operations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">⚔️ Nowa operacja</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Szczegóły operacji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nazwa operacji *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Operacja Burza"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <select
                id="type"
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as "attack" | "fake_and_real" | "scout"
                  )
                }
                className={selectClassName}
              >
                <option value="attack">Atak</option>
                <option value="fake_and_real">Fejki + Reale</option>
                <option value="scout">Zwiad</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landingTime">Czas lądowania</Label>
              <Input
                id="landingTime"
                type="datetime-local"
                value={landingTime}
                onChange={(e) => setLandingTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcjonalny opis operacji..."
                className={textareaClassName}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Tworzenie..." : "Utwórz operację"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
