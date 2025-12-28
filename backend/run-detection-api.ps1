# PowerShell script untuk menjalankan detection API
# Usage: .\run-detection-api.ps1

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonScript = Join-Path $backendDir "yolo\detection_api.py"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Starting YOLO Detection API Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Backend directory: $backendDir" -ForegroundColor Yellow
Write-Host "📍 Python script: $pythonScript" -ForegroundColor Yellow
Write-Host ""

# Change to backend directory
Set-Location $backendDir

# Check if python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Make sure Python is installed and in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Starting detection API..." -ForegroundColor Cyan
Write-Host "⏳ Please wait 5-10 seconds for model loading..." -ForegroundColor Yellow
Write-Host ""

# Run detection API
python yolo/detection_api.py

Write-Host ""
Write-Host "⚠️  Detection API stopped" -ForegroundColor Yellow
