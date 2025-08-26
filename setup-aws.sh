#!/bin/bash

# Welkome Backend AWS Setup Script
# This script helps you set up the initial AWS environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Welcome to Welkome Backend AWS Setup!${NC}"
echo -e "${BLUE}This script will help you set up your AWS deployment environment.${NC}"
echo

# Check if AWS CLI is configured
check_aws_cli() {
    echo -e "${YELLOW}🔐 Checking AWS CLI configuration...${NC}"
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not configured.${NC}"
        echo -e "${YELLOW}Please run 'aws configure' first with your credentials.${NC}"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    
    echo -e "${GREEN}✅ AWS CLI configured successfully${NC}"
    echo -e "${BLUE}Account ID: ${ACCOUNT_ID}${NC}"
    echo -e "${BLUE}User: ${USER_ARN}${NC}"
    echo
}

# Create S3 bucket for Terraform state
create_terraform_bucket() {
    echo -e "${YELLOW}🪣 Creating S3 bucket for Terraform state...${NC}"
    
    BUCKET_NAME="welkome-terraform-state-${ACCOUNT_ID}"
    
    if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 > /dev/null; then
        echo -e "${GREEN}✅ S3 bucket already exists: ${BUCKET_NAME}${NC}"
    else
        aws s3 mb "s3://${BUCKET_NAME}" --region us-east-1
        aws s3api put-bucket-versioning --bucket "${BUCKET_NAME}" --versioning-configuration Status=Enabled
        echo -e "${GREEN}✅ S3 bucket created: ${BUCKET_NAME}${NC}"
    fi
    
    echo
}

# Update Terraform backend configuration
update_terraform_backend() {
    echo -e "${YELLOW}🔧 Updating Terraform backend configuration...${NC}"
    
    BUCKET_NAME="welkome-terraform-state-${ACCOUNT_ID}"
    
    # Update the backend configuration in main.tf
    sed -i "s/welkome-terraform-state/${BUCKET_NAME}/g" terraform/main.tf
    
    echo -e "${GREEN}✅ Terraform backend updated to use: ${BUCKET_NAME}${NC}"
    echo
}

# Create terraform.tfvars template
create_tfvars_template() {
    echo -e "${YELLOW}📝 Creating terraform.tfvars template...${NC}"
    
    cat > terraform/terraform.tfvars.template << EOF
# AWS Configuration
aws_region = "us-east-1"
environment = "prod"

# Database Configuration
mongo_uri = "your_mongodb_connection_string_here"

# AWS Credentials (these will be stored securely in SSM)
aws_access_key = "your_aws_access_key_here"
aws_secret_key = "your_aws_secret_key_here"

# Optional: Domain Configuration
domain_name = ""
certificate_arn = ""
EOF

    echo -e "${GREEN}✅ terraform.tfvars.template created${NC}"
    echo -e "${YELLOW}⚠️  Please update terraform/terraform.tfvars.template with your actual values${NC}"
    echo
}

# Create .env template
create_env_template() {
    echo -e "${YELLOW}📝 Creating .env template...${NC}"
    
    if [ ! -f .env ]; then
        cp env.example .env
        echo -e "${GREEN}✅ .env file created from env.example${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    fi
    
    echo
}

# Display next steps
show_next_steps() {
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo
    echo -e "${YELLOW}1. Update terraform/terraform.tfvars.template with your values:${NC}"
    echo -e "   - MongoDB connection string"
    echo -e "   - AWS credentials"
    echo -e "   - Any other environment-specific values"
    echo
    echo -e "${YELLOW}2. Rename the template file:${NC}"
    echo -e "   mv terraform/terraform.tfvars.template terraform/terraform.tfvars"
    echo
    echo -e "${YELLOW}3. Deploy infrastructure:${NC}"
    echo -e "   cd terraform"
    echo -e "   terraform init"
    echo -e "   terraform plan"
    echo -e "   terraform apply"
    echo
    echo -e "${YELLOW}4. Set up GitHub Secrets:${NC}"
    echo -e "   - Go to your GitHub repository"
    echo -e "   - Settings > Secrets and variables > Actions"
    echo -e "   - Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo
    echo -e "${YELLOW}5. Push your code to trigger the first deployment!${NC}"
    echo
    echo -e "${GREEN}🚀 Your Welkome Backend will then automatically deploy to AWS!${NC}"
    echo
}

# Main setup function
main() {
    echo -e "${BLUE}Starting AWS setup...${NC}"
    echo
    
    check_aws_cli
    create_terraform_bucket
    update_terraform_backend
    create_tfvars_template
    create_env_template
    
    echo -e "${GREEN}✅ AWS setup completed successfully!${NC}"
    echo
    
    show_next_steps
}

# Run main function
main "$@"
