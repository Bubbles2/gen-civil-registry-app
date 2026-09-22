/**
 * The declaration store, with the signatures `databaseService` exposed for
 * Realm, so the screens keep calling the same things in the same way.
 *
 * Two behaviours are copied deliberately rather than cleaned up, because
 * callers depend on them: `getAllFormByIds` and `getAllValidAct` *reject* when
 * they find nothing ("No act found" / "No valid act") instead of resolving with
 * an empty array — BeBoundService, RestApiService and the Dashboard's send path
 * all treat that rejection as "nothing to do".
 */

import { FORMS_SCHEMA } from "./formsSchema";
import Logger from "../Logger";
import { getDb } from "./sqlite";
import {
  Declaration,
  fromRow,
  hexId,
  newId,
  toRow,
} from "./declarationShape";

export type { Declaration };

const COLUMNS = "id, type, status, colpoint_code, error, evt_date, name, firstname, body";

// ---------------------------------------------------------------- change feed

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Realm results were live: a write re-rendered the Dashboard by itself. SQLite
 * has no such thing, so writes announce themselves here and `useDeclarations`
 * re-runs its query.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChanged(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      Logger.error("declarations.notifyChanged listener failed ", err);
    }
  }
}

// -------------------------------------------------------------------- queries

export type DeclarationFilter = {
  /** "NAISSANCE" | "DECES" | anything else for both. */
  type?: string;
  /** Statuses to include; null/undefined entries are ignored, as Realm did. */
  statuses?: Array<string | null | undefined>;
  /** Non-admin users only see their own collection point. */
  colpointCode?: string | null;
};

/** Exported for tests: the SQL is the behaviour worth pinning down. */
export function buildQuery(filter: DeclarationFilter): { sql: string; params: any[] } | null {
  const types = filter.type === "NAISSANCE" || filter.type === "DECES"
    ? [filter.type]
    : ["NAISSANCE", "DECES"];
  const statuses = (filter.statuses ?? []).filter(
    (s): s is string => s !== null && s !== undefined,
  );
  if (statuses.length === 0) {
    // Realm's "STATUS in {null,null,null,null}" matched nothing; don't ask SQLite.
    return null;
  }
  const params: any[] = [...types, ...statuses];
  let sql =
    `SELECT ${COLUMNS} FROM declarations` +
    ` WHERE type IN (${types.map(() => "?").join(",")})` +
    ` AND status IN (${statuses.map(() => "?").join(",")})`;
  if (filter.colpointCode !== undefined && filter.colpointCode !== null) {
    sql += " AND colpoint_code = ?";
    params.push(filter.colpointCode);
  }
  // Insertion order, like Realm's unsorted results; the Dashboard sorts anyway.
  sql += " ORDER BY rowid";
  return { sql, params };
}

/** The Dashboard's list. Replaces getAllFormValue / getAllFormValueByCP. */
export async function queryDeclarations(filter: DeclarationFilter): Promise<Declaration[]> {
  const query = buildQuery(filter);
  if (!query) {
    return [];
  }
  const db = await getDb();
  const { rows } = await db.execute(query.sql, query.params);
  return rows.map(row => fromRow(row as { body: string }));
}

export async function getFormById(id: unknown): Promise<Declaration | null> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT ${COLUMNS} FROM declarations WHERE id = ?`,
    [hexId(id)],
  );
  return rows.length > 0 ? fromRow(rows[0] as { body: string }) : null;
}

export async function getAllFormByIds(ids: unknown[]): Promise<Declaration[]> {
  const hexIds = (ids ?? []).map(hexId).filter(Boolean);
  if (hexIds.length === 0) {
    throw "No act found";
  }
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT ${COLUMNS} FROM declarations WHERE id IN (${hexIds.map(() => "?").join(",")}) ORDER BY rowid`,
    hexIds,
  );
  if (rows.length === 0) {
    throw "No act found";
  }
  return rows.map(row => fromRow(row as { body: string }));
}

export async function getAllValidAct(): Promise<Declaration[]> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT ${COLUMNS} FROM declarations
       WHERE type IN ('NAISSANCE','DECES') AND status = 'VALIDE' ORDER BY rowid`,
  );
  if (rows.length === 0) {
    throw "No valid act";
  }
  return rows.map(row => fromRow(row as { body: string }));
}

export async function countByTypeAndStatus(): Promise<Record<string, number>> {
  const db = await getDb();
  const { rows } = await db.execute(
    "SELECT type, status, COUNT(*) AS n FROM declarations GROUP BY type, status",
  );
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[`${row.type}|${row.status}`] = Number(row.n);
  }
  return out;
}

// --------------------------------------------------------------------- writes

/** Insert or replace a whole declaration. Replaces Realm's create(…, "modified"). */
export async function addOrUpdateForm(allData: Declaration): Promise<Declaration> {
  const db = await getDb();
  const row = toRow(FORMS_SCHEMA, allData);
  await db.execute(
    `INSERT INTO declarations (${COLUMNS})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         type = excluded.type, status = excluded.status,
         colpoint_code = excluded.colpoint_code, error = excluded.error,
         evt_date = excluded.evt_date, name = excluded.name,
         firstname = excluded.firstname, body = excluded.body`,
    [row.id, row.type, row.status, row.colpoint_code, row.error, row.evt_date,
      row.name, row.firstname, row.body],
  );
  notifyChanged();
  return fromRow(row);
}

/**
 * Status (and optionally error) of one declaration. The body column is the
 * source of truth for reads, so it is rewritten too — read-modify-write rather
 * than json_set(), which would tie the app to a JSON1-enabled SQLCipher build.
 */
export async function updateStatusDb(
  id: unknown,
  newStatus: string,
  error: string | null,
): Promise<Declaration> {
  const db = await getDb();
  const key = hexId(id);
  const { rows } = await db.execute("SELECT body FROM declarations WHERE id = ?", [key]);
  if (rows.length === 0) {
    throw new Error(`updateStatusDb: no declaration with id ${key}`);
  }
  const decl = fromRow(rows[0] as { body: string });
  decl.STATUS = newStatus;
  if (error !== null && error !== undefined) {
    decl.ERROR = error;
  }
  await db.execute(
    "UPDATE declarations SET status = ?, error = ?, body = ? WHERE id = ?",
    [newStatus, decl.ERROR ?? "", JSON.stringify(decl), key],
  );
  notifyChanged();
  return decl;
}

export async function deleteNotification(id: unknown): Promise<boolean> {
  const db = await getDb();
  await db.execute("DELETE FROM declarations WHERE id = ?", [hexId(id)]);
  notifyChanged();
  return true;
}

export { newId };
