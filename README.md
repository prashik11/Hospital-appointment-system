# Hospital Appointment System

React and Vite frontend with an Express, Apollo GraphQL, and MongoDB backend.

## Local setup

1. Copy `server/.env.example` to `server/.env` and set the MongoDB URI and a unique admin password of 12 to 72 characters.
2. Copy `client/.env.example` to `client/.env` if the GraphQL API is not at the default local URL. Vite reads client environment files from the `client` project root.
3. In `server`, run `npm install`, then `node src/utils/createAdmin.js` once to create the first admin.
4. Start the API with `npm run dev` from `server`.
5. In another terminal, run `npm install` and `npm run dev` from `client`.

Never commit `.env` files. The server and client ignore them; only the `.env.example` templates belong in Git.

## Production configuration

Set these server variables in the hosting provider's secret/configuration panel:

- `NODE_ENV=production`
- `MONGO_URI` with a database-specific account that has only the permissions this app needs
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the one-time admin creation command
- `CLIENT_ORIGIN` as the exact HTTPS frontend origin (comma-separated only if several are intentionally trusted)
- `HOSPITAL_TIME_ZONE` to the hospital's IANA time zone, such as `Asia/Kolkata`
- `TRUST_PROXY=1` only when exactly one trusted reverse proxy sits in front of Express
- `COOKIE_SAME_SITE=lax` normally; use `none` only for a cross-site frontend/API deployment, and only over HTTPS

Use HTTPS for both frontend and API. Prefer frontend and API hostnames under the same site so browsers accept the secure admin cookie without third-party-cookie settings. Restrict MongoDB network access to the application host, use a dedicated database user, enable encrypted backups, and test restoration. Configure the frontend hosting provider to send a restrictive Content-Security-Policy and other browser security headers; those headers must be set where the built frontend is served.

The in-process rate limiter protects a single server process. If the API is run on multiple instances, configure a shared rate-limit store or enforce equivalent limits at a trusted gateway/WAF. Do not trust forwarded client IP headers unless `TRUST_PROXY` matches the actual proxy topology.

## Security behavior

- Admin sessions are random, revocable server-side sessions. The browser receives only an `HttpOnly` cookie; session tokens are hashed in MongoDB and never returned in GraphQL.
- Admin requests require a live session and an active `ADMIN` account. Sessions expire after 12 hours and logout revokes the session.
- Admin passwords must be at least 12 characters when created or changed. The management page can change a password after verifying the current one; password changes revoke every admin session.
- CORS and cookie-authenticated request origins are restricted to `CLIENT_ORIGIN`; production requires HTTPS origins.
- Login, booking, and GraphQL requests are rate-limited; GraphQL batches are disabled, production introspection is disabled, request bodies are capped, and appointment list results are bounded.
- Appointment dates, times, IDs, and text lengths are validated by the API. A unique MongoDB index reserves each active doctor/time slot so simultaneous requests cannot book the same slot.
- At startup, the API checks old active appointments, backfills their slot keys, and creates the unique index. If historical active appointments already share a slot, startup stops and requires a human to resolve those duplicates before retrying.
- To inspect such a conflict without displaying patient details, run `npm run diagnose:slots` from `server`. It reports the doctor, slot, appointment IDs, statuses, and creation times.
- Patient fields are not written to server logs. Unexpected GraphQL errors return a generic message rather than database or stack details.

For security incidents, rotate affected credentials, invalidate sessions by deleting the relevant `AdminSession` records, inspect provider/database access logs, and restore from a known-good backup if data integrity is in doubt.
