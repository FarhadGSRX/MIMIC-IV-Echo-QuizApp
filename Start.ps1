# Start script for MIMIC-IV Echo Quiz App

$Port = 8000
$Python = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" }
          elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" }
          else { $null }

if (-not $Python) {
    Write-Host "Python was not found on your system." -ForegroundColor Yellow
    Write-Host "Please download and install Python from https://www.python.org/"
    Write-Host "Ensure you check 'Add Python to PATH' during installation."
    Write-Host "`nAfter installation, run: cd public; python -m http.server $Port"
    Read-Host "Press Enter to exit..."
    exit 1
}

$PublicDir = Join-Path $PSScriptRoot "public"
if (-not (Test-Path $PublicDir)) {
    Write-Host "Could not find public/ directory" -ForegroundColor Red
    exit 1
}

Write-Host "Starting the web application on http://localhost:$Port ..." -ForegroundColor Green

# Open browser after a short delay so the server has time to start
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:$using:Port"
} | Out-Null

& $Python -m http.server $Port --directory $PublicDir
