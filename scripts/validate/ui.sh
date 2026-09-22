#!/bin/bash
# adb/uiautomator helper for driving the app on the emulator (used by /validate).
#
#   ui.sh texts                 list visible text / content-desc
#   ui.sh tap "<text>"          tap the first node whose text contains <text>
#   ui.sh longpress "<text>"
#   ui.sh find "<text>"         print bounds  x1 y1 x2 y2
#   ui.sh tapxy <x> <y>
#   ui.sh tapnth <Class> <n>    tap n-th (0-based) android.widget.<Class>, e.g. EditText 2, RadioButton 3
#   ui.sh radio "<label>"       tap the RadioButton that follows <label> in the tree
#   ui.sh checkbox "<label>"    tap the CheckBox that follows <label> (Dashboard status filters)
#   ui.sh type "<text>"         adb input text (use %s for space); type slowly? see slowtype
#   ui.sh slowtype "<text>"     one character at a time (masked inputs drop fast input)
#   ui.sh states                checked state of every RadioButton / CheckBox
#   ui.sh edits                 text of every EditText
#   ui.sh dismiss               close the dev LogBox toast only if one is showing
#   ui.sh kbd                   close the soft keyboard (never use BACK for this: it pops navigation)
#   ui.sh shot <name>           screenshot to scripts/validate/out/<name>.png
#
# Run from Git Bash. MSYS path conversion is disabled so /sdcard paths survive.
export MSYS_NO_PATHCONV=1
S="$(cd "$(dirname "$0")" && pwd)"; OUT="$S/out"; mkdir -p "$OUT"
dump(){ adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb shell cat /sdcard/ui.xml | sed 's/></>\n</g' > "$OUT/ui.xml"; }
texts(){ dump; grep -oE '(text|content-desc)="[^"]{1,80}"' "$OUT/ui.xml" | grep -v '=""' | sed 's/^[a-z-]*=//' | uniq; }
bounds_of(){ grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | head -1 | grep -oE '[0-9]+' | tr '\n' ' '; }
find_(){ dump; grep -E "(text|content-desc)=\"[^\"]*$1[^\"]*\"" "$OUT/ui.xml" | bounds_of; }
center(){ read x1 y1 x2 y2 <<<"$1"; [ -z "$x1" ] && return 1; echo "$(( (x1+x2)/2 )) $(( (y1+y2)/2 ))"; }
tap(){ c=$(center "$(find_ "$1")") || { echo "NOT FOUND: $1"; return 1; }; adb shell input tap $c; echo "tapped '$1' @ $c"; }
longpress(){ c=$(center "$(find_ "$1")") || { echo "NOT FOUND: $1"; return 1; }; read x y <<<"$c"; adb shell input swipe $x $y $x $y 1200; echo "long-pressed '$1' @ $c"; }
tapnth(){ dump; c=$(center "$(grep "class=\"android.widget.$1\"" "$OUT/ui.xml" | sed -n "$(( $2 + 1 ))p" | bounds_of)") || { echo "NO $1 #$2"; return 1; }; adb shell input tap $c; echo "tapped $1 #$2 @ $c"; }
after_label(){ dump; grep -A8 "text=\"$1\"" "$OUT/ui.xml" | grep "class=\"android.widget.$2\"" | head -1 | bounds_of; }
radio(){ c=$(center "$(after_label "$1" RadioButton)") || { echo "NO RADIO: $1"; return 1; }; adb shell input tap $c; echo "radio '$1'"; }
checkbox(){ c=$(center "$(after_label "$1" CheckBox)") || { echo "NO CHECKBOX: $1"; return 1; }; adb shell input tap $c; echo "checkbox '$1'"; }
slowtype(){ for ((i=0;i<${#1};i++)); do adb shell input text "${1:$i:1}"; sleep 0.3; done; }
states(){ dump; grep -E 'class="android.widget.(RadioButton|CheckBox)"' "$OUT/ui.xml" | grep -oE 'class="[^"]*"|checked="[^"]*"' | paste - - ; }
edits(){ dump; grep 'class="android.widget.EditText"' "$OUT/ui.xml" | grep -oE 'text="[^"]*"'; }
dismiss(){ dump; if grep -qE 'text="[^"]*(Support for|took|onPress in|Warning|Possible Unhandled)[^"]*"' "$OUT/ui.xml"; then adb shell input tap 992 2140; echo "toast dismissed"; fi; }
shot(){ adb exec-out screencap -p > "$OUT/${1:-screen}.png"; echo "$OUT/${1:-screen}.png"; }
case "$1" in
  texts) texts;; tap) tap "$2";; longpress) longpress "$2";; find) find_ "$2"; echo;; tapxy) adb shell input tap $2 $3;;
  tapnth) tapnth "$2" "$3";; radio) radio "$2";; checkbox) checkbox "$2";; type) adb shell input text "$2";; slowtype) slowtype "$2";;
  states) states;; edits) edits;; dismiss) dismiss;; kbd) adb shell input keyevent 111;; shot) shot "$2";;
  *) sed -n 2,20p "$0";;
esac
