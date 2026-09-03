"use client";

import { ComingSoonPoster } from "@/components/covers";
import { useT } from "@/components/locale-provider";

export default function EventsPage() {
  const t = useT();
  return (
    <div className="md:overflow-hidden md:rounded-2xl">
      <ComingSoonPoster title={t("eventsTitle")} />
    </div>
  );
}
