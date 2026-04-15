"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const [, startTransition] = useTransition();

  function setLocale(locale: string) {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-2"
        onClick={() => setLocale("pl")}
      >
        🇵🇱
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-2"
        onClick={() => setLocale("en")}
      >
        🇬🇧
      </Button>
    </div>
  );
}
