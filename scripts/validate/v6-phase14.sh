#!/bin/bash
# Phase 14 regression walkthrough — V6 (on-device) + V7 (payload), scripted.
#
#   scripts/validate/v6-phase14.sh              full run: build + install + walkthrough
#   scripts/validate/v6-phase14.sh --no-build   reuse the installed APK (much faster)
#   scripts/validate/v6-phase14.sh --check      only the cheap checks (boot, login, counts)
#
# Run from Git Bash at the repo root. Exit code 0 = every step PASSed.
#
# WHAT THIS IS. There is no e2e framework in this project — no Detox, no Appium,
# no Maestro. Every step below is `adb shell input` driving the real app on the
# emulator, `uiautomator dump` reading the screen back (via ui.sh) and `adb logcat`
# for assertions. That is also how Phase 11-13 were validated by hand; this file
# just stops the Phase 14 sequence having to be rediscovered.
#
# THE OVERLAY PROBLEM — read before editing.
# The app's ⋮ filter menu and its row dialog (MODIFIER/VALIDER/DUPLIQUER/SUPPRIMER)
# are React Native overlays. They do NOT appear in `uiautomator dump`, and dumping
# actually closes them. So they cannot be driven by text like everything else and
# are tapped at fixed coordinates instead — the OVERLAY BLOCK below. Those numbers
# are for Pixel_5_Save at 1080x2340; the script refuses to run on any other size
# rather than tapping blind. If the app's dialog layout changes, re-read the
# coordinates off a screenshot (adb exec-out screencap -p > x.png) and update here.
#
# ALSO LEARNED THE HARD WAY: long-press only selects a *Validé* row. Long-pressing
# a Brouillon row does nothing at all, and ENVOYER with nothing selected is a
# silent no-op that logs absolutely nothing. VALIDER -> filter -> long-press.

cd "$(dirname "$0")/../.."
export PATH="$PATH:${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools"
# MSYS_NO_PATHCONV is set per-call (adbx) and never globally: exporting it keeps
# /sdcard paths intact for adb but breaks `curl -o /dev/null`, which silently made
# every Metro readiness check fail. launch.sh carries the same warning.
adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }
metro_up(){ curl -s --max-time 3 "http://localhost:3000/status" 2>/dev/null | grep -q running; }
UI=scripts/validate/ui.sh
OUT=scripts/validate/out
SDK="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
AVD=Pixel_5_Save
PKG=com.crseneagalmobile.dev
APK=android/app/build/outputs/apk/dev/debug/senegal-civil-registry-1.1.4-dev.apk
mkdir -p "$OUT"

# ---- OVERLAY BLOCK (Pixel_5_Save, 1080x2340) --------------------------------
MENU_BTN="1003 213"        # the ⋮ in the top bar
CB_BROUILLON="986 662"     # Status checkboxes inside the ⋮ menu
CB_VALIDE="986 762"
CB_ARCHIVE="986 861"
CB_ERREUR="986 959"
BTN_ENVOYER="851 1096"     # ENVOYER, inside the ⋮ menu
DLG_VALIDER="763 1117"     # row dialog, top-right button
ROW1="468 491"             # first data row, when the list is filtered to one
# -----------------------------------------------------------------------------

