# 🔐 AWS Credentials Setup Guide

## ⚠️ **IMPORTANT: Security Notice**
This repository contains **NO real AWS credentials**. All sensitive information has been replaced with placeholder values.

## 🎯 **How to Set Up Your AWS Credentials**

### **Option 1: Local Development (Recommended for testing)**
1. **Install AWS CLI** and run `aws configure`
2. **Create `terraform/terraform.tfvars`** from the example:
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   ```
3. **Edit the file** with your actual values:
   ```hcl
   aws_access_key = "YOUR_ACTUAL_ACCESS_KEY"
   aws_secret_key = "YOUR_ACTUAL_SECRET_KEY"
   ```

### **Option 2: GitHub Actions (Recommended for production)**
1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**
3. **Add these secrets:**
   - `AWS_ACCESS_KEY_ID` = Your AWS Access Key
   - `AWS_SECRET_ACCESS_KEY` = Your AWS Secret Key
   - `AWS_REGION` = ap-south-1

## 🚀 **Deployment Process**
1. **Push code to GitHub** (credentials are now safe)
2. **GitHub Actions will automatically:**
   - Build Docker image
   - Push to ECR
   - Deploy to ECS
   - Update load balancer

## 🔒 **Security Best Practices**
- ✅ **Never commit real credentials** to Git
- ✅ **Use IAM roles** when possible
- ✅ **Rotate access keys** regularly
- ✅ **Use least privilege** principle
- ✅ **Monitor access** with CloudTrail

## 📁 **Files to Update Locally**
- `terraform/terraform.tfvars` (create from example)
- `.env` (create from env.example)

## 🆘 **Need Help?**
- Check the `MONKMAZE_DEPLOYMENT_GUIDE.md`
- Run `setup-aws.bat` for automated setup
- Ensure your `.gitignore` includes `terraform.tfvars`
