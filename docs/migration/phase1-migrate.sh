#!/bin/bash
# PHASE 1 of 2 — copy declarations out of Realm and into SQLite.
#
#   docs/migration/phase1-migrate.sh <bridge.apk> [package]
#
# The bridge APK is a build that still has Realm AND has the SQLite store:
# Phase 12 of the upgrade plan (commit 9987f24). It is the only build that can
# perform the copy — every later build has Realm removed entirely and cannot
# read the file at all.
#
# What this does:
#   1. reads the device's current state and refuses if it is already done
#   2. archives the Realm file (pull-realm.sh) BEFORE touching anything
#   3. installs the bridge APK with -r, never uninstalling
#   4. launches it once, which runs the copy
#   5. verifies the result and prints the per-type/status counts
#
# Exit 0 only when the device ends up MIGRATED.
#
# Nothing here deletes the Realm file. Phase 2 does that, after it has proved
# the new build works.

set -u
cd "$(dirname "$0")/../.."
# Overridable so the gate logic can be tested against stubbed states.
HERE="${MIGRATION_DIR:-docs/migration}"
export PATH="$PATH:${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools"

APK="${1:-}"
PKG="${2:-com.crseneagalmobile.dev}"
if [ -z "$APK" ]; then
  sed -n '2,20p' "$0" | sed 's/^# \?//'
  exit 2
fi
if [ ! -f "$APK" ]; then echo "no such APK: $APK"; exit 2; fi

echo "###############################################"
echo "# PHASE 1 of 2 - Realm -> SQLite"
echo "# apk: $APK"
echo "# pkg: $PKG"
echo "###############################################"

echo
echo ">>> step 1/5  current state"
# Capture, then print: piping through `tee /dev/stderr` interleaves the two
# streams and garbles the report mid-line.
OUT=$("$HERE/migration-status.sh" "$PKG")
echo "$OUT"
STATE=$(echo "$OUT" | grep -oE "^STATE=.*" | cut -d= -f2)
case "$STATE" in
  MIGRATED)
    echo
    echo "Already migrated. Phase 1 has nothing to do on this device."
    echo "Go straight to phase2-cutover.sh."
    exit 0 ;;
  CLEAN)
    echo
    echo "No Realm data ever existed here. Phase 1 has nothing to copy."
    echo "Go straight to phase2-cutover.sh."
    exit 0 ;;
  PRE_MIGRATION|AT_RISK)
    echo
    echo "State $STATE - proceeding with phase 1." ;;
  *)
    echo
    echo "State $STATE. Refusing to guess: fix the device or the connection first."
    exit 2 ;;
esac

echo
echo ">>> step 2/5  archive the Realm file first"
if ! "$HERE/pull-realm.sh" "$PKG"; then
  echo
  echo "ARCHIVE FAILED. Stopping before installing anything."
  echo "Never run the copy without a backup of the source data."
  exit 1
fi

echo
echo ">>> step 3/5  install the bridge build"
# -r upgrades in place. Uninstalling would delete /data/data/<pkg>/files, which
# is exactly where the Realm file lives.
INST=$(adb install -r "$APK" 2>&1)
echo "$INST" | sed 's/^/    /'
if ! echo "$INST" | grep -q Success; then echo "install failed"; exit 1; fi

echo
echo ">>> step 4/5  launch once to run the copy"
adb logcat -c
adb shell am force-stop "$PKG" >/dev/null 2>&1
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
for i in $(seq 1 30); do
  sleep 3
  adb logcat -d 2>/dev/null | grep -qE "initDeclarationStore: (migrated|already-done|no-realm-file)" && break
done
adb logcat -d 2>/dev/null | grep -oE "migrateFromRealm: .*" | sed 's/^/    /' | tail -5

echo
echo ">>> step 5/5  verify"
OUT=$("$HERE/migration-status.sh" "$PKG")
echo "$OUT"
FINAL=$(echo "$OUT" | grep -oE "^STATE=.*" | cut -d= -f2)

echo
if [ "$FINAL" = MIGRATED ] || [ "$FINAL" = CLEAN ]; then
  echo "PHASE 1 COMPLETE ($FINAL)."
  echo "Check the copied count above against the office's expected total."
  echo "Then, and only then, run: $HERE/phase2-cutover.sh <realm-free.apk> $PKG"
  exit 0
fi
echo "PHASE 1 DID NOT COMPLETE (state $FINAL)."
echo "The Realm file is untouched and the archive is in $HERE/archive/."
echo "Do NOT install a Realm-free build on this device."
exit 1