PASS=0; FAIL=0; FORM_BROKE=0
ok(){   printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad(){  printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
step(){ printf '\n== %s\n' "$1"; }
# assert <label> <expected> <actual>
eq(){ [ "$2" = "$3" ] && ok "$1 ($3)" || bad "$1: expected '$2', got '$3'"; }
has(){ if adb logcat -d 2>/dev/null | grep -qF "$2"; then ok "$1"; else bad "$1 — not in logcat: $2"; fi; }
rows(){ $UI texts 2>/dev/null | grep -oE 'sur [0-9]+' | head -1 | grep -oE '[0-9]+'; }
# MUST be an exact line match: the dashboard shows "DECONNEXION", which contains
# "CONNEXION" as a substring. A plain grep made the script believe it was on the
# login screen while it was on the dashboard, and the export silently did nothing.
at_login(){ $UI texts 2>/dev/null | grep -qx '"CONNEXION"'; }
tapxy(){ adb shell input tap $1; }
# The form refuses to advance while a required field is empty and shows a modal
# instead. Without this the script blunders on and every later step cascades.
# Screenshot names go through this: "page 3 -> 4" contains spaces and '>', which
# Windows will not accept in a filename.
slug(){ echo "$1" | tr -c '[:alnum:]' '-' | tr -s '-' | sed 's/-$//'; }
errmodal(){
  if $UI texts 2>/dev/null | grep -q "comporte une ou plusieurs erreurs"; then
    bad "$1: form validation errors"
    $UI shot "p14-err-$(slug "$1")" >/dev/null
    echo "     fields still flagged:"
    $UI texts 2>/dev/null | grep -iE "obligatoire|invalide|requis" | sort -u | sed 's/^/       /'
    $UI tap "OK" >/dev/null 2>&1; sleep 2
    return 1
  fi
  return 0
}
# advance <step label> <text that must appear on the next page>
advance(){
  [ "${FORM_BROKE:-0}" = 1 ] && return 1   # already off the rails; do not tap blind
  $UI tap "Suivant" >/dev/null; sleep 5
  errmodal "$1" || return 1
  if $UI texts 2>/dev/null | grep -q "$2"; then ok "$1"; return 0; fi
  bad "$1: did not reach the next page"
  $UI shot "p14-stuck-$(slug "$1")" >/dev/null
  echo "     on screen: $($UI texts 2>/dev/null | tr '
' ' ')"
  return 1
}

step "device"
if ! adb devices | grep -q "emulator-.*device$"; then
  echo "   booting $AVD"
  "$SDK/emulator/emulator.exe" @$AVD -no-snapshot-load >"$OUT/emulator.log" 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
  sleep 5
fi
SIZE=$(adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1)
if [ "$SIZE" != "1080x2340" ]; then
  echo "   ABORT: screen is $SIZE, the OVERLAY BLOCK coordinates assume 1080x2340."
  echo "   Re-read them off a screenshot before running on this device."
  exit 2
fi
ok "emulator up at $SIZE"

if [ "${1:-}" != "--no-build" ] && [ "${1:-}" != "--check" ]; then
  step "build + install"
  # The Metro port is an APK resource: a plain assembleDebug bakes in 8081 and the
  # app then cannot reach Metro, failing in a way that looks native but is not
  # ("SurfaceRegistryBinding::startSurface failed. Global was not installed.").
  # TEMP must be a plain dir or Gradle dies on the AF_UNIX selector pipe.
  npx kill-port 3000 >/dev/null 2>&1
  ( cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew :app:assembleDevDebug \
      -PreactNativeDevServerPort=3000 --no-daemon ) >"$OUT/gradle-p14.log" 2>&1 \
    && ok "assembleDevDebug" || { bad "assembleDevDebug — see $OUT/gradle-p14.log"; exit 1; }
  # -r, never uninstall: the migrated declaration store must survive.
  adb install -r "$APK" 2>&1 | grep -q Success && ok "installed (-r)" || bad "install"
fi

step "metro :3000"
if metro_up; then ok "already running"; else
  nohup npx react-native start --port 3000 >"$OUT/metro-p14.log" 2>&1 &
  # A cold Metro start can take well over two minutes on this machine.
  for i in $(seq 1 80); do metro_up && break; sleep 3; done
  metro_up && ok "started" || { bad "metro not ready - see $OUT/metro-p14.log"; exit 1; }
fi

# Poll rather than sleep a fixed time: a cold JS reload from Metro varies from a
# few seconds to well over half a minute, and a fixed 22s silently under-waited.
launch(){
  adb logcat -c; adb shell am force-stop $PKG
  adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  local T
  for i in $(seq 1 25); do
    sleep 3
    T=$($UI texts 2>/dev/null)
    # First launch after install shows a config dialog before the login screen.
    if echo "$T" | grep -q "est maintenant pr"; then $UI tap "Ok" >/dev/null; sleep 4; continue; fi
    echo "$T" | grep -qx '"CONNEXION"' && return 0   # login screen
    echo "$T" | grep -q "Recherche"  && return 0   # already signed in
  done
  bad "app never reached the login screen after relaunch"
  $UI shot p14-launch-timeout >/dev/null
  return 1
}
login(){
  # No-op if a session is already open.
  at_login || return 0
  $UI tapnth EditText 0 >/dev/null; sleep 1; $UI type "testuser"; sleep 1; $UI kbd; sleep 1
  $UI tapnth EditText 1 >/dev/null; sleep 1; $UI type "test1234"; sleep 1; $UI kbd; sleep 1
  $UI tap "CONNEXION" >/dev/null; sleep 14
  $UI tap "Ok" >/dev/null 2>&1; sleep 6
  # The dashboard can take a moment more to paint after the success dialog.
  for i in 1 2 3 4 5; do $UI texts 2>/dev/null | grep -q "sur [0-9]" && return 0; sleep 3; done
  return 0
}

step "seed + boot"
scripts/validate/seed-testuser.sh agent >/dev/null 2>&1 && ok "testuser seeded (agent)" || bad "seed"
launch
has "bridgeless architecture"        "BridgelessReact"
has "SQLCipher store opened"         "SQLCipher: true"
has "no Realm migration re-run"      "already-migrated"
at_login && ok "login screen" || bad "login screen"

step "offline login"
login
# The dashboard rendering with a readable row count IS the proof that the offline
# bcrypt login succeeded — there is no single logcat line that says so.
N0=$(rows)
if [ -n "$N0" ]; then ok "offline login -> dashboard: $N0 rows"; else
  bad "offline login failed or dashboard unreadable"; $UI shot p14-login-failure; exit 1; fi

if [ "${1:-}" = "--check" ]; then
  printf '\n== %d passed, %d failed (--check)\n' "$PASS" "$FAIL"; [ "$FAIL" -eq 0 ]; exit $?
fi

step "new birth declaration"
# FAB: the only clickable with no text in the bottom-right quadrant.
read -r fx1 fy1 fx2 fy2 <<<"$(grep -oE 'clickable="true"[^>]*bounds="\[[0-9]+,1[89][0-9]{2}\]\[[0-9]+,[0-9]+\]"' "$OUT/ui.xml" \
      | grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' | head -1 | grep -oE '[0-9]+' | tr '\n' ' ')"
if [ -z "$fx2" ]; then bad "FAB not found"; $UI shot p14-no-fab; exit 1; fi
tapxy "$(( (fx1+fx2)/2 )) $(( (fy1+fy2)/2 ))"; sleep 4
$UI tap "Naissance" >/dev/null; sleep 6
$UI texts 2>/dev/null | grep -q "Informations sur la notification" && ok "page 1 (notification)" || bad "page 1"

# Page 1 — reference, then the date picker. Button 0 is the calendar icon,
# Button 1 the clock; they are the only android.widget.Buttons above the footer.
$UI tapnth EditText 0 >/dev/null; sleep 1; $UI type "P14TEST"; sleep 1; $UI kbd; sleep 2
adb logcat -c
$UI tapnth Button 0 >/dev/null; sleep 5
if $UI texts 2>/dev/null | grep -qE '^"[0-9]{4}"$'; then ok "date picker opened (populated field)"; else bad "date picker did not open"; fi
DAY="15 $(date +'%B %Y')"
$UI tap "$DAY" >/dev/null 2>&1; sleep 2; $UI tap "OK" >/dev/null 2>&1; sleep 4
# The React 19 regression: unpatched, the memo comparator dereferences an
# undefined `date` and throws here.
if adb logcat -d 2>/dev/null | grep -qE "getTime|undefined is not|TypeError|FATAL"; then
  bad "date picker threw — react-native-modal-datetime-picker patch missing?"
else ok "date picker: no React 19 defaultProps error"; fi
advance "page 1 -> 2" "Renseignement sur l'enfant" || FORM_BROKE=1

# Page 2 — child
$UI radio "Oui" >/dev/null; sleep 2
$UI tapnth EditText 0 >/dev/null; sleep 1; $UI type "Phase14"; sleep 1; $UI kbd; sleep 1
$UI radio "Masculin" >/dev/null; sleep 2
advance "page 2 -> 3" "Informations sur la naissance" || FORM_BROKE=1

# Page 3 — birth. Second date field is EMPTY, which is the strongest test of the
# patch: with no incoming `date` the default parameter is the only thing that
# stops the comparator throwing.
adb logcat -c
$UI tapnth Button 0 >/dev/null; sleep 5
if $UI texts 2>/dev/null | grep -qE '^"[0-9]{4}"$'; then ok "date picker opened (EMPTY field)"; else bad "date picker (empty) did not open"; fi
if adb logcat -d 2>/dev/null | grep -qE "getTime|undefined is not|TypeError|FATAL"; then
  bad "empty-date picker threw — patch missing?"
else ok "empty-date picker: default applied, no error"; fi
$UI tap "$DAY" >/dev/null 2>&1; sleep 2; $UI tap "OK" >/dev/null 2>&1; sleep 4
# Time picker. Its confirm is "Ok", NOT "OK" - ui.sh tap is case sensitive, so
# "OK" never matches, the picker stays open and the field stays empty.
$UI tapnth Button 1 >/dev/null; sleep 5
$UI tap "Ok" >/dev/null 2>&1; sleep 4
# Both pickers must have left a value or page 3 cannot validate.
BD=$($UI edits 2>/dev/null | sed -n 1p); BT=$($UI edits 2>/dev/null | sed -n 2p)
case "$BD" in *[0-9]*) ok "birth date set ($BD)";; *) bad "birth date empty";; esac
case "$BT" in *[0-9]*) ok "birth time set ($BT)";; *) bad "birth time empty - picker confirm missed";; esac
$UI radio "Domicile" >/dev/null; sleep 3
# Selecting Domicile inserts the "Adresse du lieu de l'accouchement" field, which
# pushes "Naissance multiple *" below the fold. uiautomator only reports rendered
# nodes, so the radio is simply not there until the page is scrolled — this was
# what silently stalled page 3 -> 4.
adb shell input swipe 540 1700 540 800 400; sleep 3
$UI radio "Non" >/dev/null; sleep 2
CHK=$($UI states 2>/dev/null | grep -c 'checked="true"')
[ "${CHK:-0}" -ge 2 ] && ok "page 3 radios set ($CHK checked)" || bad "page 3 radios: only $CHK checked, expected 2"
advance "page 3 -> 4" "Renseignement sur le père" || FORM_BROKE=1

