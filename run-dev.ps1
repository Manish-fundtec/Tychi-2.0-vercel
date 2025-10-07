$env:NODE_OPTIONS=""
$port = $env:PORT
if (-not $port) { $port = "3000" }
if (Test-Path "package-lock.json") { npm run dev }
elseif (Test-Path "yarn.lock") { yarn dev }
elseif (Test-Path "pnpm-lock.yaml") { pnpm dev }
else { npm run dev }

