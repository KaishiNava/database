import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { dbEngine, query } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (dbEngine === "postgres") {
      const r = await query(`SELECT current_database() AS database, current_user AS "user", version() AS version, pg_size_pretty(pg_database_size(current_database())) AS size, NOW() AS "serverTime", COUNT(*)::int AS "tableCount", COALESCE(SUM(s.n_live_tup),0)::int AS "totalRows" FROM information_schema.tables t LEFT JOIN pg_stat_user_tables s ON s.relname=t.table_name WHERE t.table_schema='public' AND t.table_type='BASE TABLE'`);
      return NextResponse.json({ ...r.rows[0], engine: "PostgreSQL" });
    }
    const r = await query(`SELECT DATABASE() AS database, CURRENT_USER() AS user, VERSION() AS version, ROUND(SUM(data_length + index_length)/1024/1024,2) AS size_mb, NOW() AS serverTime, COUNT(*) AS tableCount FROM information_schema.tables WHERE table_schema = DATABASE()`);
    const total = await query<{totalRows:number}>(`SELECT COALESCE(SUM(table_rows),0) AS totalRows FROM information_schema.tables WHERE table_schema = DATABASE()`);
    return NextResponse.json({ ...r.rows[0], size: `${r.rows[0]?.size_mb ?? 0} MB`, totalRows: total.rows[0]?.totalRows ?? 0, engine: "MySQL / MariaDB" });
  } catch { return NextResponse.json({ error: "Gagal mengambil statistik database." }, { status: 500 }); }
}