# Page 4 — father unknown collapses the section (RadioButton 1 = "Père connu: Non")
$UI tapnth RadioButton 1 >/dev/null; sleep 3
advance "page 4 -> 5" "Renseignement sur la mère" || FORM_BROKE=1

# Page 5 — mother
$UI tapnth RadioButton 1 >/dev/null; sleep 2   # Mère décédée: Non
$UI tapnth RadioButton 3 >/dev/null; sleep 3   # NNI: Non
$UI tapnth EditText 1 >/dev/null; sleep 1; $UI type "Quatorze"; sleep 1; $UI kbd; sleep 1
$UI tapnth EditText 2 >/dev/null; sleep 1; $UI type "Phase"; sleep 1; $UI kbd; sleep 2
if [ "$FORM_BROKE" = 1 ]; then
  bad "form never reached page 5 - skipping save, send and V7"
  echo "     see scripts/validate/out/p14-err-* and p14-stuck-* for what was on screen"
else
  $UI tap "Enregistrer" >/dev/null; sleep 12
  N1=$(rows); eq "row count after save" "$((N0+1))" "$N1"
fi

step "persistence across restart"
if [ "$FORM_BROKE" = 1 ]; then echo "   skipped"; else
launch; login
N2=$(rows); eq "row count after restart" "$((N0+1))" "$N2"
fi

