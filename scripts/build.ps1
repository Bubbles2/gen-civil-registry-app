<#
.SYNOPSIS
    Build one flavor of the app and print the APK path and its SHA-256.

.DESCRIPTION
    Replaces buildDevRelease.bat / buildQuaRelease.bat / buildPreprodRelease.bat /
    buildProdRelease.bat. Those bundled JS by hand into src/main/assets and then
    deleted drawable-* directories; react.gradle already bundles JS and assets
    for release variants, so a plain Gradle assemble is all that is needed.

    With -Archive, the APK, a .sha256 file, build-info.txt and (when apkanalyzer
    is on PATH or under ANDROID_HOME) the merged manifest, permission list and
    file list are copied into the given directory. This is the golden-APK
    record used by the V5 check of the upgrade plan.

.PARAMETER Flavor
    dev | qua | preprod | prod

.PARAMETER BuildType
    Release (default) | Debug

.PARAMETER Clean
    Run `gradlew clean` first.

.PARAMETER Archive
    Directory to copy the APK and its evidence into. Created if missing.

.PARAMETER JavaHome
    JDK that runs Gradle. Defaults to Amazon Corretto 21 (Phase 8 of the upgrade
    plan moved Gradle to JDK 21; bytecode stays Java 17); pass another path to override.

.EXAMPLE
    .\scripts\build.ps1 -Flavor qua
    .\scripts\build.ps1 -Flavor prod -Clean -Archive .\golden\1.1.4
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'qua', 'preprod', 'prod')]
    [string]$Flavor,

    [ValidateSet('Release', 'Debug')]
    [string]$BuildType = 'Release',

    [switch]$Clean,

    [string]$Archive,

    [string]$JavaHome = 'C:\Program Files\Amazon Corretto\jdk21.0.6_7'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$gradlew = Join-Path $android 'gradlew.bat'

# Runs a native executable and judges it on its exit code only. Under
# $ErrorActionPreference = 'Stop', PowerShell 5.1 would otherwise turn any
# stderr line (gradle and npm print warnings there) into a terminating error.
function Invoke-Native {
    param([string]$Exe, [string[]]$Arguments, [string]$WorkingDirectory)
    Push-Location $WorkingDirectory
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Exe @Arguments 2>&1 | ForEach-Object { "$_" }
        if ($LASTEXITCODE -ne 0) { throw "$Exe $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
    }
    finally {
        $ErrorActionPreference = $previous
        Pop-Location
    }
}

function Invoke-Gradle {
    param([string[]]$Arguments)
    Invoke-Native -Exe $gradlew -Arguments $Arguments -WorkingDirectory $android
}

function Find-ApkAnalyzer {
    $cmd = Get-Command apkanalyzer.bat -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($sdkRoot in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)) {
        if (-not $sdkRoot) { continue }
        $candidate = Join-Path $sdkRoot 'cmdline-tools\latest\bin\apkanalyzer.bat'
        if (Test-Path $candidate) { return $candidate }
        $candidate = Join-Path $sdkRoot 'tools\bin\apkanalyzer.bat'
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

# --- environment -----------------------------------------------------------
Write-Host "== $Flavor $BuildType" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $JavaHome 'bin\java.exe'))) { throw "JavaHome not found: $JavaHome" }
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$env:Path"
# JDK 16+ backs NIO pipes with a Unix-domain socket under java.io.tmpdir. On
# this machine that socket cannot be connected anywhere under the user profile
# (Gradle dies with "Unable to establish loopback connection"), so run every
# JVM Gradle spawns with a plain temp directory. TEMP/TMP is used rather than
# JAVA_TOOL_OPTIONS because the latter makes each JVM print a banner to stderr,
# which AGP's prefab step treats as a failure (breaks CMake-based modules).
$gradleTemp = 'C:\Temp'
New-Item -ItemType Directory -Force -Path $gradleTemp | Out-Null
$env:TEMP = $gradleTemp
$env:TMP = $gradleTemp
Write-Host "JAVA_HOME = $env:JAVA_HOME"
Write-Host "TEMP      = $env:TEMP (JDK 16+ Unix-domain-socket workaround)"
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
    Write-Host "node_modules missing, running npm ci" -ForegroundColor Yellow
    Invoke-Native -Exe 'npm.cmd' -Arguments @('ci') -WorkingDirectory $root
}

# --- build -----------------------------------------------------------------
$task = "assemble$($Flavor.Substring(0,1).ToUpper() + $Flavor.Substring(1))$BuildType"
$gradleArgs = @()
if ($Clean) { $gradleArgs += 'clean' }
$gradleArgs += $task
Invoke-Gradle $gradleArgs

# --- locate output ---------------------------------------------------------
$outDir = Join-Path $android "app\build\outputs\apk\$Flavor\$($BuildType.ToLower())"
$apk = Get-ChildItem -Path $outDir -Filter '*.apk' -ErrorAction Stop | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) { throw "no APK found under $outDir" }
$sha = (Get-FileHash -Algorithm SHA256 -Path $apk.FullName).Hash.ToLower()

Write-Host ""
Write-Host "APK     $($apk.FullName)" -ForegroundColor Green
Write-Host "SHA-256 $sha"
Write-Host "Size    $([math]::Round($apk.Length / 1MB, 2)) MB"

# --- optional archive ------------------------------------------------------
if ($Archive) {
    New-Item -ItemType Directory -Force -Path $Archive | Out-Null
    $dest = Join-Path $Archive $apk.Name
    Copy-Item -Path $apk.FullName -Destination $dest -Force
    "$sha  $($apk.Name)" | Out-File -Encoding ascii -FilePath "$dest.sha256"

    Push-Location $root
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $gitSha = (& git rev-parse --short HEAD 2>$null)
        $gitDirty = (& git status --porcelain --untracked-files=no 2>$null)
    }
    finally {
        $ErrorActionPreference = $previous
        Pop-Location
    }
    if ($gitDirty) { $gitSha = "$gitSha-dirty" }

    @(
        "flavor=$Flavor",
        "buildType=$BuildType",
        "apk=$($apk.Name)",
        "sha256=$sha",
        "bytes=$($apk.Length)",
        "gitSha=$gitSha",
        "builtAt=$(Get-Date -Format o)",
        "javaHome=$env:JAVA_HOME",
        "machine=$env:COMPUTERNAME"
    ) | Out-File -Encoding utf8 -FilePath (Join-Path $Archive 'build-info.txt')

    $analyzer = Find-ApkAnalyzer
    if ($analyzer) {
        Invoke-Native -Exe $analyzer -Arguments @('manifest', 'print', $dest) -WorkingDirectory $root |
            Out-File -Encoding utf8 -FilePath (Join-Path $Archive 'manifest.xml')
        Invoke-Native -Exe $analyzer -Arguments @('manifest', 'permissions', $dest) -WorkingDirectory $root |
            Out-File -Encoding utf8 -FilePath (Join-Path $Archive 'permissions.txt')
        Invoke-Native -Exe $analyzer -Arguments @('files', 'list', $dest) -WorkingDirectory $root |
            Out-File -Encoding utf8 -FilePath (Join-Path $Archive 'files.txt')
        Write-Host "Archived APK, sha256, build-info, manifest, permissions and file list to $Archive" -ForegroundColor Green
    }
    else {
        Write-Host "apkanalyzer not found; archived APK, sha256 and build-info only." -ForegroundColor Yellow
        Write-Host "Install 'Android SDK Command-line Tools' from the SDK Manager (cmdline-tools\latest\bin) to also record manifest, permissions and file list." -ForegroundColor Yellow
    }
}
