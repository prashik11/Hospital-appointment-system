# Dev and production deployment

The Render service is the **development/demo** environment and deploys the `dev` branch. The VPS and public domain are **production** and must deploy the `main` branch. Never point both environments at the same MongoDB database or use production patient data for demos.

## Environment separation

| Setting | Render development | VPS production |
| --- | --- | --- |
| Git branch | `dev` | `main` |
| Database | Dev-only Atlas database and database user | Prod-only Atlas database and database user |
| Public URL | Render URL | `https://YOUR_DOMAIN.in` |
| Secrets | Render service Environment panel | `/etc/shree-pharma-clinic.env` on VPS |

Best isolation is separate Atlas projects/clusters for dev and production. If budget requires one cluster, use two databases and two database users with access scoped to only their own database. Do not reuse a password or URI between environments. In Atlas, allow the Render egress addresses only on the dev database and the VPS static IPv4 `/32` only on production. Avoid `0.0.0.0/0`.

## Render dev service

`render.yaml` configures the `dev` branch and the Node version. In the Render service's **Environment** panel, set:

- `MONGO_URI`: dev-only Atlas URI/database and dev-only database user.
- `CLIENT_ORIGIN`: the exact Render HTTPS origin, for example `https://your-service.onrender.com`.
- Keep `NODE_ENV=production`, `HOSPITAL_TIME_ZONE=Asia/Kolkata`, and `TRUST_PROXY=1` as configured. Render is the one trusted proxy in this setup.

Deploy `dev`, wait for the health check to pass, then verify booking and admin functions with fake data. Free Render services may sleep and are only for development/demo use.

## Production VPS setup

Use a supported Ubuntu LTS image. Keep Node on the same pinned 24.x release as `.node-version`; the version currently pinned here is `24.22.3`. Install Node from an official Node.js distribution/package source, then confirm `node --version` and `npm --version`.

1. In the VPS provider panel, note the static public IPv4. Connect using an SSH key. Create a non-root deploy account named `shreeclinic`; disable password SSH only after key login has been confirmed.
2. Update Ubuntu and install Nginx, Git, and UFW. Allow SSH, HTTP (80), and HTTPS (443) in UFW and the VPS provider firewall. Do not expose port 5000 publicly.
3. In BigRock DNS, point the root domain (`@`) to the VPS IPv4 with an A record. Point `www` to the root domain with a CNAME, or add an A record to the same IPv4. Do not publish an AAAA record unless IPv6 is configured on the VPS.
4. Create a **production-only** Atlas database and database user. Add only the VPS public IPv4 as `/32` in the production Atlas IP access list. Enable Atlas backups and test a restore before relying on them.
5. Clone the GitHub repository under `/var/www/shree-pharma-clinic` and check out `main`. Install dependencies and build the frontend:

   ```bash
   sudo mkdir -p /var/www/shree-pharma-clinic
   sudo chown shreeclinic:shreeclinic /var/www/shree-pharma-clinic
   sudo -u shreeclinic git clone https://github.com/prashik11/Hospital-appointment-system.git /var/www/shree-pharma-clinic
   sudo -u shreeclinic git -C /var/www/shree-pharma-clinic checkout main
   sudo -u shreeclinic npm ci --prefix /var/www/shree-pharma-clinic/client --include=dev
   sudo -u shreeclinic npm ci --prefix /var/www/shree-pharma-clinic/server --omit=dev
   sudo -u shreeclinic env VITE_GRAPHQL_URL=/graphql npm run build --prefix /var/www/shree-pharma-clinic/client
   ```

6. Copy `deploy/production.env.example` to `/etc/shree-pharma-clinic.env`; replace every placeholder. Set the actual HTTPS domain in `CLIENT_ORIGIN`, and use the production Atlas URI. Set `HOST=127.0.0.1`, so Node accepts traffic only from local Nginx. Protect the real environment file with `sudo chown root:root /etc/shree-pharma-clinic.env` and `sudo chmod 600 /etc/shree-pharma-clinic.env`. Never put secrets in Git, chat, shell command arguments, or screenshots.
7. For the initial admin only, temporarily add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the protected production env file. Run the one-time job and then immediately remove those two entries:

   ```bash
   sudo systemd-run --wait --pipe --collect --uid=shreeclinic --property=WorkingDirectory=/var/www/shree-pharma-clinic/server --property=EnvironmentFile=/etc/shree-pharma-clinic.env /usr/bin/node src/utils/createAdmin.js
   ```

   Use a unique password of 12–72 characters. Seed doctor/department records only after confirming the env file contains the production URI:

   ```bash
   sudo systemd-run --wait --pipe --collect --uid=shreeclinic --property=WorkingDirectory=/var/www/shree-pharma-clinic/server --property=EnvironmentFile=/etc/shree-pharma-clinic.env /usr/bin/node src/utils/seedDoctors.js
   ```

   Review the seed script before running it. It creates or updates the clinic's starter doctor/department records.
8. Install `deploy/shree-pharma-clinic.service` as `/etc/systemd/system/shree-pharma-clinic.service`; install `deploy/nginx-shree-pharma-clinic.conf` as an Nginx site after replacing the domain. Enable and start the service, check `/healthz` locally, run `nginx -t`, and reload Nginx. The service runs as the non-root `shreeclinic` user.
9. After DNS resolves to the VPS, issue a Let's Encrypt certificate with Certbot's Nginx integration for both root and `www` hostnames. Confirm HTTPS works and HTTP redirects to HTTPS. `CLIENT_ORIGIN` must match the hostname patients actually use; if both are served directly, list both HTTPS origins separated by a comma.
10. Open the domain and test home, doctor list, booking, admin login, status changes, logout, and PDF/print using fake patient data. Confirm MongoDB has the production database name. Check `sudo journalctl -u shree-pharma-clinic -n 100 --no-pager` for startup errors.

### Production secrets template

`deploy/production.env.example` is only a template. Keep `/etc/shree-pharma-clinic.env` on the VPS, outside the repository. The real `MONGO_URI` must include the intended production database name. URL-encode special characters in the database password. The app does not need the Atlas console/admin account; it needs a database user scoped to the application's production database.

### Updates after launch

Merge reviewed changes into `main`, then deploy only from `main` on the VPS. Before updating: take/verify a backup, fetch and fast-forward `main`, install locked dependencies, rebuild the client, and restart the systemd service. Keep Render on `dev` and its separate database. Never run destructive migrations or seed commands against production without reviewing their behavior and confirming the production URI.

## Current production readiness limits

- Replace all domain, IP, Atlas, and admin placeholders before deployment.
- Configure external backups and verify a restoration; Atlas currently reports backups inactive in the screenshot shared earlier.
- Start with one VPS instance because the rate limiter and server sessions depend on a single process. Do not scale to multiple Node processes without shared session/rate-limit storage.
- Run dependency/security review on the exact `main` commit before launch. The deployment config does not guarantee that clinical/privacy/legal obligations are met; review those separately for the clinic's use case.
