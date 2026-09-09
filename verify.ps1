[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$commands = @(
  @("npm", "run", "test:run"),
  @("npm", "run", "typecheck"),
  @("npm", "run", "lint"),
  @("npm", "run", "format:check"),
  @("npm", "run", "build")
)

foreach ($command in $commands) {
  Write-Host "Running: $($command -join ' ')"
  & $command[0] $command[1..($command.Length - 1)]
  if ($LASTEXITCODE -ne 0) {
    throw "Verification failed: $($command -join ' ')"
  }
}

Write-Host "All Task 1 checks passed."
