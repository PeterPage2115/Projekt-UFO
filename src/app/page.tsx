import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-auto">
        <Navbar />
        <main className="flex-1 p-6 pt-16 md:pt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">🛸 Centrum Dowodzenia</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sojusz UFOLODZY — Travian RoF x3
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🗡️ Aktywne operacje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🛡️ Wezwania obrony
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  👥 Członkowie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  📊 Ostatni snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ostatnia aktywność</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Brak danych — system właśnie wystartował. Skonfiguruj map.sql collector, aby rozpocząć zbieranie danych.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
