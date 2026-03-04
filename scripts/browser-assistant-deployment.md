# TrafficGenius — Browser Assistant Deployment Script
# ═══════════════════════════════════════════════════
#
# Step-by-step instructions for a web browser assistant to execute
# GUI-based deployment and configuration actions for the production
# environment at https://trafficgenius.topnetworks.co
#
# Prerequisites:
#   - Google Cloud Console access (project owner or editor role)
#   - Google Cloud OAuth Consent Screen configured
#   - Domain trafficgenius.topnetworks.co DNS provisioned
#
# ─────────────────────────────────────────────────────────────────

## PHASE 1: Google Cloud OAuth — Add Production Redirect URI

1. Navigate to https://console.cloud.google.com/apis/credentials
2. Select the correct GCP project from the project dropdown at the top.
3. Under "OAuth 2.0 Client IDs", click the OAuth client used by TrafficGenius.
4. In the "Authorized JavaScript origins" section:
   - Click "ADD URI".
   - Enter: `https://trafficgenius.topnetworks.co`
   - Confirm the development origin `http://localhost:3080` is also present.
5. In the "Authorized redirect URIs" section:
   - Click "ADD URI".
   - Enter: `https://trafficgenius.topnetworks.co/api/auth/callback/google`
   - Confirm the development redirect `http://localhost:3080/api/auth/callback/google` is also present.
6. Click "SAVE" at the bottom of the page.
7. Verify: Both origins and both redirect URIs should now be listed.

## PHASE 2: Google Cloud OAuth Consent Screen — Add Production Domain

1. Navigate to https://console.cloud.google.com/apis/credentials/consent
2. Click "EDIT APP".
3. Under "Authorized domains":
   - Verify `topnetworks.co` is listed.
   - If not, add it and click "ADD DOMAIN".
4. Click "SAVE AND CONTINUE" through all steps until completion.

## PHASE 3: Cloud DNS — Verify A/CNAME Record for trafficgenius.topnetworks.co

1. Navigate to https://console.cloud.google.com/net-services/dns/zones
2. Select the DNS zone for `topnetworks.co`.
3. Verify one of the following records exists:
   - **A record**: `trafficgenius.topnetworks.co` → `<PRODUCTION_SERVER_IP>`
   - **CNAME record**: `trafficgenius.topnetworks.co` → `<LOAD_BALANCER_HOSTNAME>`
4. If the record does not exist:
   - Click "ADD STANDARD" (or "ADD RECORD SET").
   - Type: A (or CNAME depending on architecture).
   - DNS name: `trafficgenius`
   - IPv4 address (or canonical name): Enter the production server IP or LB hostname.
   - TTL: 300 seconds.
   - Click "CREATE".
5. Wait for propagation (typically 1-5 minutes for Cloud DNS).

## PHASE 4: GCP Secret Manager — Store Production Secrets

1. Navigate to https://console.cloud.google.com/security/secret-manager
2. Create or update the following secrets:

   ### Secret: `trafficgenius-auth-secret`
   - Click "CREATE SECRET" (or edit existing).
   - Name: `trafficgenius-auth-secret`
   - Value: Generate a strong random string (min 32 chars). Use: `openssl rand -base64 32`
   - Click "CREATE SECRET".

   ### Secret: `trafficgenius-auth-google-id`
   - Name: `trafficgenius-auth-google-id`
   - Value: The Google OAuth Client ID from Phase 1.

   ### Secret: `trafficgenius-auth-google-secret`
   - Name: `trafficgenius-auth-google-secret`
   - Value: The Google OAuth Client Secret from Phase 1.

   ### Secret: `trafficgenius-database-url`
   - Name: `trafficgenius-database-url`
   - Value: `postgresql://USER:PASSWORD@CLOUD_SQL_IP:5432/traffic_genius?sslmode=require`
     (Replace USER, PASSWORD, CLOUD_SQL_IP with actual production values.)

