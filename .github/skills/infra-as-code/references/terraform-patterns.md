# Terraform Patterns

## Module Structure
```
modules/<name>/
├── main.tf          # Resource definitions
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── versions.tf      # Provider and terraform version constraints
├── locals.tf        # Computed local values
└── README.md        # Module documentation
```

## Naming Conventions
- Resources: `<provider>_<resource>` (e.g., `azurerm_resource_group`)
- Variables: `snake_case`, descriptive with `description` and `type`
- Outputs: `snake_case`, with `description`
- Locals: `snake_case`, prefix with purpose
- Module sources: use version pinning (`version = "~> 3.0"`)

## State Backend Examples

### Azure
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "stterraformstate"
    container_name       = "tfstate"
    key                  = "project.terraform.tfstate"
  }
}
```

### AWS
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "project/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### GCP
```hcl
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "project/state"
  }
}
```

## Variable Validation
```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

## Data Sources Over Hardcoding
```hcl
# Good — dynamic lookup
data "azurerm_client_config" "current" {}

# Bad — hardcoded
# subscription_id = "xxxx-xxxx-xxxx"
```

## Lifecycle Rules
```hcl
resource "azurerm_resource_group" "example" {
  lifecycle {
    prevent_destroy = true  # Protect critical resources
  }
}
```

## Conditional Resources
```hcl
resource "azurerm_monitor_diagnostic_setting" "example" {
  count = var.enable_diagnostics ? 1 : 0
  # ...
}
```
