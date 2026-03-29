# AWS Conventions

## Naming Convention
- `<workload>-<environment>-<resource-type>-<qualifier>`
- Examples: `webapp-prod-vpc`, `webapp-prod-ecs-cluster`
- Use tags for metadata (Name tag for console display)

## Security Patterns
- Use IAM Roles with least-privilege policies — never use long-lived access keys
- Use AWS Organizations with SCPs for guardrails
- Enable CloudTrail in all regions (multi-region trail)
- Enable GuardDuty for threat detection
- Enable AWS Config for compliance monitoring
- Use AWS Secrets Manager or SSM Parameter Store for secrets
- Enable VPC Flow Logs
- Use KMS customer-managed keys for sensitive workloads

## Networking
- Use VPC with public and private subnets across multiple AZs
- NAT Gateway in public subnet for private subnet egress
- Security Groups: stateful, least-privilege rules
- NACLs: additional layer for subnet-level filtering
- VPC Endpoints (Gateway for S3/DynamoDB, Interface for other services)
- Transit Gateway for multi-VPC connectivity

## IAM Best Practices
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalOrgID": "o-xxxxxxxxxxxx"
        }
      }
    }
  ]
}
```

## Terraform Provider
```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Project     = var.project_name
    }
  }
}
```

## Common Services
| Service | Use Case |
|---------|----------|
| ECS/EKS | Container workloads |
| Lambda | Event-driven serverless |
| RDS/Aurora | Relational databases |
| DynamoDB | NoSQL key-value store |
| S3 | Object storage |
| CloudFront | CDN |
| ALB/NLB | Load balancing |
| SQS/SNS | Messaging |
| EventBridge | Event routing |