3. Grant the Compute Engine default service account (or the app's SA) the
   "Secret Manager Secret Accessor" role for each secret.

## PHASE 5: Compute Engine / VM — Set Environment Variables

> Skip this phase if deploying to a platform that manages env vars natively (Vercel, Cloud Run).

1. SSH into the production VM or navigate to:
   https://console.cloud.google.com/compute/instances
2. Click the production instance → "EDIT".
3. Under "Custom metadata", add key-value pairs:
   ```
   AUTH_SECRET          = (value from Secret Manager)
   AUTH_GOOGLE_ID       = (value from Secret Manager)
   AUTH_GOOGLE_SECRET   = (value from Secret Manager)
   AUTH_URL             = https://trafficgenius.topnetworks.co
   DATABASE_URL         = (value from Secret Manager)
   GCP_PROJECT_ID       = <your-project-id>
   NEXT_PUBLIC_APP_URL  = https://trafficgenius.topnetworks.co
   NEXT_PUBLIC_ENABLE_LOGGING = false
   NODE_ENV             = production
   ```
4. Alternatively, create a `.env` file on the VM at the project root with these values.
5. Click "SAVE".

## PHASE 6: SSL Certificate — Verify HTTPS

1. Navigate to https://console.cloud.google.com/net-services/loadbalancing/advanced/sslCertificates/list
   (or check Let's Encrypt if self-hosted).
2. Verify a valid SSL certificate exists for `trafficgenius.topnetworks.co`.
3. If using a Google-managed certificate:
   - Confirm status is "ACTIVE".
   - Confirm the domain matches `trafficgenius.topnetworks.co`.
4. If no certificate exists:
   - Click "CREATE SSL CERTIFICATE".
   - Type: "Google-managed".
   - Domain: `trafficgenius.topnetworks.co`.
   - Click "CREATE".
   - Wait for provisioning (up to 15-60 minutes).

## PHASE 7: Build & Restart Production Application

> If using SSH / PM2 on Compute Engine:

1. SSH into the production VM.
2. Navigate to the project directory.
3. Execute in order:
   ```bash
   git fetch origin main
   git checkout main
   git pull origin main
   npm install --production
   npm run build
   pm2 restart traffic-genius || pm2 start npm --name traffic-genius -- start
   ```
4. Verify the process is running:
   ```bash
   pm2 status traffic-genius
   curl -I https://trafficgenius.topnetworks.co
   ```
   Expected: HTTP/2 200 with `strict-transport-security` header.

## PHASE 8: Smoke Test — Verify Production Deployment

1. Open a browser and navigate to: `https://trafficgenius.topnetworks.co`
2. Verify:
   - [ ] Page loads without errors.
   - [ ] HTTPS padlock is shown (valid certificate).
   - [ ] Redirected to `/login` (unauthenticated).
3. Click "Sign in with Google".
4. Verify:
   - [ ] Google OAuth consent screen appears.
   - [ ] Redirect URI matches `https://trafficgenius.topnetworks.co/api/auth/callback/google`.
   - [ ] After login, redirected to `/dashboard`.
5. Navigate to `/dashboard` and verify:
   - [ ] KPI cards load with data.
   - [ ] Charts render correctly.
   - [ ] No console errors in DevTools.
6. Test Cloud Armor page:
   - [ ] Navigate to `/dashboard/cloud-armor`.
   - [ ] Policies list loads.
7. Verify security headers by running in DevTools Console:
   ```javascript
   fetch(window.location.href).then(r => {
     console.log('HSTS:', r.headers.get('strict-transport-security'));
     console.log('X-Frame-Options:', r.headers.get('x-frame-options'));
     console.log('X-Content-Type-Options:', r.headers.get('x-content-type-options'));
   });
   ```

## PHASE 9: Verify Development Environment Still Works

1. On your local machine, ensure `.env.local` has:
   ```
   AUTH_URL=http://localhost:3080
   NEXT_PUBLIC_APP_URL=http://localhost:3080
   ```
2. Run:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3080` and verify the login flow works.
4. Confirm Google OAuth callback uses `http://localhost:3080/api/auth/callback/google`.

─────────────────────────────────────────────────────────────────
END OF BROWSER ASSISTANT SCRIPT
─────────────────────────────────────────────────────────────────
