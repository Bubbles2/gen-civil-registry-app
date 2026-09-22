#!/bin/bash
# V1 (bundle size), V2 (tsc ratchet), V3 (Jest) from docs/upgrade/phase0-baseline.md.
# Usage: scripts/validate/static-checks.sh        (run from Git Bash at the repo root)
# Exit code is non-zero if any check regresses against the baselines below.
set -u
cd "$(dirname "$0")/../.."
OUT=scripts/validate/out; mkdir -p "$OUT"
TSC_BASELINE=482                 # Phase 11 baseline (TypeScript 5.9.3; Phase 10 was 513 on TS 5.0.4); update when a phase deliberately changes it
BUNDLE_BASELINE=5358354          # bytes, 2026-09-22 Phase 11 (was 5 254 595; +104 kB, almost all react-native-paper 5)
fail=0

echo "== V1 release JS bundle"
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output "$OUT/bundle.js" >"$OUT/bundle.log" 2>&1
size=$(stat -c %s "$OUT/bundle.js" 2>/dev/null || echo 0)
lo=$(( BUNDLE_BASELINE * 80 / 100 )); hi=$(( BUNDLE_BASELINE * 120 / 100 ))
if [ "$size" -ge "$lo" ] && [ "$size" -le "$hi" ]; then echo "   PASS  $size B (baseline $BUNDLE_BASELINE, ±20 %)"; else echo "   FAIL  $size B outside $lo..$hi"; fail=1; fi

echo "== V2 tsc ratchet"
n=$(npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS")
if [ "$n" -le "$TSC_BASELINE" ]; then echo "   PASS  $n errors (baseline $TSC_BASELINE)"; else echo "   FAIL  $n errors > baseline $TSC_BASELINE"; fail=1; fi

echo "== V3 Jest"
if npx jest --ci >"$OUT/jest.log" 2>&1; then grep -E "^(Tests|Test Suites):" "$OUT/jest.log" | sed 's/^/   /'; else echo "   FAIL  see $OUT/jest.log"; tail -30 "$OUT/jest.log"; fail=1; fi

echo "== Gradle preflight (V4/V5 need this)"
# Selector.open() is what gradlew needs and what fails here. Since JDK 16 the
# selector's wakeup pipe is an AF_UNIX socket whose directory comes from the
# TEMP environment variable, and on this machine AF_UNIX connect() returns
# "Invalid argument" for any socket under the user profile - so a plain
# `gradlew` from a shell with the default TEMP dies with "Unable to establish
# loopback connection". It is NOT the Fortinet VPN (an earlier phase recorded
# that; it is wrong, and it cost Phase 11 its first V4/V5 attempt).
# scripts/build.ps1 already sets TEMP=C:\Temp for every JVM it spawns, which is
# why building through it works. Test both so the message says which it is.
cat > "$OUT/Lb.java" <<'JAVA'
public class Lb { public static void main(String[] a) { try { java.nio.channels.Selector.open().close(); System.out.println("ok"); } catch (Exception e) { System.out.println("FAIL " + e); } } }
JAVA
J="${JAVA_HOME:-C:/Program Files/Amazon Corretto/jdk21.0.6_7}"
r=$("$J/bin/java" "$OUT/Lb.java" 2>&1 | head -1)
if [ "$r" = "ok" ]; then
  echo "   Selector.open OK with this TEMP - plain gradlew can run"
else
  mkdir -p /c/Temp
  r2=$(TEMP='C:\Temp' TMP='C:\Temp' "$J/bin/java" "$OUT/Lb.java" 2>&1 | head -1)
  if [ "$r2" = "ok" ]; then
    echo "   Selector.open fails with TEMP=$TEMP, OK with TEMP=C:\\Temp (AF_UNIX pipe dir)."
    echo "   Build through scripts/build.ps1 (it sets TEMP itself), or prefix: TEMP='C:\\Temp' TMP='C:\\Temp' ./gradlew ..."
  else
    echo "   BLOCKED: Selector.open fails even with TEMP=C:\\Temp ($r2)."
    echo "   Check AF_UNIX: bind succeeds but connect returns 'Invalid argument' when something blocks it."
  fi
fi

exit $fail
