#!/bin/bash
# PHASE 2 of 2 — move to the Realm-free build.
#
#   docs/migration/phase2-cutover.sh <realm-free.apk> [package] [--drop-realm]
#
# The Realm-free APK is any build from Phase 13 onward. Realm is gone from it
# entirely: it cannot read default.realm, and it never tries.
#
# THE GATE. This script REFUSES to install unless the device is already
# MIGRATED. That refusal is the whole point of the script. Installing a
# Realm-free build on a device that has not migrated strands its declarations:
# the Realm file survives untouched but nothing in that build can read it, and
# the Dashboard is simply empty.
#
# What this does:
#   1. gates on the device state - MIGRATED or CLEAN only
#   2. archives the Realm file one last time, if one is still there
#   3. installs the Realm-free APK with -r
#   4. relaunches and verifies the store still reports migrated
#   5. with --drop-realm, and only after all of the above passed, deletes the
#      now-unused Realm file to reclaim the space
#
# Without --drop-realm the Realm file is left alone. That is the safe default:
# it costs only disk, and it is the last copy on the device.

set -u
cd "$(dirname "$0")/../.."
# Overridable so the gate logic can be tested against stubbed states.
HERE="${MIGRATION_DIR:-docs/migration}"
export PATH="$PATH:${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools"
adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }

APK=""; PKG="com.crseneagalmobile.dev"; DROP=0; POS=0
for a in "$@"; do
  case "$a" in
    --drop-realm) DROP=1 ;;
    -*) echo "unknown option $a"; exit 2 ;;
    *) POS=$((POS+1)); [ $POS = 1 ] && APK="$a" || PKG="$a" ;;
  esac
done
if [ -z "$APK" ]; then sed -n '2,25p' "$0" | sed 's/^# \?//'; exit 2; fi
if [ ! -f "$APK" ]; then echo "no such APK: $APK"; exit 2; fi

echo "###############################################"
echo "# PHASE 2 of 2 - cut over to the Realm-free build"
echo "# apk:  $APK"
echo "# pkg:  $PKG"
echo "# drop: $([ $DROP = 1 ] && echo 'yes - Realm file will be deleted' || echo 'no - Realm file kept')"
echo "###############################################"

echo
echo ">>> step 1/5  GATE: has phase 1 completed?"
OUT=$("$HERE/migration-status.sh" "$PKG")
echo "$OUT"
STATE=$(echo "$OUT" | grep -oE "^STATE=.*" | cut -d= -f2)
case "$STATE" in
  MIGRATED|CLEAN)
    echo
    echo "Gate passed ($STATE)." ;;
  PRE_MIGRATION|AT_RISK)
    echo
    echo "*** REFUSING TO INSTALL ***"
    echo
    echo "This device is $STATE: it still holds declarations that are not in the"
    echo "SQLite store. Installing a Realm-free build now would strand them - the"
    echo "file would survive untouched, but nothing in that build can read it."
    echo
    echo "Run phase 1 first:"
    echo "    $HERE/phase1-migrate.sh <bridge.apk> $PKG"
    exit 1 ;;
  *)
    echo
    echo "*** REFUSING TO INSTALL ***"
    echo "State is $STATE - the device's migration status could not be established."
    echo "Resolve that before cutting over. Refusing to guess with live data."
    exit 2 ;;
esac

echo
echo ">>> step 2/5  archive the Realm file one last time"
if "$HERE/pull-realm.sh" "$PKG"; then
  echo "    archived"
else
  rc=$?
  if [ $rc = 0 ]; then :; else
    # exit 0 with "nothing to archive" is fine; a real failure is not.
    echo
    echo "Archive step did not succeed (exit $rc)."
    if [ $DROP = 1 ]; then
      echo "Refusing to continue with --drop-realm and no fresh archive."
      exit 1
    fi
    echo "Continuing without --drop-realm: the Realm file stays on the device."
  fi
fi

echo
echo ">>> step 3/5  install the Realm-free build"
INST=$(adb install -r "$APK" 2>&1)
echo "$INST" | sed 's/^/    /'
if ! echo "$INST" | grep -q Success; then echo "install failed"; exit 1; fi

echo
echo ">>> step 4/5  verify the store still reports migrated"
OUT2=$("$HERE/migration-status.sh" "$PKG")
echo "$OUT2"
STATE2=$(echo "$OUT2" | grep -oE "^STATE=.*" | cut -d= -f2)
if [ "$STATE2" != MIGRATED ] && [ "$STATE2" != CLEAN ]; then
  echo
  echo "*** CUTOVER FAILED: state is now $STATE2 ***"
  echo "The Realm file has NOT been deleted. Roll back to the bridge build and"
  echo "investigate before going further. Archives are in $HERE/archive/."
  exit 1
fi
echo
echo "Verified: $STATE2"

echo
echo ">>> step 5/5  Realm file"
if [ $DROP != 1 ]; then
  echo "    kept (pass --drop-realm to delete it once you are satisfied)"
else
  # Only reached when: gate passed, fresh archive taken, new build verified.
  echo "    deleting files/default.realm* - archived copies are in $HERE/archive/"
  adbx shell run-as "$PKG" sh -c 'rm -rf files/default.realm files/default.realm.lock files/default.realm.management files/default.realm.note files/default.realm.backup-log files/default.v23.backup.realm' 2>&1 | sed 's/^/      /'
  LEFT=$(adbx shell run-as "$PKG" ls files/ 2>/dev/null | grep -c realm)
  if [ "${LEFT:-0}" = 0 ]; then echo "      removed"; else echo "      WARNING: $LEFT realm file(s) still present"; fi
fi

echo
echo "PHASE 2 COMPLETE. This device is on the Realm-free build."
exit 0
