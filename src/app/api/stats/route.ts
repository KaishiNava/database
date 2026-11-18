import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await pool.query(`SELECT current_database() AS database, current_user AS "user", version() AS version, pg_size_pretty(pg_database_size(current_database())) AS size, NOW() AS "serverTime", COUNT(*)::int AS "tableCount", COALESCE(SUM(s.n_live_tup),0)::int AS "totalRows" FROM information_schema.tables t LEFT JOIN pg_stat_user_tables s ON s.relname=t.table_name WHERE t.table_schema='public' AND t.table_type='BASE TABLE'`);
    return NextResponse.json(r.rows[0]);
  } catch { return NextResponse.json({ error: "Gagal mengambil statistik database." }, { status: 500 }); }
}
