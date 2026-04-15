"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BugReportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [priority, setPriority] = useState("medium");
  const [page, setPage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, steps, priority, page }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle("");
        setDescription("");
        setSteps("");
        setPriority("medium");
        setPage("");
      } else {
        const data = await res.json();
        setError(data.error || "Wystąpił błąd");
      }
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <p className="text-lg font-medium">Dziękujemy za zgłoszenie!</p>
          <p className="text-sm text-muted-foreground">
            Twoje zgłoszenie zostało przyjęte i zostanie sprawdzone przez administratora.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setSuccess(false)}>
              Zgłoś kolejny
            </Button>
            <Button onClick={() => router.push("/")}>
              Wróć do dashboardu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nowe zgłoszenie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Tytuł *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Krótki opis problemu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Szczegółowy opis napotykanego problemu..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Kroki do odtworzenia</Label>
            <Textarea
              id="steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={"1. Wejdź na stronę X\n2. Kliknij Y\n3. Zauważ błąd Z"}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorytet</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "medium")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="medium">Średni</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                  <SelectItem value="critical">Krytyczny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page">Strona (URL / nazwa)</Label>
              <Input
                id="page"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="/operations, Dashboard, etc."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Wysyłanie..." : "Wyślij zgłoszenie"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
