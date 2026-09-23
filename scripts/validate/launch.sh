#!/bin/bash
# Bring up everything V6 needs, skipping whatever is already running:
#   emulator (Pixel_5_Save) -> Metro on :3000 -> build+install+launch the dev flavour.
#   scripts/validate/launch.sh [--no-build]     --no-build: only launch the installed app
# Run from Git Bash at the repo root. Exit non-zero if a step fails.
cd "$(dirname "$0")/../.."
# MSYS_NO_PATHCONV only around adb: it keeps /sdcard paths intact but would break curl -o /dev/null.
adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }
metro_up(){ curl -s --max-time 3 -o /dev/null http://localhost:3000/status; }
OUT=scripts/validate/out; mkdir -p "$OUT"
AVD=Pixel_5_Save; PKG=com.crseneagalmobile.dev
SDK="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"

echo "== emulator"
if adb devices | grep -q "emulator-.*device$"; then echo "   already running"; else
  "$SDK/emulator/emulator.exe" @$AVD -no-snapshot-load >"$OUT/emulator.log" 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
  echo "   booted"; sleep 5
fi

echo "== Metro :3000"
if metro_up; then echo "   already running"; else
  # Metro's watcher locks android/.gradle; it must not be running while gradlew builds.
  START_METRO_AFTER_BUILD=1
fi

if [ "${1:-}" != "--no-build" ]; then
  echo "== build + install dev flavour (gradlew, JDK from JAVA_HOME=${JAVA_HOME:-unset})"
  if metro_up; then npx kill-port 3000 >/dev/null 2>&1; START_METRO_AFTER_BUILD=1; fi
  ( cd android && ./gradlew :app:installDevDebug -q ) >"$OUT/gradle.log" 2>&1; BUILD_RC=$?
  [ $BUILD_RC -eq 0 ] && echo "   installed" || { echo "   FAILED - see $OUT/gradle.log"; grep -E "What went wrong" -A2 "$OUT/gradle.log"; }
fi

if [ "${START_METRO_AFTER_BUILD:-}" = 1 ]; then
  nohup npx react-native start --port 3000 --experimental-debugger >"$OUT/metro.log" 2>&1 &
  until metro_up; do sleep 2; done
  echo "   Metro ready"
fi
[ "${BUILD_RC:-0}" -ne 0 ] && exit 1

echo "== launch app"
adb shell am force-stop $PKG
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 8
UI=scripts/validate/ui.sh
# First launch shows an "application prête" dialog before the login screen.
if $UI texts | grep -q "est maintenant pr"; then $UI tap "Ok" >/dev/null; sleep 3; fi
if $UI texts | grep -q '"CONNEXION"'; then echo "   login screen up"; else echo "   app launched (login screen not detected yet - check the emulator)"; fi
