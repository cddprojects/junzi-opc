import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { jsonSaveError, revalidatePosterPaths } from "@/lib/admin-save";
import { posterFieldsFromBody } from "@/lib/poster";
import { readStore, savePoster } from "@/lib/store";
import type { Poster } from "@/lib/data";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json((await readStore()).posters);
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Partial<Poster>;
    const fields = posterFieldsFromBody(body);
    if (!fields.title) {
      return NextResponse.json({ error: "请填写标题" }, { status: 400 });
    }
    const store = await readStore();
    const poster = await savePoster({
      id: randomUUID(),
      ...fields,
      sort: Number.isFinite(fields.sort) ? fields.sort : store.posters.length,
    });
    revalidatePosterPaths(poster.placement);
    return NextResponse.json(poster);
  } catch (error) {
    return jsonSaveError(error);
  }
}
