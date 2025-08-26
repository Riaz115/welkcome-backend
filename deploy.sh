#!/bin/bash

# Welkome Backend AWS Deployment Script
# This script automates the deployment of your application to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="monkmaze-backend"
AWS_REGION="ap-south-1"
TERRAFORM_DIR="terraform"
# Allow overriding cluster/service via env for CI
CLUSTER_NAME="${CLUSTER_NAME:-monkmaze-cluster}"
SERVICE_NAME="${SERVICE_NAME:-monkmaze-service}"
# ECS waiter tunables (AWS CLI v2 supports these flags)
ECS_WAIT_DELAY_SEC="${ECS_WAIT_DELAY_SEC:-15}"
ECS_WAIT_MAX_SEC="${ECS_WAIT_MAX_SEC:-1800}"

echo -e "${GREEN}🚀 Starting Welkome Backend Deployment to AWS${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}📋 Checking requirements...${NC}"
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements are met${NC}"
}

# Check AWS credentials
check_aws_credentials() {
    echo -e "${YELLOW}🔐 Checking AWS credentials...${NC}"
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS credentials are valid${NC}"
}

# Build and push Docker image
build_and_push_image() {
    echo -e "${YELLOW}🐳 Building and pushing Docker image...${NC}"
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Get ECR repository URI
    ECR_REPO_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text 2>/dev/null || echo "")
    
    if [ -z "$ECR_REPO_URI" ]; then
        echo -e "${YELLOW}⚠️  ECR repo '$PROJECT_NAME' not found. Creating it now...${NC}"
        aws ecr create-repository --repository-name "$PROJECT_NAME" --region "$AWS_REGION" >/dev/null
        ECR_REPO_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
        echo -e "${GREEN}✅ ECR repository created: $ECR_REPO_URI${NC}"
    fi
    
    # Build image
    docker build -t $PROJECT_NAME .
    
    # Tag and push
    docker tag $PROJECT_NAME:latest $ECR_REPO_URI:latest
    docker push $ECR_REPO_URI:latest
    
    echo -e "${GREEN}✅ Docker image built and pushed successfully${NC}"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️  Deploying infrastructure with Terraform...${NC}"
    
    cd $TERRAFORM_DIR
    
    # Initialize Terraform
    echo -e "${YELLOW}📦 Initializing Terraform...${NC}"
    terraform init -input=false
    
    # Plan deployment
    echo -e "${YELLOW}📋 Planning deployment...${NC}"
    terraform plan -input=false -out=tfplan
    
    # Apply changes
    echo -e "${YELLOW}🚀 Applying infrastructure changes...${NC}"
    terraform apply -input=false -auto-approve tfplan
    
    cd ..
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
}

# Update ECS service
update_ecs_service() {
    echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
    
    # Force new deployment
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$SERVICE_NAME" \
        --force-new-deployment \
        --region $AWS_REGION
    
    echo -e "${GREEN}✅ ECS service updated successfully${NC}"
}

# Wait for deployment to complete
print_service_diagnostics() {
    echo -e "${YELLOW}🧪 Collecting ECS diagnostics...${NC}"
    aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$AWS_REGION" --query 'services[0].events[0:15]' --output table || true
    TASK_ARNS=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$AWS_REGION" --desired-status RUNNING --query 'taskArns' --output text || echo "")
    if [ -n "$TASK_ARNS" ]; then
        aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks $TASK_ARNS --region "$AWS_REGION" --query 'tasks[].{LastStatus:lastStatus,Desired:desiredStatus,StoppedReason:stoppedReason,Containers:containers[].{Name:name,ExitCode:exitCode,Reason:reason}}' --output table || true
    else
        echo -e "${YELLOW}ℹ️  No RUNNING tasks. Checking STOPPED tasks...${NC}"
        STOPPED_ARNS=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --service-name "$SERVICE_NAME" --region "$AWS_REGION" --desired-status STOPPED --query 'taskArns[0:5]' --output text || echo "")
        [ -n "$STOPPED_ARNS" ] && aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks $STOPPED_ARNS --region "$AWS_REGION" --query 'tasks[].{StoppedReason:stoppedReason,Containers:containers[].{Name:name,ExitCode:exitCode,Reason:reason}}' --output table || true
    fi
}

wait_for_deployment() {
    echo -e "${YELLOW}⏳ Waiting for deployment to complete (max ${ECS_WAIT_MAX_SEC}s)...${NC}"
    set +e
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "$SERVICE_NAME" \
        --region "$AWS_REGION" \
        --delay "$ECS_WAIT_DELAY_SEC" \
        --max-wait "$ECS_WAIT_MAX_SEC"
    STATUS=$?
    set -e
    if [ $STATUS -ne 0 ]; then
        echo -e "${RED}❌ ECS service did not reach STABLE within the allotted time.${NC}"
        print_service_diagnostics
        exit $STATUS
    fi
    echo -e "${GREEN}✅ Deployment completed successfully${NC}"
}

# Get application URL
get_app_url() {
    echo -e "${YELLOW}🌐 Getting application URL...${NC}"
    
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names monkmaze-alb \
        --region $AWS_REGION \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ALB_DNS" ]; then
        echo -e "${GREEN}🎉 Your application is now live at: http://$ALB_DNS${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve load balancer DNS name${NC}"
    fi
}

# Main deployment function
main() {
    check_requirements
    check_aws_credentials
    
    # Non-interactive infra deploy for CI: set DEPLOY_INFRA=true to enable
    if [[ "${DEPLOY_INFRA:-false}" == "true" ]]; then
        deploy_infrastructure
    else
        echo -e "${YELLOW}ℹ️  Skipping Terraform (set DEPLOY_INFRA=true to enable).${NC}"
    fi
    
    # Build and push image
    build_and_push_image
    
    # Update ECS service
    update_ecs_service
    
    # Wait for deployment
    wait_for_deployment
    
    # Get application URL
    get_app_url
    
    echo -e "${GREEN}🎊 Deployment completed successfully!${NC}"
}

# Run main function
main "$@"
