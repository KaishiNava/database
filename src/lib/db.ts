import { Pool as PgPool } from "pg";
import mysql, { type Pool as MysqlPool, type FieldPacket, type ResultSetHeader } from "mysql2/promise";

export type Engine = "postgres" | "mysql";
const engine = (process.env.DB_TYPE || "postgres").toLowerCase();
if (!["postgres", "postgresql", "mysql", "mariadb"].includes(engine)) {
  throw new Error("DB_TYPE harus postgres atau mysql. SQLite/MongoDB belum didukung oleh adapter ini.");
}
export const dbEngine: Engine = engine === "mysql" || engine === "mariadb" ? "mysql" : "postgres";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL belum diatur.");

declare global {
  // eslint-disable-next-line no-var
  var nexadbPgPool: PgPool | undefined;
  // eslint-disable-next-line no-var
  var nexadbMysqlPool: MysqlPool | undefined;
}

const pgPool = dbEngine === "postgres" ? (global.nexadbPgPool ?? new PgPool({
  connectionString, ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false },
  max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000
})) : undefined;
const mysqlUrl = dbEngine === "mysql" ? new URL(connectionString) : null;
const mysqlPool = dbEngine === "mysql" ? (global.nexadbMysqlPool ?? mysql.createPool({
  host: mysqlUrl!.hostname, port: Number(mysqlUrl!.port || 3306),
  user: decodeURIComponent(mysqlUrl!.username), password: decodeURIComponent(mysqlUrl!.password),
  database: decodeURIComponent(mysqlUrl!.pathname.replace(/^\//, "")),
  waitForConnections: true, connectionLimit: 5, queueLimit: 0,
  ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false }
})) : undefined;
if (process.env.NODE_ENV !== "production") {
  if (pgPool) global.nexadbPgPool = pgPool;
  if (mysqlPool) global.nexadbMysqlPool = mysqlPool;
}

function mysqlPlaceholders(sql: string) {
  return sql.replace(/\$(\d+)/g, "?");
}
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  if (dbEngine === "postgres") {
    const result = await pgPool!.query(sql, params);
    return { rows: result.rows as T[], fields: result.fields?.map(f => f.name) ?? [], rowCount: result.rowCount ?? 0, command: result.command ?? "OK" };
  }
  const [rows, fields] = await mysqlPool!.execute(mysqlPlaceholders(sql), params as (string | number | boolean | Date | Buffer | null)[]);
  const isRows = Array.isArray(rows);
  return {
    rows: (isRows ? rows : []) as T[],
    fields: isRows && Array.isArray(fields) ? (fields as FieldPacket[]).map(f => f.name) : [],
    rowCount: isRows ? (rows as unknown[]).length : Number((rows as ResultSetHeader).affectedRows ?? 0),
    command: isRows ? "SELECT" : "WRITE"
  };
}

export async function listTables() {
  if (dbEngine === "postgres") return (await query<{table_name:string}>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name")).rows;
  return (await query<{table_name:string}>("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name")).rows;
}
export async function getTableRows(name: string) {
  const quoted = dbEngine === "mysql" ? `\`${name}\`` : `"${name}"`;
  const exists = dbEngine === "mysql"
    ? await query("SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = $1", [name])
    : await query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1", [name]);
  if (!exists.rowCount) return null;
  const result = await query(`SELECT * FROM ${dbEngine === "mysql" ? "" : "public."}${quoted} LIMIT 100`);
  return { columns: result.fields, rows: result.rows, rowCount: result.rowCount };
}
