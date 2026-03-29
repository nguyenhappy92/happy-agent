---
name: cicd-pipelines
description: "Build, test, and deploy pipelines for GitHub Actions, Azure DevOps, GitLab CI, or Jenkins. Use when creating CI/CD workflows, configuring deployment stages, container builds, artifact management, pipeline security, or automating infrastructure deployments."
argument-hint: "Describe the pipeline task (e.g., 'GitHub Actions workflow to deploy to AKS')"
---

# CI/CD Pipelines

## When to Use
- Creating or modifying CI/CD pipeline definitions
- Configuring build, test, scan, deploy stages
- Container image builds and registry pushes
- Pipeline security and secret management
- Infrastructure deployment automation (Terraform in CI/CD)
- Release management and approval workflows

## Platform Selection
- **GitHub-hosted repos**: GitHub Actions (preferred)
- **Azure DevOps org**: Azure Pipelines
- **GitLab-hosted repos**: GitLab CI
- **Multi-platform / legacy**: Jenkins

## Procedure

### 1. Pipeline Structure
1. Define stages: `lint` → `build` → `test` → `scan` → `deploy-staging` → `approve` → `deploy-prod`
2. Use reusable workflows/templates to avoid duplication
3. Pin all action/image versions by SHA or exact version
4. Reference platform guides:
   - [GitHub Actions](./references/github-actions.md)
   - [Azure DevOps](./references/azure-devops.md)
   - [Pipeline Security](./references/pipeline-security.md)

### 2. Authentication
1. Use OIDC / Workload Identity Federation — no long-lived secrets
2. Scope credentials to specific environments
3. Use environment-level secrets (not repository-level when possible)

### 3. Build & Test
1. Cache dependencies for faster builds
2. Run unit tests and integration tests
3. Generate and publish code coverage reports
4. Fail the pipeline on test failures

### 4. Security Scanning
1. SAST — static analysis (CodeQL, SonarQube, Semgrep)
2. SCA — dependency scanning (Dependabot, Snyk, Trivy)
3. Container scanning — image vulnerabilities (Trivy, Grype)
4. Secret scanning — detect leaked credentials
5. IaC scanning — Terraform/Bicep misconfigs (tfsec, Checkov, KICS)

### 5. Deployment
1. Use environment protection rules with required reviewers for production
2. Implement blue-green or canary deployment strategies
3. Include smoke tests post-deployment
4. Automatic rollback on health check failure

### 6. Pipeline Checklist
- [ ] No secrets echoed in logs
- [ ] All action/image versions pinned
- [ ] OIDC / workload identity for cloud auth
- [ ] Security scanning in pipeline
- [ ] Environment protection rules on production
- [ ] Branch protection with required reviews
- [ ] Artifacts signed and stored securely
- [ ] Pipeline timeout configured