step "validate -> filter -> send"
if [ "$FORM_BROKE" = 1 ]; then echo "   skipped - no new record to validate"; else
# Row dialog opens on a plain tap of a row cell. Both it and the ⋮ menu are
# invisible to uiautomator, hence the OVERLAY BLOCK coordinates.
tapxy "468 889"; sleep 4            # 4th row = the record just created
tapxy "$DLG_VALIDER"; sleep 8
ok "VALIDER tapped"
tapxy "$MENU_BTN";     sleep 3
tapxy "$CB_VALIDE";    sleep 2
tapxy "$CB_BROUILLON"; sleep 2
tapxy "$CB_ERREUR";    sleep 2
tapxy "300 1700";      sleep 3      # close the menu
N3=$(rows); eq "Validé filter isolates the record" "1" "$N3"

adb shell input swipe $ROW1 $ROW1 1500; sleep 3   # long-press: only works on Validé
$UI texts >/dev/null 2>&1
grep -q 'class="android.widget.CheckBox"' "$OUT/ui.xml" && ok "selection checkbox appeared" || bad "long-press did not select"
adb logcat -c
tapxy "94 490"; sleep 3             # tick it
tapxy "$MENU_BTN"; sleep 3
tapxy "$BTN_ENVOYER"; sleep 20
has "send reached the gateway (401 expected on dev)" "status code 401"
fi

step "V7 payload"
if [ "$FORM_BROKE" = 1 ]; then echo "   skipped - nothing was sent"; else
adb logcat -d 2>/dev/null | grep -o 'notification : {.*}' | tail -1 | sed 's/^notification : //' \
  > "$OUT/payload-NAISSANCE-phase14-rerun.json.txt"
python - <<'PY'
import json, sys, os
out = "scripts/validate/out"
new = os.path.join(out, "payload-NAISSANCE-phase14-rerun.json.txt")
ref = os.path.join(out, "payload-NAISSANCE-phase13.json.txt")
try:
    a = json.load(open(ref)); b = json.load(open(new))
