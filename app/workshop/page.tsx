"use client";

import { ComingSoonPoster } from "@/components/covers";
import { useT } from "@/components/locale-provider";

export default function WorkshopPage() {
  const t = useT();
  return (
    <div className="md:overflow-hidden md:rounded-2xl">
      <ComingSoonPoster title={t("workshopTitle")} />
    </div>
  );
}
