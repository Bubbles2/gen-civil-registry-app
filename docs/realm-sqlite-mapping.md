# Realm → SQLite mapping

What the Phase 12 migration moves, and where each field ends up.

- **Old store:** Realm (`files/default.realm`), encrypted, one `FORMS` object per declaration.
- **New store:** SQLite (`databases/crsen.db`), SQLCipher, one `declarations` row per declaration.
- **Same key** for both: `SdkJs.getRealmConfig()` → AsyncStorage `keyDb`.

The short version: **one Realm `FORMS` object = one SQLite row.** The whole
object is stored as JSON in the `body` column, and the eight fields the
Dashboard needs for filtering, sorting and searching are copied out into their
own indexed columns.

---

## 1. The Realm schema

`FORMS` is the only top-level object. Everything else hangs off it; all leaf
fields are strings (no lists, no dates, no numbers).

### FORMS

| Property | Type |
|---|---|
| `ID` | objectId (primary key) |
| `ACT_NAI` | → ACT_NAI |
| `CHILD` | → CHILD |
| `ISEE` | → ISEE |
| `ACT` | → ACT |
| `FATHER` | → FATHER |
| `MOTHER` | → MOTHER |
| `MOTHER_DECEASED` | → MOTHER_DECEASED |
| `FATHER_DECEASED` | → FATHER_DECEASED |
| `DEFUNCT` | → DEFUNCT |
| `DECL` | → DECL |
| `DECES` | → DECES |
| `TYPE` | string (`NAISSANCE` / `DECES`) |
| `STATUS` | string (`BROUILLON` / `VALIDE` / `ARCHIVE` / `ERREUR`) |
| `COLPOINT_CODE` | string |
| `ERROR` | string, default `""` |

### The linked objects

| Object | Properties |
|---|---|
| `ACT` | POINT_COLLECTE, DECL_NUMBER, ACT_DECL_DATE, ACT_DECL_HOUR |
| `ACT_NAI` | DECL_NAISS, INDICATE_FATHER_y8n, TYPE_OF_BIRTH, BIRTH_ADDRESS, ACCOUCHEMENT_DATE, ACCOUCHEMENT_HOUR |
| `CHILD` | CHILD_ALIVE, FIRSTNAME, NAME, SEXE, INFO_NAI → INFO_NAI_CHILD |
| `INFO_NAI_CHILD` | EVT_DATE, EVT_HOUR, EVT_ADDRESS → EVT_ADDRESS_NAI_CHILD |
| `EVT_ADDRESS_NAI_CHILD` | FORWARDING_ADDRESS |
| `ISEE` | LIEU_ACCOUCHEMENT, ISEE_POIDS, NAI_MULTIPLE, NAI_MULTIPLE_BIRTH, NRANG, INFO_NAI → INFO_NAI_ISEE |
| `INFO_NAI_ISEE` | EVT_DATE, EVT_HOUR |
| `FATHER` | DECEASED, NNI_NATIONAL, NATIONAL_ID, NUM_IDENT, FIRSTNAME, NAME, OCCUPATION, TEL_PARENT, INFO_NAI → INFO_NAI_FATHER, INFO_DOM → INFO_DOM_FATHER, INFO_DEC → INFO_DEC_FATHER |
| `INFO_NAI_FATHER` | EVT_DATE, EVT_ADDRESS → EVT_ADDRESS_NAI_FATHER |
| `INFO_DOM_FATHER` | CITY, FORWARDING_ADDRESS |
| `INFO_DEC_FATHER` | EVT_DATE, EVT_KNOWN_DATE, EVT_ADDRESS → EVT_ADDRESS_DEC_FATHER |
| `MOTHER` | DECEASED, NNI_NATIONAL, NATIONAL_ID, NUM_IDENT, FIRSTNAME, NAME, OCCUPATION, INFO_NAI → INFO_NAI_MOTHER, INFO_DOM → INFO_DOM_MOTHER |
| `INFO_NAI_MOTHER` | EVT_DATE, EVT_ADDRESS → EVT_ADDRESS_NAI_MOTHER |
| `INFO_DOM_MOTHER` | CITY, FORWARDING_ADDRESS, SAME_ADR |
| `FATHER_DECEASED` | FIRSTNAME, NAME |
| `MOTHER_DECEASED` | FIRSTNAME, NAME |
| `DEFUNCT` | FIRSTNAME, NAME, NNI_NATIONAL, NATIONAL_ID, NUM_IDENT, SEXE, ACT → ACT, INFO_DEC → INFO_DEC_DEFUNCT, INFO_NAI → INFO_NAI |
| `INFO_DEC_DEFUNCT` | EVT_DATE, EVT_HOUR |
| `INFO_NAI` | EVT_DATE, EVT_ADDRESS → EVT_ADDRESSA |
| `EVT_ADDRESSA` | CITY |
| `DECES` | DEATH_DATA → DEATH_DATA |
| `DEATH_DATA` | KNOWN_DEATH_DATE, BODY_FOUND_DATE |
| `DECL` | DECL_TEL, DECL_FIRSTNAME, DECL_NAME |
| `EVT_ADDRESS_DEC_FATHER` / `EVT_ADDRESS_DEC_MOTHER` / `EVT_ADDRESS_NAI_FATHER` / `EVT_ADDRESS_NAI_MOTHER` | CITY |

28 object types in total. Every string property defaults to `""`.

---

## 2. The SQLite database

```sql
CREATE TABLE declarations (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL,
  status        TEXT NOT NULL,
  colpoint_code TEXT NOT NULL DEFAULT '',
  error         TEXT NOT NULL DEFAULT '',
  evt_date      TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',
  firstname     TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL            -- the whole declaration as JSON
);

CREATE INDEX idx_declarations_type_status ON declarations (type, status);
CREATE INDEX idx_declarations_colpoint    ON declarations (colpoint_code);

CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
```

