# Footy Calendar

A simple AFL + AFLW calendar subscription site. Static HTML/CSS/JavaScript, one Vercel Node.js function, no runtime dependencies, accounts or database.

Both competitions and all 18 clubs are selected by default. Visitors can select multiple clubs and competitions, then narrow by venue, season stage and home/away. Filters combine across categories; selecting two clubs includes either club. Copy the resulting `/calendar.ics` URL into a calendar app to subscribe. The URL carries the selection, so no user records need storing.

## Run

Node.js 24:

```sh
npm run build
npm run dev
```

Open http://localhost:3000. Run `npm test` for calendar/feed checks.

## Fixture changes by pull request

`data/fixtures.json` is the source of truth. Edit it in a branch, run `npm test && npm run build`, then raise a PR. Vercel previews each branch; merging to `main` publishes the update once the GitHub repository is connected in Vercel. Configure the GitHub check as required to prevent merging invalid data.

Optional importer, run locally (no automatic schedule):

```sh
npm run fixtures:update -- 2026
```

This reads [Fixture Download](https://fixturedownload.com/sport/aussie-rules), an unofficial source. Review changes against [the official AFL fixture](https://www.afl.com.au/fixture) before merging. It excludes unknown-team/venue placeholders, preserves existing missing matches, and retains event IDs and timestamps for unchanged matches. New seasons are added alongside old seasons. Confirm a future season's source round numbering before importing: the 2026 AFL source numbers Opening Round as 1 and finals from 26; AFLW finals start at 13.

Keep `id` stable when rescheduling a match. Update `start` (UTC), `modified` (UTC) and increment `sequence` whenever an existing event changes. For a cancellation, keep the event and set `status` to `cancelled`, update `modified` and increment `sequence`. Do not delete the event; subscribers need its cancellation record. The importer must be reviewed carefully around manually cancelled matches, since the provider has no cancellation flag. `npm run build` validates records and copies them to `public/fixtures.json` for the preview.

A club subscription continues into future seasons as those fixtures are committed. Past matches stay in the feed to preserve identity/history. The preview displays upcoming matches only. Start times use UTC and calendar apps show local time, including daylight saving. End times are estimates: three hours AFL, two hours AFLW. Calendar apps choose their own refresh frequency; changes are not immediate. Google can take a day or longer. Subscribe by URL; importing a file does not update automatically. Changing filters creates a different subscription: remove the old calendar if replacing it.

## Deploy

Import this repository into Vercel, framework **Other**, build command `npm run build`, output directory `public`. The `api/calendar.js` function and `/calendar.ics` rewrite are configured by `vercel.json`. No environment variables needed. Set production deployment protection to public so calendar apps can fetch the feed without signing in. Use the stable production domain for subscription URLs, not an expiring or protected preview URL.

Or use `vercel --prod` from this directory. Connect Git integration with `vercel git connect` for automatic deployment on merge.

## API

`GET /calendar.ics` (also `/api/calendar`) returns RFC 5545 iCalendar with stable UIDs, modification timestamps, sequence numbers, CRLF and UTF-8 line folding. Supports HEAD, ETag conditional requests and a five-minute shared cache. No external requests happen when a calendar app refreshes.

Optional query parameters: `competition=afl,aflw`, `teams=carlton,collingwood`, `venue=MCG`, `stage=regular,finals`, `side=home,away`. Omitted filters include all values (including future additions); an explicitly empty filter includes none. Unknown values return HTTP 400. The URL reflects the currently selected filters and can also be shared to restore the same page selection.
