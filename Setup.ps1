# Setup script for MIMIC-IV Echo Quiz App

$zipName = "mimic-iv-echo-ext-mimicechoqa-a-benchmark-dataset-for-echocardiogram-based-visual-question-answering-1.0.0.zip"
$extractDir = "mimic-iv-echo-ext-mimicechoqa-a-benchmark-dataset-for-echocardiogram-based-visual-question-answering-1.0.0"
$dataDest = "public\data"

Write-Host "--- MIMIC-IV Echo Quiz App Setup ---" -ForegroundColor Cyan

# 1. Check for the ZIP file
if (-not (Test-Path $zipName)) {
    Write-Host "Error: Dataset zip file not found: $zipName" -ForegroundColor Red
    Write-Host "Please download the dataset zip file from PhysioNet (https://physionet.org/content/mimic-iv-echo-ext-mimicechoqa/1.0.0/)" -ForegroundColor Yellow
    Write-Host "Place the zip file in this folder and run the script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Extract the zip folder
Write-Host "Extracting dataset... This may take a few minutes." -ForegroundColor Gray
Expand-Archive -Path $zipName -DestinationPath "." -Force

# 3. Organize files into public\data
Write-Host "Organizing files..." -ForegroundColor Gray
if (-not (Test-Path $dataDest)) {
    New-Item -ItemType Directory -Path $dataDest | Out-Null
}

# Clear existing data for a clean install
if (Test-Path "$dataDest\files") { Remove-Item -Path "$dataDest\files" -Recurse -Force }

Move-Item -Path "$extractDir\LICENSE.txt" -Destination "$dataDest\LICENSE.txt" -Force
Move-Item -Path "$extractDir\README.md" -Destination "$dataDest\README.md" -Force
Move-Item -Path "$extractDir\MIMICEchoQA\MIMICEchoQA.json" -Destination "$dataDest\MIMICEchoQA.json" -Force
Move-Item -Path "$extractDir\MIMICEchoQA\0.1\files" -Destination "$dataDest\files" -Force

# 4. Remove metadata files (non-video files)
Write-Host "Cleaning up non-video files..." -ForegroundColor Gray
Get-ChildItem -Path "$dataDest\files" -Recurse -File -Exclude *.mp4 | Remove-Item -Force

# 5. Verify video file count
Write-Host "Verifying dataset integrity..." -ForegroundColor Gray
$videoCount = (Get-ChildItem -Path "$dataDest\files" -Recurse -File -Filter *.mp4).Count
if ($videoCount -eq 622) {
    Write-Host "Verification successful: Found 622 video files." -ForegroundColor Green
} else {
    Write-Host "Error: Expected 622 video files, but found $videoCount." -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure the zip file was downloaded completely (approx 1.1GB)."
    Write-Host "2. Check if you have enough disk space (approx 2.5GB needed for extraction)."
    Write-Host "3. Delete the 'public\data' folder and run this script again."
    Read-Host "Press Enter to exit..."
    exit 1
}

# 6. Delete the original extraction folder
Write-Host "Cleaning up extraction artifacts..." -ForegroundColor Gray
Remove-Item -Path $extractDir -Recurse -Force

# 7. Modify MIMICEchoQA.json paths
Write-Host "Updating database paths..." -ForegroundColor Gray
$jsonPath = "$dataDest\MIMICEchoQA.json"
try {
    $jsonData = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
    foreach ($item in $jsonData) {
        # Ensure videos is treated as an array and paths are correctly prefixed
        $item.videos = @($item.videos | ForEach-Object { 
            $p = $_
            $p = $p -replace "mimic-iv-echo/0\.1/files/", "data/files/"
            $p
        })
    }
    # Save back to JSON with proper depth and UTF8
    $jsonData | ConvertTo-Json -Depth 20 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Host "Database paths updated successfully." -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to update MIMICEchoQA.json: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================================`n" -ForegroundColor Cyan
Write-Host "You may now safely delete the original .zip file to save space." -ForegroundColor White
Write-Host "To launch the application now (and in the future), please run:" -ForegroundColor White
Write-Host "`n    .\Start.ps1`n" -ForegroundColor Yellow
Read-Host "Press Enter to finish..."
