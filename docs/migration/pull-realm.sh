#!/bin/bash
# Archive a device's Realm file before anything else touches it.
#
#   docs/migration/pull-realm.sh [package] [output-dir]
#
# Defaults: com.crseneagalmobile.dev, docs/migration/archive/<serial>-<timestamp>/
#
# Run this BEFORE installing a Realm-free build on any device that might not
# have migrated, and before deleting a Realm file from one that has. The copy
# is the only way back if a migration is later found to have lost something.
#
# THE FILE IS ENCRYPTED. Realm is opened with the same key SQLCipher uses
# (AsyncStorage "keyDb", written by SdkJs.getRealmConfig). A pulled file is not
# readable without that key and the Realm SDK - it is an archive, not a dataset.
# Treat it as live civil-registry data: it holds real declarations.
#
# Needs a debuggable build (run-as). A release build refuses, and there is no
# way to reach app-private storage without root.

export PATH="$PATH:${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools"
adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }
PKG="${1:-com.crseneagalmobile.dev}"

cd "$(dirname "$0")/../.."
if ! adb devices | grep -qE "device$"; then echo "no device attached"; exit 2; fi
SERIAL=$(adb devices | awk '/device$/{print $1; exit}')
STAMP=$(date +%Y%m%dT%H%M%S)
OUT="${2:-docs/migration/archive/$SERIAL-$STAMP}"
mkdir -p "$OUT"

echo "== source"
LS=$(adbx shell run-as "$PKG" ls -la files/ 2>&1)
if echo "$LS" | grep -q "run-as: "; then
  echo "  cannot read app-private storage: $PKG is not debuggable on this device."
  echo "  A release build cannot be archived this way."
  exit 2
fi
FILES=$(echo "$LS" | awk '{print $NF}' | grep -E "\.realm$|\.realm\.lock$" || true)
if [ -z "$FILES" ]; then echo "  no Realm file in files/ - nothing to archive"; exit 0; fi
echo "$FILES" | sed 's/^/    /'

echo "== copying"
# `adb exec-out` streams raw bytes to the host. Do NOT use `adb shell` here: it
# is a pty and mangles binary, and staging via `adb shell "run-as cat > /sdcard"`
# writes 0-byte files while still exiting 0 - it looks like it worked.
mkdir -p "$OUT/files"
for f in $FILES; do
  adbx exec-out run-as "$PKG" cat "files/$f" > "$OUT/files/$f" 2>/dev/null
done

# Verify against the on-device sizes rather than trusting the copy.
COPY_OK=1
for f in $FILES; do
  want=$(echo "$LS" | awk -v n="$f" '$NF==n{print $5}')
  got=$(stat -c %s "$OUT/files/$f" 2>/dev/null || echo 0)
  if [ "${want:-0}" = "$got" ] && [ "$got" != "0" ]; then
    printf '    %-32s %s bytes\n' "$f" "$got"
  else
    printf '    %-32s MISMATCH: device=%s copied=%s\n' "$f" "${want:-?}" "$got"
    COPY_OK=0
  fi
done
if [ "$COPY_OK" != 1 ]; then
  echo
  echo "  ARCHIVE INCOMPLETE - do not rely on it. Nothing on the device was changed."
  exit 3
fi

echo "== manifest"
{
  echo "package=$PKG"
  echo "serial=$SERIAL"
  echo "model=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')"
  echo "android=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')"
  echo "versionName=$(adb shell dumpsys package "$PKG" 2>/dev/null | grep -m1 versionName | tr -d '\r' | sed 's/.*=//')"
  echo "pulledAt=$(date -Iseconds)"
  echo "encrypted=yes (AsyncStorage keyDb; same key as SQLCipher)"
  for f in "$OUT/files"/*; do
    [ -f "$f" ] || continue
    echo "file=$(basename "$f") bytes=$(stat -c %s "$f") sha256=$(sha256sum "$f" | cut -d' ' -f1)"
  done
} > "$OUT/manifest.txt"
cat "$OUT/manifest.txt" | sed 's/^/    /'

echo
echo "archived to $OUT"
echo "Keep it somewhere backed up. It is encrypted, but it is still real declaration data."
