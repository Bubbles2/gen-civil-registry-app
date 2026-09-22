/**
 * What `useQuery("FORMS").filtered(...)` used to do for the Dashboard.
 *
 * Realm results were live, so a write anywhere re-rendered the list for free.
 * SQLite has no live results, so this re-runs the query when the filter changes
 * and whenever the store announces a write (see declarations.subscribe). The
 * Dashboard's own code is unchanged: it still receives a plain array of
 * declarations with the same nested shape.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Logger from "../Logger";
import {
  Declaration,
  DeclarationFilter,
  queryDeclarations,
  subscribe,
} from "./declarations";

export function useDeclarations(filter: DeclarationFilter): Declaration[] {
  const [rows, setRows] = useState<Declaration[]>([]);

  // The filter is rebuilt on every render; depend on its contents, not identity.
  // The Dashboard passes one entry per status checkbox, null when unticked.
  const type = filter.type;
  const colpointCode = filter.colpointCode;
  const statusKey = (filter.statuses ?? []).filter(Boolean).join("|");

  // Queries are async, so a result can arrive after the screen is gone — either
  // because the filter changed or because a write triggered a reload mid-flight.
  const live = useRef(true);

  const reload = useCallback(() => {
    queryDeclarations({
      type,
      colpointCode,
      statuses: statusKey === "" ? [] : statusKey.split("|"),
    })
      .then(result => {
        if (live.current) {
          setRows(result);
        }
      })
      .catch(err => Logger.error("useDeclarations query failed ", err));
  }, [type, colpointCode, statusKey]);

  useEffect(() => {
    live.current = true;
    reload();
    const unsubscribe = subscribe(reload);
    return () => {
      live.current = false;
      unsubscribe();
    };
  }, [reload]);

  return rows;
}

export type { Declaration };
