# PowerShell script to install dependencies for all microservices
# Run this from the Microservices_Architecture folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies               " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install Student Service dependencies
Write-Host "Installing Student Service dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\student-service"
npm install

# Install Course Service dependencies
Write-Host ""
Write-Host "Installing Course Service dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\course-service"
npm install

# Install Enrollment Service dependencies
Write-Host ""
Write-Host "Installing Enrollment Service dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\enrollment-service"
npm install

# Install API Gateway dependencies
Write-Host ""
Write-Host "Installing API Gateway dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\api-gateway"
npm install

# Return to root
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All dependencies installed!           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now start all services with: .\start-all.ps1" -ForegroundColor Yellow
