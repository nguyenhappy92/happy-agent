---
name: infra-as-code
description: "Provision and manage cloud infrastructure with Terraform, Bicep, CloudFormation, or Pulumi. Use when writing IaC modules, configuring resources on Azure, AWS, or GCP, designing networking, IAM policies, storage, Kubernetes clusters, or reviewing infrastructure code."
argument-hint: "Describe the infrastructure to provision (e.g., 'Azure AKS cluster with private endpoint')"
---

# Infrastructure as Code

## When to Use
- Writing or reviewing Terraform modules, Bicep templates, CloudFormation stacks, or Pulumi programs
- Designing cloud networking (VNets, VPCs, subnets, peering, firewalls, load balancers)
- Configuring IAM roles, policies, RBAC, managed identities, service accounts
- Provisioning compute, storage, databases, or messaging services
- Multi-cloud resource provisioning and migration

## Cloud Provider Selection
- **Multi-cloud or AWS/GCP**: Use Terraform with provider-specific modules
- **Azure-only**: Prefer Bicep for native integration; Terraform acceptable
- **AWS-only**: Terraform or CloudFormation (Terraform preferred for consistency)
- **GCP-only**: Terraform with google provider

## Procedure

### 1. Plan
1. Identify target cloud provider(s) and resource types
2. Check for existing modules/patterns in the codebase
3. Determine state backend (remote state with locking)

### 2. Implement
1. Structure code with clear module boundaries
2. Use variables with descriptions and validation rules
3. Use `locals` for computed values — avoid repeated expressions
4. Reference provider conventions:
   - [Terraform patterns](./references/terraform-patterns.md)
   - [Azure conventions](./references/azure-conventions.md)
   - [AWS conventions](./references/aws-conventions.md)
   - [GCP conventions](./references/gcp-conventions.md)

### 3. Security Defaults
- No public access unless explicitly required and documented
- Encrypt at rest and in transit by default
- Use managed identities / IAM roles / workload identity — never hardcode credentials
- Enable diagnostic logging and monitoring on all resources
- Apply network segmentation (private endpoints, service endpoints, VPC endpoints)
- Restrict egress where possible

### 4. Tagging & Organization
Tag all resources with at minimum:
- `environment` (dev, staging, prod)
- `owner` (team or individual)
- `cost-center` (billing allocation)
- `project` (workload name)
- `managed-by` (terraform, bicep, etc.)

### 5. State Management
- **Azure**: Azure Storage Account with blob lease locking
- **AWS**: S3 bucket + DynamoDB table for locking
- **GCP**: GCS bucket with locking
- Always enable state encryption
- Never commit state files to version control

### 6. Review Checklist
- [ ] No hardcoded secrets or credentials
- [ ] Resources tagged appropriately
- [ ] Least-privilege IAM/RBAC applied
- [ ] Encryption enabled (at rest + in transit)
- [ ] Logging and monitoring configured
- [ ] State backend configured with locking
- [ ] Variables have descriptions and sensible defaults
- [ ] Outputs defined for downstream consumers
