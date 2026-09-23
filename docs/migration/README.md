# Migrating declarations from Realm to SQLite

**This is a two-phase migration, and the order is not optional.**

| | Build | Realm | SQLite | What happens |
|---|---|---|---|---|
| **Phase 1** | the *bridge* build (Phase 12, commit `9987f24`) | read-only | read/write | **copies Realm → SQLite on first launch**, verifies counts, sets a flag |
| **Phase 2** | the *Realm-free* build (Phase 13 onward) | **removed entirely** | read/write | the shipping app. Cannot read a Realm file at all |

Phase 2 is the end state: **Realm does not exist in the final app** — not the
dependency, not the native library, not the schema files. That is the point of
the exercise. Phase 1 exists solely to get the data out before that happens.

For the field-by-field schema mapping see
[`../realm-sqlite-mapping.md`](../realm-sqlite-mapping.md). This document is the
operational side: rollout, verification and recovery.

---

## Why two phases and not one

**Realm cannot run in the final app.** Its native module reaches the JS runtime
through `reactContext.getCatalystInstance()`, and there is no CatalystInstance
under the New Architecture. It is not a shim that could be written — it is why
Realm had to be removed before the architecture could change.

**And there is no offline conversion tool.** One cannot reasonably be written:

- the Realm file is **encrypted**, with the key `SdkJs.getRealmConfig()` writes to
  AsyncStorage under `keyDb`;
- the SQLite store `crsen.db` is **SQLCipher-encrypted with the same key**;
- both keys live on the device.

So the only thing that can read Realm and write SQLite is a build containing
both — and that build must be installed *before* the Realm-free one. Hence two
phases.

### What happens if you skip phase 1

The Realm file survives untouched, and **nothing in the phase 2 build can read
it**. The Dashboard is simply empty. The declarations are not lost, but they are
stranded until a bridge build is reinstalled.

`phase2-cutover.sh` refuses to install for exactly this reason. That refusal is
the most important thing in this folder.

---

## Running it

### Phase 1 — migrate

```bash
docs/migration/phase1-migrate.sh <bridge.apk> [package]
```

1. reads the device state, and exits early if it is already done
2. **archives the Realm file before touching anything**
3. installs the bridge APK with `-r` (never uninstalling)
4. launches it once, which runs the copy
5. verifies and prints the per-type/status counts

Exits `0` only when the device ends up `MIGRATED`. It never deletes the Realm
file.

### Phase 2 — cut over to the Realm-free build

```bash
docs/migration/phase2-cutover.sh <realm-free.apk> [package] [--drop-realm]
```

1. **GATE** — refuses unless the device is already `MIGRATED` or `CLEAN`
2. archives the Realm file one last time
3. installs the Realm-free APK with `-r`
4. relaunches and verifies the store still reports migrated
5. with `--drop-realm`, *and only after all of the above passed*, deletes the
   now-unused Realm file

Without `--drop-realm` the Realm file is left in place. That is the safe default:
it costs only disk, and it is the last copy on the device.

### Checking a device at any time

```bash
docs/migration/migration-status.sh [package]
```

Prints a report plus a machine-readable `STATE=<token>` line, which the two phase
scripts consume.

| STATE | Meaning | Exit | Next |
|---|---|---|---|
| `PRE_MIGRATION` | Realm data, no SQLite store yet | 1 | phase 1 |
| `MIGRATED` | copy done and counts verified | 0 | phase 2 |
| `CLEAN` | never had Realm data | 0 | phase 2 |
| `AT_RISK` | **stranded** — Realm data on a Realm-free build | 3 | recover, below |
| `UNKNOWN` | could not determine | 2 | investigate |

Default package is `com.crseneagalmobile.dev`. Every flavour suffixes the base id
`com.crseneagalmobile`:

| Flavour | Package |
|---|---|
| dev | `com.crseneagalmobile.dev` |
| qua | `com.crseneagalmobile.test` |
| preprod | `com.crseneagalmobile.preprod` |
| prod | `com.crseneagalmobile.prod` |

---

## What phase 1 actually does to the data

From `src/core/db/migrateFromRealm.ts` as it existed in Phase 12 — removed in
Phase 13, so read it with `git show 9987f24:src/core/db/migrateFromRealm.ts`:

1. **Nothing happens at all once `realm_migration_done` is set.**
2. **The Realm file is opened read-only** and is never written, renamed or
   deleted. Rolling back restores the old behaviour exactly, because the file is
   untouched byte for byte.
