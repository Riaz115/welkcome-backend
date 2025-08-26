# 🚀 Welkome Backend AWS Deployment Guide

This guide will help you set up a complete CI/CD pipeline to automatically deploy your Welkome Backend application to AWS whenever you push code to your main branch.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js 18+](https://nodejs.org/)
- [Docker](https://docker.com/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [Terraform](https://terraform.io/)
- [Git](https://git-scm.com/)

## 🔐 AWS Setup

### 1. Create AWS Account
If you don't have an AWS account, create one at [aws.amazon.com](https://aws.amazon.com/)

### 2. Create IAM User
1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following policies:
   - `AdministratorAccess` (for full access) OR
   - Custom policies for ECS, ECR, S3, VPC, etc.

### 3. Configure AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

## 🏗️ Infrastructure Setup

### 1. Create S3 Bucket for Terraform State
```bash
aws s3 mb s3://welkome-terraform-state
aws s3api put-bucket-versioning --bucket welkome-terraform-state --versioning-configuration Status=Enabled
```

### 2. Deploy Infrastructure
```bash
# Navigate to terraform directory
cd terraform

# Create terraform.tfvars file with your values
cat > terraform.tfvars << EOF
aws_region = "us-east-1"
environment = "prod"
mongo_uri = "your_mongodb_connection_string"
aws_access_key = "your_aws_access_key"
aws_secret_key = "your_aws_secret_key"
EOF

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

## 🔑 GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

1. `AWS_ACCESS_KEY_ID` - Your AWS access key
2. `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

## 🚀 Deployment Pipeline

### Automatic Deployment (Recommended)
The GitHub Actions workflow will automatically:
1. Run tests when you create a pull request
2. Build and deploy when you push to main/master branch
3. Build Docker image and push to ECR
4. Deploy to ECS with zero downtime

### Manual Deployment
If you need to deploy manually:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## 📁 Project Structure

```
backend/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── terraform/
│   ├── main.tf                 # AWS infrastructure
│   └── variables.tf            # Terraform variables
├── Dockerfile                  # Production Docker image
├── docker-compose.yml          # Local development
├── deploy.sh                   # Manual deployment script
└── gateway.js                  # Your application
```

## 🌐 What Gets Deployed

### AWS Services Created:
- **VPC** with public/private subnets
- **ECS Cluster** for running containers
- **ECR Repository** for Docker images
- **Application Load Balancer** for traffic distribution
- **S3 Bucket** for file uploads
- **CloudWatch** for logging and monitoring
- **IAM Roles** with proper permissions

### Application Features:
- Auto-scaling based on demand
- Health checks and monitoring
- Secure file uploads to S3
- Load balancing across multiple instances
- Zero-downtime deployments

## 🔄 How It Works

1. **Code Push**: When you push to main/master branch
2. **GitHub Actions**: Automatically triggers the workflow
3. **Build**: Creates Docker image and pushes to ECR
4. **Deploy**: Updates ECS service with new image
5. **Rolling Update**: ECS performs zero-downtime deployment
6. **Health Check**: Load balancer routes traffic to healthy instances

## 📊 Monitoring

### CloudWatch Logs
- Application logs: `/ecs/welkome-backend`
- Access logs via ECS service

### Health Checks
- Load balancer health checks every 30 seconds
- ECS service health monitoring

## 🔧 Customization

### Environment Variables
Update `terraform/variables.tf` to modify:
- AWS region
- Environment name
- Resource names and sizes

### Scaling
Modify ECS service in `terraform/main.tf`:
- CPU and memory allocation
- Desired count (number of instances)
- Auto-scaling policies

### Domain and SSL
Add your domain and SSL certificate:
```hcl
variable "domain_name" {
  description = "Your domain name"
  type        = string
  default     = "yourdomain.com"
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **ECS Service Not Starting**
   - Check CloudWatch logs
   - Verify environment variables
   - Check IAM permissions

2. **Image Pull Errors**
   - Verify ECR repository exists
   - Check ECS execution role permissions

3. **Load Balancer Health Check Fails**
   - Verify application is listening on port 4000
   - Check security group rules

### Debug Commands:
```bash
# Check ECS service status
aws ecs describe-services --cluster welkome-cluster --services welkome-service

# View CloudWatch logs
aws logs tail /ecs/welkome-backend --follow

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

## 💰 Cost Optimization

### Estimated Monthly Costs (us-east-1):
- **ECS Fargate**: $15-30 (2 instances)
- **Application Load Balancer**: $20-25
- **S3**: $1-5 (depending on usage)
- **Data Transfer**: $5-15
- **Total**: $40-75/month

### Cost Reduction Tips:
- Use Spot instances for non-production
- Implement auto-scaling to scale down during low usage
- Use S3 lifecycle policies for old files
- Monitor with AWS Cost Explorer

## 🔒 Security Best Practices

- All secrets stored in AWS Systems Manager Parameter Store
- Private subnets for ECS tasks
- Security groups with minimal required access
- S3 bucket with public access blocked
- IAM roles with least privilege principle

## 📞 Support

If you encounter issues:
1. Check CloudWatch logs first
2. Review GitHub Actions workflow logs
3. Verify AWS service quotas and limits
4. Check Terraform state and outputs

## 🎉 Next Steps

After successful deployment:
1. Test your application endpoints
2. Set up monitoring alerts
3. Configure custom domain (optional)
4. Set up backup strategies
5. Implement CI/CD for other environments (staging, dev)

---

**Happy Deploying! 🚀**

Your Welkome Backend will now automatically deploy to AWS every time you push code!
