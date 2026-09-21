# Turns OFF React Native's legacy "remote JS debugging" flag in the dev app and relaunches it.
#
# Symptom this fixes: blank white screen on launch, Metro printing
# "JavaScript logs will appear in your browser console" and errors about
# ./debugger-ui/debuggerWorker, and Metro opening http://localhost:8081/debugger-ui/.
#
# Cause: the "Debug" item in the in-app dev menu (or the "Reload app" button on the
# debugger-ui page) enables remote debugging, which runs the JS in Chrome instead of Hermes.
# Realm and Hermes do not work in that mode, so nothing renders.
#
# Usage (from the project root):  .\scripts\disable-remote-debug.ps1 [-Package com.crseneagalmobile.dev]

param(
    [string]$Package = "com.crseneagalmobile.dev"
)

$ErrorActionPreference = "Stop"

$prefsXml = @"
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <boolean name="remote_js_debug" value="false" />
</map>
"@

$tmp = Join-Path $env:TEMP "rn_prefs_$Package.xml"
[System.IO.File]::WriteAllText($tmp, $prefsXml)

Write-Host "Stopping $Package ..."
adb shell am force-stop $Package

Write-Host "Writing remote_js_debug=false ..."
adb push $tmp /data/local/tmp/rn_prefs.xml | Out-Null
adb shell run-as $Package cp /data/local/tmp/rn_prefs.xml "shared_prefs/${Package}_preferences.xml"
adb shell rm /data/local/tmp/rn_prefs.xml
[System.IO.File]::Delete($tmp)

Write-Host "Current dev settings:"
adb shell run-as $Package cat "shared_prefs/${Package}_preferences.xml"

Write-Host "Relaunching app ..."
adb shell am start -n "$Package/com.crseneagalmobile.MainActivity" | Out-Null
Write-Host "Done. Remote debugging is off. Use chrome://inspect for Hermes breakpoints, never the dev menu 'Debug' item."