`meta` holds the migration bookkeeping:

| key | value |
|---|---|
| `realm_migration_done` | `"1"` once the copy succeeded |
| `realm_migration_count` | how many declarations were copied |
| `realm_migration_at` | ISO timestamp of the migration |
| `schema_version` | `"1"` |

---

## 3. The mapping

### Columns

| Realm | SQLite column | Note |
|---|---|---|
| `FORMS.ID` | `id` | ObjectId → its 24-character hex string |
| `FORMS.TYPE` | `type` | |
| `FORMS.STATUS` | `status` | |
| `FORMS.COLPOINT_CODE` | `colpoint_code` | |
| `FORMS.ERROR` | `error` | |
| `CHILD.INFO_NAI.EVT_DATE`, else `ACT_NAI.ACCOUCHEMENT_DATE` (birth)<br>`DEFUNCT.INFO_DEC.EVT_DATE` (death) | `evt_date` | The date the Dashboard sorts and searches on |
| `CHILD.NAME` (birth) / `DEFUNCT.NAME` (death) | `name` | |
| `CHILD.FIRSTNAME` (birth) / `DEFUNCT.FIRSTNAME` (death) | `firstname` | |
| the whole `FORMS` object | `body` | JSON, in Realm schema property order |

The eight lifted columns are **copies**, not the source of truth. Reads always
come from `body`; the columns exist so the filters can run in SQL.

### Rules the copy follows

| Rule | Why |
|---|---|
| `body` keys are written in Realm schema order | `SendDeclarationService` flattens the declaration straight onto the wire and `flatten()` walks `Object.keys` — a different order would change the payload |
| Missing fields get their schema default (`""`) | That is what Realm stored, so the payload keeps the same key set |
| Keys not in the schema are kept, appended last | A migration must not drop data it does not recognise |
| New ids use the same 24-hex ObjectId shape | `externalId` on the wire keeps its format; ids stay comparable across the migration |
| Nothing is renamed, reshaped or flattened | The copy is an identity transform — that is the whole design |

### Where the app's operations land

| App action | Realm before | SQLite now |
|---|---|---|
| Dashboard list | `useQuery("FORMS").filtered(...)` | `SELECT … WHERE type IN (…) AND status IN (…) [AND colpoint_code = ?]` |
| Open/edit a declaration | `objectForPrimaryKey` | `SELECT … WHERE id = ?` |
| Save / duplicate | `realm.create(…, "modified")` | `INSERT … ON CONFLICT(id) DO UPDATE` |
| Validate / send result | write `STATUS`, `ERROR` | `UPDATE status, error, body WHERE id = ?` |
| Delete | `realm.delete` | `DELETE WHERE id = ?` |
| Send batch | `objects("FORMS").filtered("STATUS = 'VALIDE'")` | `SELECT … WHERE status = 'VALIDE'` |

---

## 4. Manual tests

Install the new build **over** existing data (`adb install -r`, never uninstall).
Log in as an agent (`testuser` / `test1234`).

**Migration**

1. First launch after install: logcat shows `migrateFromRealm: migrated N declarations` and the counts per type/status.
2. The Dashboard shows the **same number of rows** as before the upgrade.
3. Force-stop and relaunch: logcat shows `already-done` — it does not migrate twice.
4. `adb shell run-as com.crseneagalmobile.dev ls -l files/default.realm` — the timestamp is unchanged from before the migration.
5. Fresh install on a device with no Realm file: app starts, Dashboard is empty, logcat shows `no-realm-file`.

**Fields survived**

6. Open a migrated **birth** draft and page through all 5 pages — every value is still there, including the nested ones (father's ID number, birth date/time, residence).
7. Open a migrated **death** draft and page through all 4 pages — same check.
8. Check a declaration that had empty optional fields: they are still empty, not missing or `null`.

**The list still behaves**

9. Type filter: Naissance / Décès / Tous each show the right rows.
10. Status filters: tick each of Brouillon, Validé, Archivé, Erreur in turn; untick all four → the list is empty.
11. As an **agent**, only declarations from your own collection point appear; as an **admin**, all of them do.
12. Sort order is unchanged: drafts first, then errors, then validated, then archived; newest date first within each group.
13. Search a child's name, a surname, a date, and something nonsense → hits, hits, hits, zero.

**Writes**

14. Create a new declaration → it appears in the list immediately, without leaving the screen.
15. Duplicate a declaration → the copy gets a new id and both rows exist.
16. Edit a field, save, reopen → the new value is there.
17. Validate a draft → it moves from the Brouillon filter to the Validé filter.
18. Delete a declaration → the row count drops.
19. Force-stop and relaunch after each of the above → the change is still there (it is in SQLite, not just on screen).

**Sending**

20. Select a validated declaration and send it. Against the dev gateway it fails with 401 and the row becomes **Erreur** — that is expected; the point is the status changes.
21. Compare the logged `notification : {...}` payload with one captured before the migration for the **same declaration**: it must be identical.

**Storage**

22. Export (long-press the build ID on the login screen → EXPORTER). The export folder contains `crsen.db`, `dbSenegal.db`, `declarations.realm` and `manifest.txt`.
23. `crsen.db` is encrypted: its first bytes are **not** `SQLite format 3`.
    ```bash
    adb exec-out run-as com.crseneagalmobile.dev head -c 16 databases/crsen.db | od -c
    ```

**Rollback**

24. Reinstall the previous (Realm) build over the top — it reads the untouched Realm file and shows the same declarations. Anything created since the migration exists only in SQLite, which is why the bridge build ships before the Realm-removal one.
