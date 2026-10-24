# Cloudflare SEO / security for kangning-huang.com

The site is a **GitHub Pages** static export fronted by **Cloudflare**. Custom
response headers and true HTTP 301s cannot be set from the Next.js `output:
"export"` build. Apply the following in the Cloudflare dashboard for zone
`kangning-huang.com`. Repo-side, `scripts/seo-static-aliases.mjs` only emits
HTML stubs so `/research/` does not 404 while these rules are pending.

## 1. Always Use HTTPS + HSTS

1. SSL/TLS → **Overview**: encryption mode **Full (strict)** (GitHub Pages has a valid cert).
2. SSL/TLS → **Edge Certificates**:
   - **Always Use HTTPS**: On
   - **HTTP Strict Transport Security (HSTS)**: Enable  
     - Max Age Header: `12 months` (or `6 months` first)  
     - Include subdomains: On (covers `flood.` / `cooling.` if they share the zone)  
     - Preload: optional  
     - No-Sniff header: On

Confirm with:

```bash
curl -sI http://kangning-huang.com/ | head -5   # expect 301 → https://
curl -sI https://kangning-huang.com/ | rg -i strict-transport
```

## 2. Redirect trailing slash and `.html` to clean URLs

**Rules** → **Redirect Rules** → Create rule (or Bulk Redirects).

Suggested dynamic redirects (preserve query string):

| Name | When | Then |
|------|------|------|
| Strip trailing slash | URI Path matches regex `^/(.+)/$` and not a real file | 301 to `concat("/", rtrim(http.request.uri.path, "/"))` + query |
| Strip `.html` | URI Path matches regex `^/(.+)\.html$` | 301 to `concat("/", regex_replace(http.request.uri.path, "\\.html$", ""))` |

Exclude asset paths if needed (`/_next/`, `/videos/`, `/atlas/` data files).

Goal after deploy:

- `https://kangning-huang.com/research/` → **301** → `/research`
- `https://kangning-huang.com/research.html` → **301** → `/research`
- Canonicals and sitemap stay on clean paths (no slash, no `.html`).

## 3. Security headers (Transform Rule)

**Rules** → **Transform Rules** → **Modify Response Header** → Create rule  
If: `Hostname equals kangning-huang.com` (and `www` if used)  
Then set:

| Header | Value |
|--------|--------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Optional later: a tight `Content-Security-Policy` once GA / MapLibre / Substack embeds are inventoried.

## 4. www → apex

Already observed as 301 apex. Keep a Redirect Rule or Cloudflare "www" setup so `www.kangning-huang.com` → `https://kangning-huang.com`.

## Checklist for the parent / Ken

- [ ] Always Use HTTPS On  
- [ ] HSTS enabled (and header visible on HTTPS responses)  
- [ ] Trailing-slash 301 rule  
- [ ] `.html` 301 rule  
- [ ] Security header Transform Rule  
- [ ] Re-check with `curl -sI` after DNS/cache settle  
