# 🔑 Welkome Backend - Required Credentials

## 📋 **Exact Credentials You Need:**

### 1. **AWS Credentials** (Most Important!)
```
AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Kahan Milega:**
1. AWS Console → IAM → Users → Create User
2. Programmatic access select karein
3. AdministratorAccess policy attach karein
4. Access keys generate karein

### 2. **MongoDB Connection String**
```
MONGO_URI: mongodb://username:password@host:port/database
```

**Kahan Milega:**
- Your existing MongoDB connection
- Ya Atlas MongoDB use kar rahe hain to wahan se

### 3. **GitHub Repository Secrets**
```
Repository → Settings → Secrets → Actions → New repository secret
```

**Add these 2 secrets:**
- `AWS_ACCESS_KEY_ID` = Your AWS Access Key
- `AWS_SECRET_ACCESS_KEY` = Your AWS Secret Key

## 🚀 **Quick Setup (5 Minutes):**

### **Step 1: AWS Account**
```bash
1. aws.amazon.com pe jao
2. Free account banayein
3. IAM → Users → Create User
4. Programmatic access + AdministratorAccess
5. Access keys copy kar lo
```

### **Step 2: GitHub Secrets**
```bash
1. GitHub repo → Settings → Secrets → Actions
2. Add 2 secrets:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
```

### **Step 3: Run Setup**
```bash
# Windows mein:
test-aws-setup.bat    # Test if everything is ready
setup-aws.bat         # Setup AWS environment
```

### **Step 4: Push Code!**
```bash
git add .
git commit -m "Ready for AWS deployment"
git push origin main
```

## ✅ **What Happens After Push:**

1. **GitHub Actions** automatically triggers
2. **Builds Docker image** 
3. **Pushes to AWS ECR**
4. **Deploys to ECS**
5. **Your app is live on AWS!**

## 🔍 **Test Your Setup:**

```bash
# Run this to test everything:
test-aws-setup.bat
```

## 🆘 **Common Issues:**

### **AWS CLI Not Working:**
```bash
aws configure
# Enter your credentials
```

### **GitHub Actions Not Triggering:**
- Check if `.github/workflows/deploy.yml` exists
- Verify secrets are added correctly

### **Terraform Errors:**
- Run `setup-aws.bat` first
- Check if AWS credentials are correct

## 💰 **Cost:**
- **Free Tier**: First 12 months free
- **After Free Tier**: ~$40-75/month
- **Pay per use**: Only pay for what you use

## 🎯 **Final Checklist:**

- [ ] AWS account created
- [ ] IAM user with access keys
- [ ] GitHub secrets added
- [ ] `setup-aws.bat` run successfully
- [ ] Code pushed to main branch

**Agar sab ✅ hai, to aapka app automatically AWS pr deploy ho jayega! 🚀**

---

*Need help? Check `AWS_DEPLOYMENT_GUIDE.md` for detailed instructions*
