# Pipeline Security

## Authentication — No Long-Lived Secrets

### Preferred: OIDC / Workload Identity Federation
- GitHub Actions → Azure/AWS/GCP via OIDC
- Azure DevOps → Azure via Workload Identity service connections
- Eliminates need for client secrets or access keys
- Tokens are short-lived and scoped to specific workflows

### If OIDC Not Available
- Use service connections with minimal scope
- Rotate credentials on a regular schedule (90 days max)
- Store in platform secret store (GitHub Secrets, Azure Key Vault, etc.)

## Secret Management
- Never echo secrets in logs (`::add-mask::` in GitHub Actions)
- Never pass secrets as command-line arguments (visible in process list)
- Use environment-scoped secrets over repository-scoped
- Audit secret access regularly
- Rotate secrets after any suspected exposure

## Supply Chain Security

### Pin Dependencies
```yaml
# Good — pinned by SHA
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

# Acceptable — pinned by version
- uses: actions/checkout@v4

# Bad — mutable tag
- uses: actions/checkout@main
```

### Container Image Integrity
- Pin images by digest: `image@sha256:abc123...`
- Sign images with cosign or Notation
- Only pull from trusted registries
- Scan images before deployment

### Dependency Scanning
- Enable Dependabot / Renovate for automatic updates
- Run SCA tools in pipeline (Snyk, Trivy, npm audit)
- Fail pipeline on critical/high vulnerabilities
- Review and merge dependency updates promptly

## Pipeline Hardening

### Least-Privilege Permissions
```yaml
# GitHub Actions — always set explicit permissions
permissions:
  contents: read
  packages: write
  id-token: write
  # Never use: permissions: write-all
```

### Branch Protection
- Require pull request reviews before merging
- Require status checks to pass
- Require signed commits (where feasible)
- Restrict who can push to main/release branches
- No force pushes to protected branches

### Self-Hosted Runners
- Ephemeral runners preferred (destroy after each job)
- Isolate runners by environment (don't share prod/dev runners)
- Keep runner software updated
- Monitor runner activity and audit logs
- Use dedicated service accounts with minimal permissions

## Security Scanning In Pipeline

### Recommended Stage Order
```
lint → build → unit-test → sast → sca → container-scan → iac-scan → deploy
```

### Tool Matrix
| Scan Type | Tools |
|-----------|-------|
| SAST | CodeQL, SonarQube, Semgrep |
| SCA | Dependabot, Snyk, Trivy, npm audit |
| Container | Trivy, Grype, Snyk Container |
| IaC | tfsec, Checkov, KICS, Trivy |
| Secrets | Gitleaks, TruffleHog, GitHub Secret Scanning |
| DAST | OWASP ZAP, Nuclei |

### Fail Criteria
- **Block deployment**: Critical and High vulnerabilities
- **Warn only**: Medium vulnerabilities
- **Info**: Low vulnerabilities
- Configure exception process for false positives

## Artifact Security
- Sign build artifacts (Sigstore, GPG)
- Use content-addressable storage (by hash, not name)
- Generate SBOM (Software Bill of Materials) with each release
- Store artifacts in immutable registry
- Verify artifact integrity before deployment
