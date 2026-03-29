# Azure Conventions

## Naming Convention
Follow the [Cloud Adoption Framework naming](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming):
- `<resource-type>-<workload>-<environment>-<region>-<instance>`
- Examples: `rg-webapp-prod-eastus-001`, `vnet-hub-prod-eastus-001`

## Resource Abbreviations
| Resource | Prefix |
|----------|--------|
| Resource Group | `rg-` |
| Virtual Network | `vnet-` |
| Subnet | `snet-` |
| Network Security Group | `nsg-` |
| Public IP | `pip-` |
| Load Balancer | `lb-` |
| Application Gateway | `agw-` |
| Storage Account | `st` (no hyphens) |
| Key Vault | `kv-` |
| AKS Cluster | `aks-` |
| App Service | `app-` |
| Function App | `func-` |
| SQL Database | `sqldb-` |
| Cosmos DB | `cosmos-` |
| Log Analytics | `log-` |
| Managed Identity | `id-` |

## Security Patterns
- Use Managed Identity (`SystemAssigned` or `UserAssigned`) for service-to-service auth
- Enable Private Endpoints for PaaS services
- Use Azure Key Vault for secrets, certificates, and keys
- Enable Microsoft Defender for Cloud on subscriptions
- Use Azure Policy for governance guardrails
- Enable diagnostic settings to Log Analytics workspace

## Networking
- Hub-spoke topology for multi-workload environments
- Use Azure Firewall or NVA in hub for centralized egress
- NSGs on every subnet (deny-all inbound by default, allow specific)
- Use Service Endpoints or Private Endpoints for PaaS access
- Enable DDoS Protection on production VNets

## Terraform Provider
```hcl
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}
```
