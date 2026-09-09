[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Installing npm dependencies..."
npm install

Write-Host "Setup complete. Run npm run dev to start the development server."