3. **Every object is copied in a single SQLite transaction.** A crash halfway
   leaves an empty table and the flag unset, so the next launch starts again from
   the untouched Realm file.
4. **Counts are verified per type and status *before* the flag is set.** A
   mismatch throws inside the transaction, rolling it back and leaving the app on
   Realm.

The copy is deliberately close to an identity transform:
`JSON.parse(JSON.stringify(realmObject))` is the same conversion the send path
already used, so it preserves the schema's property order. The less reshaping a
migration does to live civil-registry data, the less it can silently lose.

### The flags, in the `meta` table of `crsen.db`

| Key | Meaning |
|---|---|
| `realm_migration_done` | `"1"` once the copy completed **and the counts matched** |
| `realm_migration_at` | ISO timestamp of completion |
| `realm_migration_count` | how many declarations were copied |

`realm_migration_done` is what is reported at login, and is the evidence an office
has migrated.

---

## Where the data lives on a device

| Path | What |
|---|---|
| `files/default.realm` | the Realm file. Encrypted. Realm's config sets no `path`, so this is the default name |
| `files/default.realm.lock`, `.management/`, `.note` | Realm's siblings |
| `files/default.v23.backup.realm` | a Realm schema-upgrade backup, if one happened |
| `databases/crsen.db` | the SQLCipher declaration store |
| `databases/dbSenegal.db` | reference data, unencrypted, not part of this migration |
| `databases/RKStorage` | AsyncStorage, where `keyDb` lives |

The presence of `crsen.db` is how `migration-status.sh` tells a genuine
pre-migration build (no store at all) from a stranded one (store present but
empty).

---

## Recovering a stranded device

If the status is **AT_RISK**:

1. **Archive immediately**:
   ```bash
   docs/migration/pull-realm.sh
   ```
2. **Run phase 1** with the bridge APK.
3. **Re-check** — it should report `MIGRATED` with a count.
4. **Then run phase 2** again.

> **Never uninstall the app to "start clean" on a device that has not migrated.**
> Uninstalling deletes `/data/data/<pkg>/files/`, and the declarations go with it.
> `adb install -r` upgrades in place and preserves it. Both phase scripts use
> `-r` and never uninstall.

---

## Archives

`pull-realm.sh` writes to `docs/migration/archive/<serial>-<timestamp>/` with a
manifest recording sizes, SHA-256s, serial and app version. It verifies each
copied file against the on-device size and **fails loudly rather than leaving a
short file**.

That directory is **gitignored**. The archives are encrypted, but they are real
civil-registry declarations — keep them somewhere backed up and access-controlled,
and do not commit them.

Reading one back needs the key *and* the Realm SDK. Neither the SQLCipher CLI nor
`pysqlcipher3` is installed on the current dev machine and the stdlib `sqlite3`
cannot open a SQLCipher database, so there is no ready-made path — which is
exactly why the on-device migration is the supported route. If you genuinely need
to, the key is in AsyncStorage under `keyDb`, and Realm Studio wants its byte form
(the app converts the stored string with `Encodeuint8arr`). Appendix D recorded
that this key is a committed literal; that is a known, separate problem — do not
make it worse by copying the key into scripts, tickets or this repository.

---

## Two operational limits

**Reading on-device files needs a debuggable build.** `run-as` refuses on a
release build and app-private storage is unreachable without root. On a release
build the scripts fall back to the launch log, which distinguishes migrated from
not — but cannot tell `CLEAN` from `AT_RISK`, because both report an empty store.
`migration-status.sh` returns `UNKNOWN` there rather than guessing, and
`phase2-cutover.sh` refuses on `UNKNOWN`.

**On a debug build, Metro must be running**, or the JS never executes and nothing
is reported. The scripts detect this specific case and say so, because it
otherwise looks like a native failure and is not.

---

## Files

| Path | What it is |
|---|---|
| `phase1-migrate.sh` | phase 1: archive, install bridge build, copy, verify |
| `phase2-cutover.sh` | phase 2: gate, archive, install Realm-free build, verify, optionally drop the Realm file |
| `migration-status.sh` | what state is this device in? Emits `STATE=<token>` |
| `pull-realm.sh` | archive a device's Realm file with checksums |
| `archive/` | pulled archives (gitignored — real data) |
| `../realm-sqlite-mapping.md` | the field-by-field schema mapping |
| `../upgrade/phase12-sqlite-store.md` | why the store is shaped the way it is |
| `../upgrade/phase13-new-architecture.md` | why Realm had to be removed |
