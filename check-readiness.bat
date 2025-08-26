@echo off
setlocal enabledelayedexpansion

echo 🔍 Checking if Monkmaze Backend is ready for deployment...
echo.

REM Check if GitHub Actions workflow exists
echo 📁 Checking GitHub Actions workflow...
if exist ".github\workflows\deploy.yml" (
    echo ✅ GitHub Actions workflow exists
) else (
    echo ❌ GitHub Actions workflow missing
    echo    Cannot deploy without this file
    pause
    exit /b 1
)

REM Check if Terraform files exist
echo 🏗️ Checking Terraform files...
if exist "terraform\main.tf" (
    echo ✅ Terraform main.tf exists
) else (
    echo ❌ Terraform main.tf missing
    pause
    exit /b 1
)

if exist "terraform\variables.tf" (
    echo ✅ Terraform variables.tf exists
) else (
    echo ❌ Terraform variables.tf missing
    pause
    exit /b 1
)

if exist "terraform\terraform.tfvars" (
    echo ✅ Terraform terraform.tfvars exists
) else (
    echo ❌ Terraform terraform.tfvars missing
    echo    Run setup-monkmaze.bat first
    pause
    exit /b 1
)

REM Check if Dockerfile exists
echo 🐳 Checking Docker configuration...
if exist "Dockerfile" (
    echo ✅ Dockerfile exists
) else (
    echo ❌ Dockerfile missing
    pause
    exit /b 1
)

REM Check if setup script exists
echo 📝 Checking setup scripts...
if exist "setup-monkmaze.bat" (
    echo ✅ setup-monkmaze.bat exists
) else (
    echo ❌ setup-monkmaze.bat missing
    pause
    exit /b 1
)

echo.
echo 🎯 DEPLOYMENT READINESS STATUS:
echo.

echo ✅ GitHub Actions: Ready
echo ✅ Terraform: Ready
echo ✅ Docker: Ready
echo ✅ Scripts: Ready
echo.

echo 🚨 IMPORTANT: Infrastructure NOT deployed yet!
echo.
echo 📋 NEXT STEPS (Order Important):
echo.
echo 1. 🚀 Deploy AWS Infrastructure:
echo    setup-monkmaze.bat
echo    cd terraform
echo    terraform init
echo    terraform plan
echo    terraform apply
echo.
echo 2. 🔑 Add GitHub Secrets:
echo    AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID_HERE
echo    AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_ACCESS_KEY_HERE
echo.
echo 3. 📤 Push Code:
echo    git add .
echo    git commit -m "Ready for deployment"
echo    git push origin main
echo.

echo ⚠️  DON'T push code yet - infrastructure not ready!
echo.

pause
