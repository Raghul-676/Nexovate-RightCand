$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = (Resolve-Path (Join-Path $BackendDir "..\..\..")).Path
& (Join-Path $WorkspaceRoot "start.ps1")
