# Compliance Checks

## CIS Benchmarks — Key Controls

### Identity & Access Management
- [ ] MFA enforced for all console/portal users
- [ ] No root/global admin accounts used for daily operations
- [ ] Service accounts use least-privilege roles
- [ ] Unused credentials disabled/removed (90-day threshold)
- [ ] Password policy: minimum 14 chars, complexity required
- [ ] API keys rotated regularly or replaced with managed identity

### Logging & Monitoring
- [ ] Cloud audit logging enabled in all regions
- [ ] Log storage immutable (write-once, no delete)
- [ ] Logs shipped to central SIEM
- [ ] Alerts configured for critical events:
  - Root/admin login
  - IAM policy changes
  - Network configuration changes
  - Resource deletion
  - Failed authentication spikes

### Networking
- [ ] Default VPC/VNet not used for production
- [ ] No 0.0.0.0/0 ingress rules on SSH (22) or RDP (3389)
- [ ] Flow logs enabled on all VPCs/VNets
- [ ] Unused security groups / NSG rules removed
- [ ] DNS logging enabled

### Data Protection
- [ ] Encryption at rest enabled (server-side) on all storage
- [ ] Encryption in transit enforced (TLS 1.2+)
- [ ] Public access blocked on storage by default
- [ ] Key rotation policy configured
- [ ] Backup encryption enabled

### Compute
- [ ] Auto-updates enabled or patching policy in place
- [ ] No instances with public IPs unless required (use bastion/LB)
- [ ] Container images from trusted registries only
- [ ] Container runtime: non-root, read-only filesystem where possible
- [ ] Secrets not stored in environment variables or code

## Framework Mapping

| Control | SOC2 | PCI-DSS | HIPAA | ISO 27001 |
|---------|------|---------|-------|-----------|
| MFA | CC6.1 | 8.3 | 164.312(d) | A.9.4.2 |
| Encryption at rest | CC6.1 | 3.4 | 164.312(a)(2)(iv) | A.10.1.1 |
| Audit logging | CC7.2 | 10.1 | 164.312(b) | A.12.4.1 |
| Access review | CC6.2 | 7.1.2 | 164.308(a)(4) | A.9.2.5 |
| Incident response | CC7.3 | 12.10 | 164.308(a)(6) | A.16.1.1 |
| Network segmentation | CC6.6 | 1.3 | 164.312(e)(1) | A.13.1.3 |

## Automated Scanning

### Azure
```bash
# Defender for Cloud secure score
az security secure-scores list --query "[0].{Score:currentScore, Max:maxScore}"

# Policy compliance
az policy state summarize
```

### AWS
```bash
# Security Hub findings
aws securityhub get-findings --filters '{"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' --query 'Findings[].{Title:Title,Severity:Severity.Label}'

# Config compliance
aws configservice describe-compliance-by-config-rule
```

### GCP
```bash
# SCC findings
gcloud scc findings list organizations/$ORG_ID --filter="state=\"ACTIVE\"" --format="table(finding.category,finding.severity,finding.resourceName)"
```
