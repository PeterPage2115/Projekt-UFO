"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-3 border-b bg-background">
      <div className="text-sm text-muted-foreground">
        Centrum Dowodzenia Sojuszu
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {session?.user && (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {(session.user as { displayName?: string; username?: string }).displayName ??
                (session.user as { username?: string }).username}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {(session.user as { role?: string }).role ?? "member"}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
