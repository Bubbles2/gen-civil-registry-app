#!/bin/bash
# Which of the two migration phases is this device in?
#
#   docs/migration/migration-status.sh [package]
#
# Default package is com.crseneagalmobile.dev. Other flavours suffix the base id:
# com.crseneagalmobile.test (qua), .preprod, .prod.
#
# Prints a human report and one machine-readable line, "STATE=<token>", which
# phase1-migrate.sh and phase2-cutover.sh consume.
#
#   STATE=PRE_MIGRATION   Realm data, no SQLite store yet -> needs phase 1
#   STATE=MIGRATED        copy done and verified          -> ready for phase 2
#   STATE=CLEAN           never had Realm data            -> nothing to do
#   STATE=AT_RISK         Realm data stranded on a Realm-free build
#   STATE=UNKNOWN         could not determine
#
# Exit codes: 0 MIGRATED or CLEAN, 1 PRE_MIGRATION, 2 UNKNOWN, 3 AT_RISK.
#
# Restarts the app: the migration state is only reported at launch.

export PATH="$PATH:${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools"
adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }
PKG="${1:-com.crseneagalmobile.dev}"

say(){ printf '%s\n' "$1"; }
hdr(){ printf '\n== %s\n' "$1"; }
finish(){ printf '\nSTATE=%s\n' "$1"; exit "$2"; }

hdr "device"
if ! adb devices | grep -qE "device$"; then
  say "  no device attached"; finish UNKNOWN 2
fi
SERIAL=$(adb devices | awk '/device$/{print $1; exit}')
say "  $SERIAL  ($(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r'), Android $(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r'))"

hdr "app"
VER=$(adb shell dumpsys package "$PKG" 2>/dev/null | grep -m1 versionName | tr -d '\r' | sed 's/.*=//')
if [ -z "$VER" ]; then say "  $PKG is not installed"; finish UNKNOWN 2; fi
say "  $PKG  versionName=$VER"

hdr "on-device data"
# run-as only works on a debuggable build. A release build refuses and app-private
# storage is unreachable without root, so the launch log is the only evidence.
FILES_LS=$(adbx shell run-as "$PKG" ls -la files/ 2>&1)
DB_LS=$(adbx shell run-as "$PKG" ls -la databases/ 2>&1)
REALM=unknown; STORE=unknown
if echo "$FILES_LS" | grep -q "run-as: "; then
  say "  app-private storage unreadable (not a debuggable build)"
else
  if echo "$FILES_LS" | grep -q "default\.realm"; then
    REALM=present
    say "  Realm      files/default.realm  $(echo "$FILES_LS" | awk '/ default\.realm$/{print $5}') bytes"
  else
    REALM=absent
    say "  Realm      none"
  fi
  # crsen.db only exists once a build that has the SQLite store has run.
  if echo "$DB_LS" | grep -q "crsen\.db"; then
    STORE=present
    say "  SQLite     databases/crsen.db   $(echo "$DB_LS" | awk '/ crsen\.db$/{print $5}') bytes"
  else
    STORE=absent
    say "  SQLite     none (this build has never opened crsen.db)"
  fi
fi

hdr "launch"
adb logcat -c
adb shell am force-stop "$PKG" >/dev/null 2>&1
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
LINE=""
for i in $(seq 1 25); do
  sleep 3
  # Phase 2 build: "already-migrated" | "fresh"
  # Phase 1 bridge build: "migrated" | "already-done" | "no-realm-file"
  # Matching stops at the closing paren: Logger colours its output, and matching
  # to end-of-line drags a trailing ANSI reset into the text.
  LINE=$(adb logcat -d 2>/dev/null | grep -oE "initDeclarationStore: [a-z-]+ \([^)]*\)" | tail -1)
  [ -n "$LINE" ] && break
done

if [ -z "$LINE" ]; then
  say "  no initDeclarationStore line after 75s"
  if adb logcat -d 2>/dev/null | grep -q "packager does not seem to be running"; then
    say ""
    say "  CAUSE: debug build with no Metro, so the JS never ran and nothing"
    say "  reported. Start Metro and re-run:  npx react-native start --port 3000"
    say "  (A debug APK also needs -PreactNativeDevServerPort=3000 baked in.)"
    finish UNKNOWN 2
  fi
  # No bootstrap line, but a Realm file and no store: a pre-phase-1 build, which
  # simply has no such code in it. That is a real state, not a failure.
  if [ "$REALM" = present ] && [ "$STORE" = absent ]; then
    say ""
    say "  This build has no declaration store at all and a Realm file is present:"
    say "  it predates phase 1. That is expected, not a fault."
    hdr "verdict"
    say "  PRE-MIGRATION. Run phase1-migrate.sh with the bridge APK."
    finish PRE_MIGRATION 1
  fi
  say "  Either the app failed to start, or logging is off in this build."
  finish UNKNOWN 2
fi
say "  $LINE"
OUTCOME=$(echo "$LINE" | sed 's/initDeclarationStore: \([a-z-]*\).*/\1/')
COPIED=$(adb logcat -d 2>/dev/null | grep -oE "migrateFromRealm: migrated [0-9]+ declarations \{[^}]*\}" | tail -1)
[ -n "$COPIED" ] && say "  $COPIED"

hdr "verdict"
case "$OUTCOME" in
  migrated)
    say "  MIGRATED JUST NOW by the bridge build."
    say "  Check the count above against the office's expected total before phase 2."
    finish MIGRATED 0 ;;
  already-migrated|already-done)
    if [ "$REALM" = present ]; then
      say "  MIGRATED. The Realm file is still on the device, untouched and unused."
      say "  Phase 2 can proceed; the file can be dropped after it succeeds."
    else
      say "  MIGRATED, and the Realm file is already gone. Phase 2 complete."
    fi
    finish MIGRATED 0 ;;
  no-realm-file)
    say "  CLEAN. There was never any Realm data on this device."
    finish CLEAN 0 ;;
  fresh)
    if [ "$REALM" = present ]; then
      say "  *** AT RISK ***"
      say "  A Realm file is present but the store initialised empty: this device"
      say "  is on a phase 2 (Realm-free) build that never ran phase 1. Its"
      say "  declarations are stranded - still in default.realm, unreadable here."
      say ""
      say "  Recover, in order:"
      say "    1. docs/migration/pull-realm.sh          archive it now"
      say "    2. docs/migration/phase1-migrate.sh <bridge.apk>"
      say "    3. docs/migration/phase2-cutover.sh <realm-free.apk>"
      finish AT_RISK 3
    fi
    if [ "$REALM" = unknown ]; then
      say "  Store is empty, but the Realm file could not be checked (release build)."
      say "  Cannot tell a clean install from stranded data. Treat as UNKNOWN."
      finish UNKNOWN 2
    fi
    say "  CLEAN. Empty store and no Realm file: nothing was ever there."
    finish CLEAN 0 ;;
  *)
    say "  Unrecognised outcome '$OUTCOME'"
    finish UNKNOWN 2 ;;
esac
