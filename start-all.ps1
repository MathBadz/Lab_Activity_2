# PowerShell script to start all microservices
# Run this from the Microservices_Architecture folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Microservices Architecture   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Student Service
Write-Host "Starting Student Service (PORT 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\student-service'; npm start"

Start-Sleep -Seconds 2

# Start Course Service
Write-Host "Starting Course Service (PORT 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\course-service'; npm start"

Start-Sleep -Seconds 2

# Start Enrollment Service
Write-Host "Starting Enrollment Service (PORT 3003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\enrollment-service'; npm start"

Start-Sleep -Seconds 2

# Start API Gateway
Write-Host "Starting API Gateway (PORT 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\api-gateway'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services started!                 " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running at:" -ForegroundColor White
Write-Host "  API Gateway:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Student Service:     http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Course Service:      http://localhost:3002" -ForegroundColor Cyan
Write-Host "  Enrollment Service:  http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open http://localhost:3000 in your browser for the web interface." -ForegroundColor Yellow
Write-Host ""
Write-Host "To seed sample data, run: node seed.js" -ForegroundColor Yellow
