---
description: "Use when working with cloud infrastructure, Terraform, Kubernetes, Docker, Helm, Ansible, Bicep, CloudFormation, or any DevOps/SecOps task on Azure, AWS, or GCP."
applyTo: ["**/*.tf", "**/*.bicep", "**/*.yaml", "**/*.yml", "**/Dockerfile*", "**/*.json", "**/*.sh", "**/*.hcl", "**/*.tfvars"]
---

# Cloud DevOps & SecOps Standards

## Security Defaults
- Always follow least-privilege for IAM/RBAC
- Never hardcode credentials, keys, or secrets — use managed identities, workload identity, or secret managers
- Encrypt data at rest and in transit
- Enable audit logging on all services
- No public access to storage or databases unless explicitly justified

## Infrastructure
- Tag all cloud resources: environment, owner, cost-center, project, managed-by
- Use Terraform for multi-cloud, Bicep for Azure-only
- Prefer managed services over self-hosted
- Use remote state with locking for all IaC

## Containers
- Use distroless or minimal base images
- Run as non-root, read-only filesystem, drop all capabilities
- Pin image versions by digest or exact tag
- Scan images for vulnerabilities before deployment

## CI/CD
- Use OIDC / workload identity — no long-lived credentials
- Pin action/image versions
- Include security scanning (SAST, SCA, container scan) in pipeline
- Require approval gates for production deployments
