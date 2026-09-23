# Phase 12 — declarations off Realm, onto encrypted SQLite (bridge release)

Working tree on `feature/phase1` off Phase 11. Run 2026-09-22.
Toolchain unchanged: RN 0.75.5 · Gradle 8.8 · AGP 8.5.0 · Kotlin 1.9.25 · JDK 21 ·
compileSdk 34 · targetSdk 33 · NDK 25.1.

This is the **bridge release** the plan describes: the declarations move to a new
encrypted SQLite store, Realm is still installed and is opened exactly once —
read-only, to migrate — and the Realm file is never written, renamed or deleted.
Reference data and users stay in `dbSenegal.db` (react-native-sqlite-storage);
folding them into the same store, and deleting Realm, is the follow-up release
(plan step 85), which must not ship until every office reports a completed
migration.

## Result in one line

18 live declarations migrated on the dev device in **752 ms**, and the same
declaration re-sent afterwards produced a **byte-identical wire payload**.

## The store

One row per declaration: the form body as JSON, with the fields the Dashboard
filters, sorts and searches on lifted into indexed columns.

```sql
CREATE TABLE declarations (
  id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL,
  colpoint_code TEXT NOT NULL DEFAULT '', error TEXT NOT NULL DEFAULT '',
  evt_date TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '',
  firstname TEXT NOT NULL DEFAULT '', body TEXT NOT NULL);
CREATE INDEX idx_declarations_type_status ON declarations (type, status);
CREATE INDEX idx_declarations_colpoint    ON declarations (colpoint_code);
CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
```

`crsen.db`, opened by `@op-engineering/op-sqlite` with the SQLCipher build. The
key is the value Realm already used (`SdkJs.getRealmConfig()` → AsyncStorage
`keyDb`): no new key management, deliberately. Appendix D's finding that the key
is a committed literal is unchanged and still a separate project — but it is now
a `PRAGMA rekey` away from being fixable, which was the point.

Verified encrypted on the device: `crsen.db` begins with random bytes, where the
old `dbSenegal.db` still begins with the plaintext `SQLite format 3` header.

| File | src/core/db/ | What it does |
|---|---|---|
| `schema.ts` | DDL, db name, meta keys | |
| `formsSchema.ts` | the declaration object graph as plain data — **generated** | |
| `declarationShape.ts` | declaration ⇄ row, schema-order serialisation, id handling | |
| `sqlite.ts` | the one connection, key retrieval, DDL, meta table | |
| `declarations.ts` | the DAL: same function names `databaseService` exposed | |
| `migrateFromRealm.ts` | the one-time copy | |
| `useDeclarations.ts` | replaces Realm's live `useQuery` | |
| `bootstrap.ts` | what App.tsx runs before the navigator mounts | |

## Why the payload stays identical

`SendDeclarationService` flattens a declaration straight onto the wire, and
`flatten()` walks `Object.keys`. Realm's `toJSON` emitted properties in schema
declaration order; a plain object would emit them in whatever order the form
filled them. So `orderBySchema` rebuilds every stored declaration in schema
order, and `toRealmInput`'s defaults still fill the fields the form skipped —
the same `""`s Realm stored. Keys the schema does not declare are kept and
appended rather than dropped: a migration must not lose data it does not
recognise.

