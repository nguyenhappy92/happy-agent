# GCP Conventions

## Naming Convention
- `<resource-type>-<workload>-<environment>-<region>`
- Examples: `vpc-webapp-prod-us-central1`, `gke-api-prod-us-central1`
- Labels for metadata (equivalent to AWS tags / Azure tags)

## Required Labels
- `environment`: dev, staging, prod
- `owner`: team or individual
- `cost-center`: billing allocation
- `managed-by`: terraform

## Security Patterns
- Use Service Accounts with least-privilege IAM roles
- Prefer Workload Identity for GKE pods
- Enable Organization Policy constraints
- Use VPC Service Controls for sensitive data
- Enable Cloud Audit Logs (Admin Activity + Data Access)
- Use Secret Manager for secrets
- Enable Security Command Center (SCC)
- Use Customer-Managed Encryption Keys (CMEK) for sensitive data

## Networking
- Shared VPC for multi-project environments
- Private Google Access for internal-only PaaS access
- Cloud NAT for private instance egress
- Firewall rules with priority-based ordering (deny-all at lowest priority)
- Private Service Connect for Google APIs
- Cloud Armor for WAF / DDoS protection

## IAM Best Practices
- Grant roles at the lowest scope (resource > project > folder > org)
- Use custom roles when predefined roles are too broad
- Avoid primitive roles (Owner, Editor, Viewer) in production
- Use IAM Conditions for fine-grained access

## Terraform Provider
```hcl
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}
```

## Common Services
| Service | Use Case |
|---------|----------|
| GKE | Kubernetes workloads |
| Cloud Run | Serverless containers |
| Cloud Functions | Event-driven serverless |
| Cloud SQL | Managed relational DB |
| Firestore | NoSQL document DB |
| Cloud Storage | Object storage |
| Cloud CDN | Content delivery |
| Cloud Load Balancing | Global/regional LB |
| Pub/Sub | Messaging |
| Eventarc | Event routing |
