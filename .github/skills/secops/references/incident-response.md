# Incident Response

## Phases (NIST SP 800-61)

### 1. Preparation
- Maintain asset inventory and network diagrams
- Ensure logging is enabled across all environments
- Document escalation paths and on-call rotations
- Maintain runbooks for common incident types
- Verify backup and recovery procedures

### 2. Detection & Analysis
- Monitor SIEM for alerts (Sentinel, GuardDuty, Chronicle)
- Triage: determine severity (P1-Critical, P2-High, P3-Medium, P4-Low)
- Collect evidence:
  - Cloud audit logs (Activity Log, CloudTrail, Cloud Audit Logs)
  - Network flow logs
  - Application logs
  - Resource configuration snapshots
- Establish timeline of events

### 3. Containment
**Short-term:**
- Revoke compromised credentials immediately
- Isolate affected VMs/containers (modify NSG/SG to deny-all)
- Disable compromised service accounts / managed identities
- Block malicious IPs at firewall/WAF level

**Long-term:**
- Move to clean infrastructure if needed
- Rotate all potentially exposed secrets
- Update detection rules to catch variant attacks

### 4. Eradication
- Remove unauthorized resources (crypto miners, backdoors)
- Patch exploited vulnerabilities
- Remove persistence mechanisms (scheduled tasks, cron jobs, IAM backdoors)
- Verify no lateral movement occurred

### 5. Recovery
- Restore from verified clean backups
- Rebuild compromised systems from IaC (don't patch in place)
- Gradually restore network access with monitoring
- Validate system integrity before returning to production

### 6. Post-Incident
- Conduct blameless post-mortem within 48 hours
- Document: timeline, root cause, impact, remediation steps
- Update runbooks and detection rules
- Share lessons learned with team
- Track remediation items to completion

## SIEM Query Examples

### Azure Sentinel (KQL)
```kql
// Failed sign-in attempts from multiple locations
SigninLogs
| where ResultType != "0"
| summarize FailureCount = count(), Locations = make_set(Location) by UserPrincipalName, bin(TimeGenerated, 1h)
| where FailureCount > 10 and array_length(Locations) > 3
```

### AWS CloudWatch Logs Insights
```
// Unauthorized API calls
fields @timestamp, eventName, errorCode, userIdentity.arn
| filter errorCode = "AccessDenied" or errorCode = "UnauthorizedAccess"
| stats count() as errorCount by userIdentity.arn, eventName
| sort errorCount desc
```

### GCP Cloud Logging
```
// IAM policy changes
resource.type="project"
protoPayload.methodName="SetIamPolicy"
severity>=WARNING
```

## Severity Matrix

| Severity | Criteria | Response Time |
|----------|----------|---------------|
| P1 - Critical | Active data breach, production down, ransomware | 15 min |
| P2 - High | Compromised credentials, unauthorized access | 1 hour |
| P3 - Medium | Policy violation, misconfiguration detected | 4 hours |
| P4 - Low | Informational, minor violation | Next business day |
