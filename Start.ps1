# Start script for MIMIC-IV Echo Quiz App

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Starting the web application..." -ForegroundColor Green
    Start-Process "http://localhost:8000"
    Set-Location -Path "public"
    python -m http.server 8000
} else {
    Write-Host "Python was not found on your system." -ForegroundColor Yellow
    Write-Host "Please download and install Python from https://www.python.org/"
    Write-Host "Ensure you check 'Add Python to PATH' during installation."
    Write-Host "`nAfter installation, run: cd public; python -m http.server 8000"
    Read-Host "Press Enter to exit..."
}
