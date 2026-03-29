---
name: secops
description: "Security operations, threat detection, vulnerability remediation, compliance, and hardening. Use when reviewing security configurations, writing detection rules, incident response runbooks, SIEM queries, scanning for misconfigurations, or hardening Azure, AWS, or GCP environments."
argument-hint: "Describe the security task (e.g., 'harden AKS cluster', 'write Sentinel detection rule')"
---

# Security Operations

## When to Use
- Security configuration review or hardening
- Writing detection/alerting rules (Sentinel, GuardDuty, SCC, CloudWatch)
- Incident response planning and forensics
- Compliance assessments (CIS benchmarks, SOC2, PCI-DSS, HIPAA, ISO 27001)
- Vulnerability scanning and remediation
- Secret rotation and credential management
- Network security review (firewall rules, NSGs, security groups)

## Security Domains
1. **Identity & Access** — IAM, RBAC, authentication, authorization, MFA
2. **Network** — Firewalls, segmentation, WAF, DDoS, VPN, zero trust
3. **Data** — Encryption, key management, DLP, classification
4. **Compute** — Container security, VM hardening, serverless security
5. **Logging & Monitoring** — SIEM, audit logs, alerting, forensics
6. **Governance** — Policies, compliance, standards enforcement

## Procedure

### 1. Assess
1. Identify the security domain and scope
2. Determine applicable compliance frameworks
3. Check current posture against CIS benchmarks for the target cloud
4. Review [compliance checks](./references/compliance-checks.md)

### 2. Detect
1. Identify threat vectors relevant to the workload
2. Write detection rules using cloud-native SIEM:
   - **Azure**: KQL queries for Microsoft Sentinel
   - **AWS**: CloudWatch Logs Insights, GuardDuty custom threat lists
   - **GCP**: Chronicle YARA-L rules, SCC custom modules
3. Configure alerting with appropriate severity levels
4. Ensure alert-to-incident workflow is defined

### 3. Harden
1. Apply [hardening guides](./references/hardening-guides.md) for specific services
2. Follow least-privilege principle for all identity configurations
3. Enable encryption at rest and in transit
4. Disable unused services and ports
5. Apply network segmentation

### 4. Respond
1. Follow [incident response](./references/incident-response.md) procedures
2. Contain — isolate affected resources
3. Eradicate — remove threat actor access
4. Recover — restore from known-good state
5. Post-mortem — document lessons learned

## Cloud Security Tools

| Domain | Azure | AWS | GCP |
|--------|-------|-----|-----|
| Posture | Defender for Cloud | Security Hub | Security Command Center |
| SIEM | Sentinel | Security Lake + OpenSearch | Chronicle |
| Threat Detection | Defender alerts | GuardDuty | SCC Premium |
| Policy | Azure Policy | AWS Config Rules | Organization Policy |
| Secret Management | Key Vault | Secrets Manager | Secret Manager |
| WAF | Azure WAF | AWS WAF | Cloud Armor |
| Identity | Entra ID | IAM Identity Center | Cloud Identity |
| Container Security | Defender for Containers | Inspector + ECR scanning | GKE Security Posture |

## Quick Checks
- [ ] MFA enabled for all human identities
- [ ] No overly permissive IAM roles (e.g., `*` actions, admin to all)
- [ ] No public storage (S3 buckets, Azure blobs, GCS buckets)
- [ ] Encryption at rest enabled on all data stores
- [ ] Audit logging enabled and shipped to central SIEM
- [ ] Network allows only required traffic (deny-all default)
- [ ] Secrets stored in vault/manager — not in code or env vars
- [ ] Container images scanned and signed
- [ ] Regular patching cadence in place