The schema itself is *generated*, not hand-copied: `scripts/generate-forms-schema.js`
parses `src/realmSchema/` — following `config.schema` rather than the directory,
because two files there were never in the config and one is a stale duplicate —
and `__tests__/formsSchema.test.ts` re-derives it and fails on drift.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 385 533 B (Phase 11: 5 358 354; +27 kB for the store and op-sqlite's JS) |
| V2 `tsc` | **480** (Phase 11 baseline 482) — nothing new in `src/core/db` |
| V3 Jest | **109/109**, up from 57: 23 shape/ordering, 11 migration, 12 query-semantics, 5 schema-drift, plus the existing suites |
| V4 | **8/8** APKs, `BUILD SUCCESSFUL`. Release 145.06 MB (Phase 11: 121.94; +23.1 MB, all of it op-sqlite's native libraries — see below), debug 243.15 MB dev / 237.71 other |
| V5 vs Phase 11 | permissions (17) and the merged manifest **identical**; `lib/` gains exactly `libop-sqlite.so` and `libcrypto.so` per ABI (213 → 221 entries) and one dex file. Nothing silent. |
| V6 on the migrated device | migration 18/18 in 752 ms · second launch `already-done` in 262 ms · login · 18 rows · duplicate → save (19, list refreshed by itself) · restart → still 19 · reopen draft through 4 pages with nested `FATHER.*` intact · VALIDER · filters (1 Validé) · long-press → select → ENVOYER → `ERREUR` (dev gateway 401, expected) · searches 4/12/0 · export |
| V7 | **byte-identical**. The same declaration (`externalId 6ab252da9a0d7a548d0385dd`) was sent from Realm in Phase 11 and from the migrated store here: same 27 metadata keys, same order, same values. |

## The migration, and what guarantees what

```
openDb: crsen.db ready (SQLCipher: true)
migrateFromRealm: copying 18 declarations
migrateFromRealm: migrated 18 declarations {"DECES|ERREUR":1,"NAISSANCE|ERREUR":13,"NAISSANCE|BROUILLON":4}
initDeclarationStore: migrated (18 declarations, 752 ms)
```

- **Runs before the navigator mounts** (App.tsx), so no screen can read a
  half-filled store. On every later launch it is one meta lookup.
- **Realm is opened read-only**, through `Realm.exists()` first — `Realm.open`
  would *create* an empty file, and an empty file would migrate zero rows and
  then set the done-flag, losing nothing but proving nothing.
- **One transaction.** A crash halfway leaves an empty table and the flag unset;
  the next launch starts again from the untouched Realm file.
- **Counts are verified per type and status inside the transaction**, before the
  flag is set. A mismatch rolls back and the app stays on Realm.
- **The Realm file is never touched.** Measured, not asserted: its mtime on the
  device was 14:17 before the migration and still 14:17 after the migration and
  a full session of reads and writes. The plan calls for renaming it to
  `.migrated` afterwards; that is deliberately **not** done here — renaming
  needs a new native file API, and leaving the file exactly as it is makes
  rolling back to the Part 1 build a non-event, which is the property the bridge
  exists for. Renaming belongs with the follow-up release that removes Realm.

## The APK grew by 23 MB, and 4 MB of that was avoidable

op-sqlite's native libraries add 23.1 MB (compressed, all four ABIs) to every
release APK: `libcrypto.so` 16.97 MB (OpenSSL, which SQLCipher needs) and
`libop-sqlite.so` 6.09 MB. That is the real price of encrypted SQLite and it is
worth knowing before a canary: field devices download this.

A further 4.25 MB was pure waste. op-sqlite ships CR-SQLite (3.75 MB) and
sqlite-vec (0.50 MB) as prebuilt `.so` in its `jniLibs` for every ABI, and AGP
packages whatever is in `jniLibs` regardless of configuration — even though
`package.json` enables only `sqlcipher`, and the two `sqlite3_load_extension`
calls are compile-guarded by `OP_SQLITE_USE_CRSQLITE` / `OP_SQLITE_USE_SQLITE_VEC`,
neither of which is defined in this build. They can never be reached, so
`android/app/build.gradle` excludes them:

```gradle
jniLibs { excludes += ["**/libcrsqlite.so", "**/libsqlite_vec.so"] }
```

prod release 149.40 MB → **145.06 MB**, and the store was re-verified on the
device afterwards (`openDb: crsen.db ready (SQLCipher: true)`, 19 rows).

For comparison, `librealm.so` is 44.53 MB of the current APK: the follow-up
release that removes Realm takes far more out than this phase put in.

## Changes outside src/core/db

| File | Change |
|---|---|
| `App.tsx` | runs `initDeclarationStore()` before the navigator; `RealmProvider` removed — nothing but the migrator opens Realm now |
| `Dashboard.tsx` | `useQuery("FORMS").filtered(...)` → `useDeclarations({type, statuses, colpointCode})`; `updateStatus(new Realm.BSON.ObjectId(act.ID.toString()), …)` → `updateStatus(act.ID, …)` |
| `Forms.tsx` | `addOrUpdateForm`/`getFormById` from the new store; `new Realm.BSON.ObjectId()` → `newId()` for duplicates |
| `SendDeclarationService.ts`, `BeBoundService.ts`, `RestApiService.ts` | `updateStatusDb`/`getAllValidAct` from the new store; the ObjectId round-trips and the `@realm/react` imports are gone |
| `exportService.ts` | copies the Realm file through the migrator's read-only handle (Realm 12 caches by path — asking for read-write as well would throw) and skips it once a device has none |
| `SdkJs.java` | the native export copies **both** SQLite databases; the corpus would otherwise miss the declarations |
| `package.json` | `@op-engineering/op-sqlite` 14.1.0 (pinned — it is patched), `op-sqlite.sqlcipher: true`, `sql.js` as a dev dependency, `__tests__/support` excluded from Jest |
| `android/app/build.gradle` | excludes op-sqlite's two unreachable prebuilt libraries (see above) |

### The op-sqlite patch

`patches/@op-engineering+op-sqlite+14.1.0.patch` adds two lines to its
`CMakeLists.txt`:

```cmake
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
```

op-sqlite's C++ uses `std::variant` but sets no standard, so it inherits the
compiler default. NDK 25's clang 14 defaults to `gnu++14` and the build fails
with *no template named 'variant' in namespace 'std'*. RN 0.76+ projects get 17
from the `ReactAndroid` imported targets; on RN 0.75 nothing supplies it. No
version of op-sqlite from 14 to 18 sets it, so this is not fixed by upgrading —
and 18 wants AGP 8.7.2 against our 8.5.0. Patching is the smaller change than
moving the whole project's NDK, which would also force a Realm rebuild.

## Why op-sqlite 14.1.0

| Considered | Outcome |
|---|---|
| 18.2.5 (latest) | buildscript pins AGP 8.7.2 (project is on 8.5.0); codegen TurboModule |
| 15–16 | same C++ standard gap, newer AGP expectations |
| **14.1.0** | branches on `ReactAndroid_VERSION_MINOR >= 76`, so it supports the legacy architecture; AGP 7.3.1 classpath; SQLCipher via `package.json`; last of the 14 line (June 2025) |

## Not done in this phase (and why)

| Item | Why |
|---|---|
| Reference data and users onto `crsen.db` | The plan's step 85 puts `react-native-sqlite-storage`'s removal in the *follow-up* release, not the bridge. That data is re-downloadable; the declarations are not, and mixing both migrations in one release would make a failure impossible to attribute. |
| Removing `realm` / `@realm/react` / `realmSchema/` | Same reason: the bridge must still be able to migrate a device that has not yet run it. |
| Renaming the Realm file to `.migrated` | See above — needs a native file API, and not renaming is what keeps a rollback clean. |
| Canary rollout | An operations step: dev → qua → preprod → one low-volume office for 1–2 weeks → everyone (rule 7). |

## If the migration cannot run

`initDeclarationStore()` throws (a corrupt Realm file, a wrong key, a full disk)
→ App.tsx catches it, shows the loading-problem alert and never sets `key`, so
the navigator never mounts: a white screen with an error. That is deliberate.
The alternative — carrying on with an empty SQLite store — would show an
operator an empty Dashboard, and an operator looking at an empty Dashboard
re-enters declarations that already exist. For a national registry, failing
visibly beats appearing to have lost the data. The flag stays unset, so fixing
the cause and relaunching migrates normally.

## Open points carried forward

- **The migration has only been proven on 18 declarations.** Before the canary,
  run it against the Phase 0 corpus and a device with a realistic row count; the
  copy is a single transaction, so its cost grows linearly and 752 ms for 18
  rows says little about 2 000.
- `dbSenegal.db` is still unencrypted (its header is readable). Folding it into
  `crsen.db` in the follow-up fixes that as a side effect; worth stating
  explicitly when that release is planned.
- The Dashboard re-queries on every write (`declarations.subscribe`). That is
  cheap at these row counts and simpler than a diffing layer, but if a future
  screen writes in a loop it will re-query per write.
- Dev-only warnings unchanged from Phase 11: `defaultProps`,
  `SerializableStateInvariantMiddleware took …`, RadioButtonGroup `onPress`,
  react-navigation's non-serializable params notice.
