# Azure DevOps Pipelines

## YAML Pipeline Structure
```yaml
trigger:
  branches:
    include:
      - main
  paths:
    exclude:
      - '**.md'

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: common-variables    # Variable group from Library

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: UseDotNet@2
            inputs:
              version: '8.x'
          - script: dotnet build
            displayName: 'Build'

  - stage: DeployStaging
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployToStaging
        environment: staging
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploy to staging"

  - stage: DeployProd
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployToProd
        environment: production    # Has approval gate
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploy to production"
```

## Service Connections
- Use Workload Identity Federation (recommended) or Service Principal
- Scope to specific resource groups / subscriptions
- Never store credentials in pipeline variables directly

## Azure Service Connection (Workload Identity)
```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: 'my-service-connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      az account show
```

## Templates (Reusable)
```yaml
# templates/deploy-template.yml
parameters:
  - name: environment
    type: string
  - name: serviceConnection
    type: string

steps:
  - task: AzureWebApp@1
    inputs:
      azureSubscription: ${{ parameters.serviceConnection }}
      appName: 'app-${{ parameters.environment }}'
```

Usage:
```yaml
steps:
  - template: templates/deploy-template.yml
    parameters:
      environment: staging
      serviceConnection: my-service-connection
```

## Container Build
```yaml
- task: Docker@2
  inputs:
    containerRegistry: 'my-acr-connection'
    repository: 'myapp'
    command: 'buildAndPush'
    Dockerfile: '**/Dockerfile'
    tags: |
      $(Build.BuildId)
      latest
```

## Terraform in Azure Pipelines
```yaml
- task: TerraformInstaller@1
  inputs:
    terraformVersion: 'latest'

- task: TerraformCLI@2
  inputs:
    command: 'init'
    backendType: 'azurerm'
    backendServiceArm: 'my-service-connection'
    backendAzureRmResourceGroupName: 'rg-tfstate'
    backendAzureRmStorageAccountName: 'stterraformstate'
    backendAzureRmContainerName: 'tfstate'
    backendAzureRmKey: 'project.tfstate'

- task: TerraformCLI@2
  inputs:
    command: 'plan'
    environmentServiceName: 'my-service-connection'

- task: TerraformCLI@2
  inputs:
    command: 'apply'
    environmentServiceName: 'my-service-connection'
```

## Best Practices
- Use environments with approval gates for production
- Store secrets in Azure Key Vault, reference via variable groups
- Use pipeline caching for dependencies
- Set pipeline timeout (`timeoutInMinutes`)
- Use `condition` to control stage/job execution
- Enable pipeline retention policies
