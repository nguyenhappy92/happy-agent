# Hardening Guides

## Kubernetes / AKS / EKS / GKE

### Cluster Level
- Enable RBAC (default on managed clusters)
- Use managed identity / IRSA / Workload Identity for pod-to-cloud auth
- Enable network policies (Calico or Azure NPM)
- Restrict API server access (authorized IP ranges or private cluster)
- Enable audit logging
- Keep cluster version current (N-1 policy)
- Use dedicated node pools for system and workload pods

### Pod Level
```yaml
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
```

### Admission Control
- Enable Pod Security Admission (PSA) or OPA Gatekeeper / Kyverno
- Enforce: no privileged containers, no host networking, no root
- Require resource limits on all containers
- Restrict image registries to trusted sources

---

## Container Images
- Use minimal base images (distroless, alpine, scratch)
- Pin image versions by digest, not tag
- Scan images in CI/CD pipeline (Trivy, Snyk, Grype)
- Sign images (cosign / Notation)
- No secrets baked into images
- Multi-stage builds to reduce attack surface

---

## Virtual Machines

### Linux
- Disable root SSH login (`PermitRootLogin no`)
- Use SSH keys only (`PasswordAuthentication no`)
- Enable unattended security updates
- Configure firewall (iptables/nftables/ufw) — deny all, allow specific
- Disable unused services
- Enable auditd for system call logging
- Mount /tmp with noexec,nosuid,nodev

### Windows
- Enable Windows Defender / endpoint protection
- Configure Windows Firewall with default deny
- Apply Group Policy security baselines
- Enable PowerShell script block logging
- Disable SMBv1
- Enable BitLocker / disk encryption

---

## Databases

### General
- No public endpoints — use private endpoints/links
- Enable TLS for all connections (minimum TLS 1.2)
- Enable encryption at rest (TDE or storage-level)
- Enable audit logging
- Use managed identity for application authentication
- Regular automated backups with encryption
- Enable Advanced Threat Detection where available

### SQL-Specific
- Disable `sa` / admin account for applications
- Enable dynamic data masking for sensitive columns
- Use row-level security where applicable
- Enable Transparent Data Encryption (TDE)

---

## Storage

### Azure Storage
```bash
# Deny public blob access
az storage account update --name $ACCOUNT --allow-blob-public-access false
# Require secure transfer
az storage account update --name $ACCOUNT --https-only true
# Enable soft delete
az storage blob service-properties delete-policy update --account-name $ACCOUNT --enable true --days-retained 30
```

### AWS S3
```bash
# Block all public access
aws s3api put-public-access-block --bucket $BUCKET --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
# Enable versioning
aws s3api put-bucket-versioning --bucket $BUCKET --versioning-configuration Status=Enabled
# Enable default encryption
aws s3api put-bucket-encryption --bucket $BUCKET --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'
```

### GCS
```bash
# Set uniform bucket-level access
gcloud storage buckets update gs://$BUCKET --uniform-bucket-level-access
# Prevent public access
gcloud storage buckets update gs://$BUCKET --no-public-access-prevention
```

---

## Networking
- Default deny all inbound traffic
- Allow only required ports and protocols
- Use WAF for public-facing web applications
- Enable DDoS protection on production environments
- Use bastion hosts or just-in-time access for management
- Segment networks by workload sensitivity
- Log all network flows
