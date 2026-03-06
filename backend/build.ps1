# USM Messenger backend - build script
# Sets JAVA_HOME to Java 21 so Maven uses the correct JDK

$java21Path = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
if (-not (Test-Path "$java21Path\bin\java.exe")) {
    # Fallback: use JAVA_HOME from User env if path differs
    $java21Path = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
}
if (-not $java21Path -or -not (Test-Path "$java21Path\bin\java.exe")) {
    Write-Error "Java 21 not found. Install Eclipse Temurin 21 or set JAVA_HOME to JDK 21."
    exit 1
}

$env:JAVA_HOME = $java21Path
& "$PSScriptRoot\mvnw.cmd" @args
