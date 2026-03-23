Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Creating local demo session..."
$login = Invoke-WebRequest -Method Post -Uri "http://localhost:3000/auth/session/dev-login" -ContentType "application/json" -Body '{"userId":"demo-user","email":"demo.user@example.com","role":"ADMIN"}' -SessionVariable session
if ($login.StatusCode -ne 200) { throw "Login failed." }

Write-Host "Starting local sync job..."
$job = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/sync/spotify/start" -WebSession $session
$job | ConvertTo-Json -Depth 6

Write-Host "Done. Open http://localhost:4000/dashboard"
