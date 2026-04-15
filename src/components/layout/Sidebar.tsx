"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
};

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Centrum",
    items: [
      { label: "Dashboard", href: "/", icon: "📊" },
    ],
  },
  {
    title: "Dowodzenie",
    items: [
      { label: "Operacje", href: "/operations", icon: "🗡️" },
      { label: "Obrona", href: "/defense", icon: "🛡️" },
      { label: "Wojska", href: "/troops", icon: "⚔️" },
    ],
  },
  {
    title: "Wywiad",
    items: [
      { label: "Mapa", href: "/intel/map", icon: "🗺️" },
      { label: "Wyszukiwarka", href: "/intel/search", icon: "🔍" },
      { label: "Nieaktywni", href: "/intel/inactive", icon: "💤" },
    ],
  },
  {
    title: "Narzędzia",
    items: [
      { label: "Przechwycenie", href: "/tools/intercept", icon: "🎯" },
      { label: "Trening", href: "/tools/training", icon: "🏋️" },
      { label: "Dystans", href: "/tools/distance", icon: "📏" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Panel admina", href: "/admin", icon: "⚙️", roles: ["admin"] },
      { label: "Użytkownicy", href: "/admin/users", icon: "👥", roles: ["admin", "leader"] },
      { label: "Logi", href: "/admin/logs", icon: "📋", roles: ["admin"] },
      { label: "Błędy", href: "/admin/bugs", icon: "🐛", roles: ["admin"] },
    ],
  },
];

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "member";

  return (
    <ScrollArea className="flex-1 py-2">
      {navSections.map((section) => {
        const visibleItems = section.items.filter(
          (item) => !item.roles || item.roles.includes(userRole),
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="mb-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {section.title}
            </p>
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent",
                    isActive && "bg-accent text-accent-foreground font-medium",
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <Separator className="mt-2" />
          </div>
        );
      })}
    </ScrollArea>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "member";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 border-r bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="text-2xl">🛸</span>
          <div>
            <h1 className="text-sm font-bold leading-tight">PROJEKT UFO</h1>
            <p className="text-[10px] text-muted-foreground">UFOLODZY</p>
          </div>
        </div>
        <Separator />
        <NavContent />
        <Separator />
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm truncate">
              {(session?.user as { displayName?: string; username?: string } | undefined)?.displayName ??
                (session?.user as { username?: string } | undefined)?.username}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {userRole}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Wyloguj się
          </Button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <MobileSidebar />
    </>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "member";

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b">
      <div className="flex items-center gap-2">
        <span className="text-xl">🛸</span>
        <span className="text-sm font-bold">PROJEKT UFO</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground"
        >
          ☰
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-4 py-4">
            <SheetTitle className="flex items-center gap-2">
              <span>🛸</span> PROJEKT UFO
            </SheetTitle>
          </SheetHeader>
          <NavContent onItemClick={() => setOpen(false)} />
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {(session?.user as { displayName?: string; username?: string } | undefined)?.displayName ??
                  (session?.user as { username?: string } | undefined)?.username}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {userRole}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Wyloguj się
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
