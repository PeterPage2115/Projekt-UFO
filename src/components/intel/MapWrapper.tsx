"use client";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(
  () => import("@/components/intel/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Ładowanie mapy...
      </div>
    ),
  },
);

export function MapWrapper() {
  return <InteractiveMap />;
}
