Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Starting local platform..."
docker compose up --build -d
Write-Host "Services status:"
docker compose ps
