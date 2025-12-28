#!/usr/bin/env pwsh
# Eye Exam - Development Server Quick Start Script
# This script cleans cache and starts development server quickly

Write-Host "🚀 Eye Exam Development Server Quick Start" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Navigate to project root
$projectRoot = Split-Path $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Function to kill processes on specific ports
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "🔍 Checking for processes on port $Port..." -ForegroundColor Yellow
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object OwningProcess -Unique
        
        if ($processes) {
            foreach ($proc in $processes) {
                Write-Host "💀 Killing process $($proc.OwningProcess) on port $Port" -ForegroundColor Red
                Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "✅ Port $Port is free" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  Could not check port $Port - probably free" -ForegroundColor Yellow
    }
}

# Kill processes on common development ports
Kill-ProcessOnPort -Port 5173
Kill-ProcessOnPort -Port 5174
Kill-ProcessOnPort -Port 5000

Write-Host ""
Write-Host "🧹 Cleaning development cache..." -ForegroundColor Magenta

# Clean frontend cache
if (Test-Path "frontend") {
    Set-Location "frontend"
    
    # Remove cache directories
    @(".react-router", "dist", "build", "node_modules\.vite") | ForEach-Object {
        if (Test-Path $_) {
            Write-Host "🗑️  Removing $_" -ForegroundColor Red
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    Set-Location ".."
}

# Clean backend uploads if needed
if (Test-Path "backend\uploads") {
    $uploadsCount = (Get-ChildItem "backend\uploads" | Measure-Object).Count
    if ($uploadsCount -gt 0) {
        Write-Host "🗑️  Cleaning backend uploads..." -ForegroundColor Red
        Remove-Item "backend\uploads\*" -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "⚡ Starting development servers..." -ForegroundColor Green

# Start frontend in background
Write-Host "🎨 Starting frontend server..." -ForegroundColor Cyan
Start-Process -WindowStyle Minimized -FilePath "cmd" -ArgumentList "/c", "cd frontend && npm run dev:fast"

# Wait a bit for frontend to start
Start-Sleep -Seconds 3

# Start backend in background  
Write-Host "🛠️  Starting backend server..." -ForegroundColor Cyan
Start-Process -WindowStyle Minimized -FilePath "cmd" -ArgumentList "/c", "cd backend && npm run dev"

Write-Host ""
Write-Host "🎉 Development servers starting up!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5174" -ForegroundColor Yellow
Write-Host "🛠️  Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏱️  Please wait 10-15 seconds for servers to fully start..." -ForegroundColor Cyan
Write-Host "🌐 Then open: http://localhost:5174 in your browser" -ForegroundColor Green

# Optional: Open browser automatically
$openBrowser = Read-Host "Open browser automatically? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Sleep -Seconds 8
    Start-Process "http://localhost:5174"
}

Write-Host ""
Write-Host "✅ Script completed! Development servers should be running." -ForegroundColor Green
Write-Host "🔍 Check the opened command windows for any error messages." -ForegroundColor Yellow