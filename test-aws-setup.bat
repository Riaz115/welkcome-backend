@echo off
setlocal enabledelayedexpansion

echo 🧪 Testing AWS Setup...
echo.

REM Test AWS CLI
echo 🔐 Testing AWS CLI...
aws sts get-caller-identity >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ AWS CLI working
    for /f "tokens=2 delims= " %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
    echo    Account ID: %ACCOUNT_ID%
) else (
    echo ❌ AWS CLI not working
    echo    Run: aws configure
    pause
    exit /b 1
)
echo.

REM Test GitHub Actions workflow
echo 📁 Testing GitHub Actions workflow...
if exist ".github\workflows\deploy.yml" (
    echo ✅ GitHub Actions workflow exists
) else (
    echo ❌ GitHub Actions workflow missing
)
echo.

REM Test Terraform
echo 🏗️ Testing Terraform...
if exist "terraform\main.tf" (
    echo ✅ Terraform files exist
) else (
    echo ❌ Terraform files missing
)
echo.

REM Test Docker
echo 🐳 Testing Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker installed
) else (
    echo ❌ Docker not installed
    echo    Download from: https://docker.com
)
echo.

REM Test Node.js
echo 📦 Testing Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js installed
) else (
    echo ❌ Node.js not installed
    echo    Download from: https://nodejs.org
)
echo.

echo 🎯 Setup Status:
echo.
if exist ".github\workflows\deploy.yml" (
    echo ✅ GitHub Actions: Ready
) else (
    echo ❌ GitHub Actions: Missing
)

if exist "terraform\main.tf" (
    echo ✅ Terraform: Ready  
) else (
    echo ❌ Terraform: Missing
)

if exist "Dockerfile" (
    echo ✅ Docker: Ready
) else (
    echo ❌ Docker: Missing
)

echo.
echo 🚀 Next Steps:
echo 1. Add GitHub Secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
echo 2. Run: setup-aws.bat
echo 3. Push code to trigger deployment!
echo.
pause
