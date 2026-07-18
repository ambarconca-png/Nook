import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await deleteCurrentSession();
  return NextResponse.json({ ok: true });
}
