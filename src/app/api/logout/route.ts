import { NextResponse } from "next/server";
import { clearSession, getAdminSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST() {
  if (await getAdminSession()) clearSession();
  return NextResponse.json({ ok: true });
}
