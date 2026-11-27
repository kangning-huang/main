# Website readership on /reach

`/reach` can show a rolling window of recorded website traffic. The homepage does not.

The page reads `src/data/website-readership.json`. Until that file is a valid snapshot, the section is not rendered. The committed file starts as `status: "unavailable"`. Zeros are not shown.

## What is counted

Cloudflare zone analytics, dataset `httpRequestsAdaptiveGroups`, for complete UTC days in a rolling 30-day window (shorter if the zone retains less).

- Hosts: `kangning-huang.com` and `www.kangning-huang.com` only. `stats.kangning-huang.com` and every other hostname on the zone are excluded.
- Requests: end-user traffic (`requestSource: eyeball`), HTTP 200, content type Cloudflare classifies as HTML.
- Visits: Cloudflare's session count on that same set. A visit is a page view from another site, or a direct request with no referrer. It is not a person and not a unique visitor.
- Pageviews: the count of those HTML responses.

The job keeps the best bot filter the token can actually query: Cloudflare bot decisions when most requests are classified, otherwise verified-bot category and known automated browser names. That filter is incomplete. The page labels the figures as recorded traffic.

A failed run does not replace the last successful snapshot. The caption uses the dates stored in the snapshot. Do not paste dashboard totals into the JSON. The October–November 2026 dashboard totals included automated clients and are not a snapshot.

## Secret

Repository secret: `CLOUDFLARE_ANALYTICS_TOKEN`

Create a custom Cloudflare API token:

- Permission: Zone → Analytics → Read
- Zone resources: only `kangning-huang.com`
- No account-wide access, no edit permissions

`CLOUDFLARE_ZONE_ID` in `.github/workflows/update-website-readership.yml` is the zone tag, not a credential. Do not put the token in the repository or in client code.

The workflow runs daily at 01:15 UTC from `main`, and can be started by hand. After a successful commit it dispatches the GitHub Pages deploy. A token push from Actions does not start that deploy by itself.

## Check

```bash
node --experimental-strip-types --test scripts/website-readership.test.ts
```