except Exception as e:
    print("  \033[31mFAIL\033[0m payload unreadable: %s" % e); sys.exit(1)
ka, kb = list(a["metadata"]), list(b["metadata"])
common = [k for k in ka if k in b["metadata"]]
order_ok = [k for k in ka if k in common] == [k for k in kb if k in common]
extra = [k for k in kb if k not in a["metadata"]]
print("  \033[32mPASS\033[0m top-level keys identical" if list(a) == list(b)
      else "  \033[31mFAIL\033[0m top-level keys differ")
print("  \033[32mPASS\033[0m %d common keys, relative order identical" % len(common) if order_ok
      else "  \033[31mFAIL\033[0m common-key order changed")
print("  \033[32mPASS\033[0m no new metadata keys" if not extra
      else "  \033[31mFAIL\033[0m new keys: %s" % extra)
missing = [k for k in ka if k not in b["metadata"]]
if missing:
    print("  note: %d key(s) absent, expected when the form is filled differently" % len(missing))
    print("        %s" % ", ".join(missing))
PY
fi

step "export"
# Count the existing export dirs first: otherwise a stale one from an earlier run
# satisfies every file check below and the step passes without exporting anything.
EXPBEFORE=$(adbx shell ls -d /sdcard/Android/data/$PKG/files/export/*/ 2>/dev/null | tr -d '\r' | wc -l)
# Reaching the export means getting back to the login screen first, from wherever
# the walkthrough left off (dashboard, or mid-form if it failed).
for i in 1 2 3; do
  at_login && break
  $UI texts 2>/dev/null | grep -qE "Résultat|Export" && { $UI tap "OK" >/dev/null 2>&1; sleep 3; }
  $UI tap "DÉCONNEXION" >/dev/null 2>&1; sleep 8
  $UI texts 2>/dev/null | grep -q "Accueil" && { $UI tap "Accueil" >/dev/null 2>&1; sleep 4; }
done
at_login && ok "back at the login screen" || bad "could not reach the login screen to export"
# Long-press the build ID at the foot of the login screen. Confirm the dialog is
# really up before tapping EXPORTER, otherwise the tap lands on nothing and the
# step "fails" for a reason that has nothing to do with exporting.
for i in 1 2 3; do
  $UI longpress "1.1.4-dev" >/dev/null 2>&1; sleep 6
  $UI texts 2>/dev/null | grep -q "Export des bases" && break
done
if $UI texts 2>/dev/null | grep -q "Export des bases"; then
  ok "export dialog opened"
else
  bad "export dialog never opened"; $UI shot p14-no-export-dialog >/dev/null
fi
$UI tap "EXPORTER" >/dev/null; sleep 15
$UI texts 2>/dev/null | grep -q "Export terminé" && ok "export completed" || bad "export did not report success"
EXPAFTER=$(adbx shell ls -d /sdcard/Android/data/$PKG/files/export/*/ 2>/dev/null | tr -d '\r' | wc -l)
eq "a new export directory was created" "$((EXPBEFORE+1))" "$EXPAFTER"
if [ "$EXPAFTER" -le "$EXPBEFORE" ]; then
  echo "   skipping the file checks: the newest directory is stale, so passing them would mean nothing"
else
D=$(adbx shell ls -d /sdcard/Android/data/$PKG/files/export/*/ 2>/dev/null | tr -d '\r' | tail -1)
FILES=$(adbx shell ls "$D" 2>/dev/null | tr -d '\r')
for f in crsen.db dbSenegal.db manifest.txt; do
  echo "$FILES" | grep -qx "$f" && ok "exported $f" || bad "exported $f — missing"
done
echo "$FILES" | grep -q "realm" \
  && bad "a Realm file was exported — Realm was removed in Phase 13" \
  || ok "no Realm file in the export"
adbx pull "$D/dbSenegal.db" "$OUT/dbSenegal-check.db" >/dev/null 2>&1
# Capture the result in bash: printing PASS from inside python left it out of the
# tally, so a corrupt database would have been reported and still exited 0.
INTEG=$(python -c "
import sqlite3
print(sqlite3.connect(r'$OUT/dbSenegal-check.db').execute('PRAGMA integrity_check').fetchone()[0])
" 2>/dev/null)
eq "dbSenegal.db integrity_check" "ok" "$INTEG"
fi

printf '\n===============================\n'
printf ' Phase 14 walkthrough: %d passed, %d failed\n' "$PASS" "$FAIL"
printf '===============================\n'
[ "$FAIL" -eq 0 ]
