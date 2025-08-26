# 🚀 Install Terraform on Windows

## 📋 **Prerequisites:**
- Windows 10/11
- Chocolatey (recommended) or manual download

## 🔧 **Method 1: Using Chocolatey (Recommended)**

### **Step 1: Install Chocolatey**
Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### **Step 2: Install Terraform**
```powershell
choco install terraform
```

### **Step 3: Verify Installation**
```powershell
terraform --version
```

## 🔧 **Method 2: Manual Installation**

### **Step 1: Download Terraform**
1. Go to: https://www.terraform.io/downloads
2. Download Windows 64-bit version
3. Extract the zip file

### **Step 2: Add to PATH**
1. Copy `terraform.exe` to `C:\terraform\`
2. Add `C:\terraform\` to your PATH environment variable
3. Restart PowerShell

### **Step 3: Verify Installation**
```powershell
terraform --version
```

## 🔧 **Method 3: Using Winget (Windows 10/11)**
```powershell
winget install HashiCorp.Terraform
```

## ✅ **After Installation:**

### **Test Terraform:**
```powershell
terraform --version
```

### **Run Setup:**
```powershell
cd D:\Monkmaze-Project\backend
.\setup-monkmaze.bat
```

### **Deploy Infrastructure:**
```powershell
cd terraform
terraform init
terraform plan
terraform apply
```

## 🆘 **Need Help?**

If you still have issues:
1. Make sure PowerShell is running as Administrator
2. Check if PATH environment variable is set correctly
3. Restart PowerShell after installation

## 🎯 **Quick Test:**
```powershell
# Check if Terraform is working:
terraform --version

# If working, proceed with setup:
.\setup-monkmaze.bat
```

---

*Choose Method 1 (Chocolatey) for easiest installation!*
