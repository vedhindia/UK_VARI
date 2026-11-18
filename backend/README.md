# Admin password reset

The admin sign-in page includes a **Forgot password?** link. Password recovery
uses the admin email address and sends a one-time reset link by SMTP.

## Configuration

Add these values to `backend/.env` (do not commit real credentials):

```env
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-app-password
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_FROM_NAME=BookStore Admin
```

Use the SMTP host, port, username, password/app password, and permitted sender
address supplied by your email provider. Port 465 uses implicit TLS; other
ports use the normal SMTP connection. In production, set `FRONTEND_URL` to
the public HTTPS origin of the deployed frontend.

For Gmail, use `smtp.gmail.com` and port `587`, set `SMTP_USER` and
`SMTP_FROM_EMAIL` to the Gmail account authorized to send, and use a Google
**App Password** for `SMTP_PASS` (not the normal account password). Google
requires 2-Step Verification before an App Password can be created. Other
providers may require different SMTP values or sender verification.

Start the backend normally after setting these values. On startup, Sequelize
creates the `admin_password_resets` table if it does not exist, so the MySQL
user configured for the backend must have permission to create tables. The
reset table stores only a SHA-256 hash of each random token, along with its
admin and expiry time.

## User flow

1. The admin opens `/admin/login`, selects **Forgot password?**, and submits
   the email used for their active admin account.
2. The API responds with the same confirmation for unknown and active-account
   email addresses. For an active account it sends a link to
   `/admin/reset-password?token=...`.
3. The link expires after 30 minutes and can be used once. Requesting another
   link invalidates prior links for that admin.
4. The admin chooses a password of at least 12 characters and returns to sign
   in with the new password. Reset requests are rate limited.

SMTP delivery errors are logged by the backend and reported as a temporary
request failure. When required settings are missing, the backend log names the
missing environment variables but never logs their values. Configure SMTP
before enabling this feature in production.
