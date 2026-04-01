export interface Article {
  id: string;
  title: string;
  tags: string[];
  content: string;
}

export const articles: Article[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    tags: [
      "setup",
      "install",
      "onboarding",
      "account",
      "start",
      "register",
      "signup",
    ],
    content: `# Getting Started

## Creating Your Account
1. Visit our website and click "Sign Up"
2. Enter your email address and create a password
3. Verify your email through the confirmation link
4. Complete your profile setup

## Initial Configuration
- Navigate to Settings → General to configure your workspace
- Invite team members from Settings → Team
- Set up integrations under Settings → Integrations

## Quick Start Checklist
- [ ] Create your account
- [ ] Set up your workspace
- [ ] Invite your team
- [ ] Configure your first integration
- [ ] Review the documentation`,
  },
  {
    id: "billing",
    title: "Billing & Payments",
    tags: [
      "billing",
      "payment",
      "invoice",
      "subscription",
      "plan",
      "pricing",
      "upgrade",
      "downgrade",
      "cancel",
      "refund",
      "charge",
      "cost",
    ],
    content: `# Billing & Payments

## Subscription Plans
- **Free**: Up to 5 users, basic features
- **Pro**: Up to 50 users, advanced features, priority support — $29/user/month
- **Enterprise**: Unlimited users, custom features, dedicated support — contact sales

## Managing Your Subscription
- View current plan: Settings → Billing → Current Plan
- Upgrade/downgrade: Settings → Billing → Change Plan
- Changes take effect at the next billing cycle

## Payment Methods
- Credit/debit cards (Visa, Mastercard, Amex)
- ACH bank transfer (Enterprise only)
- Annual billing available with 20% discount

## Invoices & Receipts
- Invoices are sent to the billing email on the 1st of each month
- Download past invoices from Settings → Billing → Invoice History

## Refund Policy
- Full refund within 14 days of initial purchase
- Pro-rated refunds for annual plan cancellations
- Contact support for refund requests`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Common Issues",
    tags: [
      "error",
      "bug",
      "issue",
      "problem",
      "fix",
      "troubleshoot",
      "broken",
      "not working",
      "help",
      "crash",
      "slow",
      "login",
      "password",
      "reset",
    ],
    content: `# Troubleshooting Common Issues

## Login Problems
- **Forgot password**: Click "Forgot Password" on the login page to receive a reset link
- **Account locked**: After 5 failed attempts, accounts are locked for 15 minutes
- **SSO issues**: Ensure your identity provider is configured correctly in Settings → Security → SSO

## Performance Issues
- Clear your browser cache and cookies
- Try a different browser or incognito/private mode
- Check our status page at status.example.com for known outages
- Disable browser extensions that might interfere

## Integration Errors
- Verify API keys are correct and not expired
- Check that required scopes/permissions are granted
- Review webhook URLs for typos
- Check the integration logs under Settings → Integrations → Logs

## Data & Sync Issues
- Force a sync from Settings → Data → Sync Now
- Check for conflicting records in the activity log
- Ensure your data format matches the required schema

## Still Need Help?
If none of the above resolves your issue, please provide:
1. Steps to reproduce the problem
2. Error messages or screenshots
3. Your browser and OS version`,
  },
  {
    id: "api-reference",
    title: "API Reference",
    tags: [
      "api",
      "endpoint",
      "rest",
      "webhook",
      "integration",
      "token",
      "authentication",
      "rate limit",
      "sdk",
      "developer",
    ],
    content: `# API Reference

## Authentication
All API requests require a Bearer token in the Authorization header:
\`Authorization: Bearer your-api-key\`

Generate API keys from Settings → Developer → API Keys.

## Rate Limits
- Free plan: 100 requests/minute
- Pro plan: 1,000 requests/minute
- Enterprise: 10,000 requests/minute

## Common Endpoints
- \`GET /api/v1/users\` — List users
- \`POST /api/v1/users\` — Create a user
- \`GET /api/v1/projects\` — List projects
- \`POST /api/v1/projects\` — Create a project
- \`GET /api/v1/status\` — Service health check

## Webhooks
Configure webhooks to receive real-time notifications:
1. Go to Settings → Developer → Webhooks
2. Add your endpoint URL
3. Select the events you want to subscribe to
4. Save and test with the "Send Test" button

## SDKs
Official SDKs are available for:
- JavaScript/TypeScript (npm: @happy/sdk)
- Python (pip: happy-sdk)
- Go (go get github.com/happy/sdk-go)`,
  },
  {
    id: "security",
    title: "Security & Compliance",
    tags: [
      "security",
      "privacy",
      "compliance",
      "gdpr",
      "sso",
      "2fa",
      "mfa",
      "encryption",
      "audit",
      "data protection",
    ],
    content: `# Security & Compliance

## Two-Factor Authentication (2FA)
- Enable 2FA from Settings → Security → Two-Factor Authentication
- Supports authenticator apps (Google Authenticator, Authy) and SMS
- Recovery codes are provided during setup — store them securely

## Single Sign-On (SSO)
Available on Pro and Enterprise plans:
- SAML 2.0 support (Okta, Azure AD, OneLogin)
- Configure under Settings → Security → SSO
- Enforce SSO-only login for your organization

## Data Encryption
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- Optional customer-managed encryption keys (Enterprise)

## Compliance
- SOC 2 Type II certified
- GDPR compliant — DPA available on request
- HIPAA compliant (Enterprise plan with BAA)

## Audit Logs
- View all account activity in Settings → Security → Audit Log
- Logs retained for 90 days (Pro) or 1 year (Enterprise)
- Export logs in CSV or JSON format`,
  },
];
