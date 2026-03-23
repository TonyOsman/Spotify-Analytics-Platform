Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Running smoke checks..."

$coreHealth = Invoke-RestMethod -Method Get "http://localhost:8080/health/live"
$edgeDocs = Invoke-RestMethod -Method Get "http://localhost:3000/docs/json"
$coreDocs = Invoke-RestMethod -Method Get "http://localhost:8080/v3/api-docs"

if ($coreHealth.status -ne "UP") {
  throw "Core API health failed."
}

if (-not $edgeDocs.openapi) {
  throw "Edge OpenAPI missing."
}

if (-not $coreDocs.openapi) {
  throw "Core OpenAPI missing."
}

Write-Host "Smoke checks passed."
