import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { PosterPlacement } from "@/lib/data";

export function jsonSaveError(error: unknown, fallback = "保存失败") {
  const message = error instanceof Error ? error.message : fallback;
  console.error("[admin] save", message);
  return NextResponse.json(
    { error: message },
    { status: /timeout/i.test(message) ? 504 : 500 },
  );
}

export function revalidatePosterPaths(placement: PosterPlacement) {
  const extra: Record<PosterPlacement, string[]> = {
    "home-carousel": ["/"],
    "home-banner": ["/"],
    "ai-tools": ["/"],
    workshop: ["/workshop", "/admin/workshop"],
    events: ["/events", "/admin/events"],
    member: ["/member", "/admin/member"],
    about: ["/about", "/admin/about"],
  };
  revalidatePath("/");
  revalidatePath("/admin/posters");
  for (const path of extra[placement] || []) {
    revalidatePath(path);
  }
}
