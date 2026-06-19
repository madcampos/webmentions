# Deploying to Cloudflare

Deploying to Cloudflare requires a little setup. The general steps are as follows:

1. Copy wrangler config
2. Run migrations
3. Run deploy command

## Copy wrangler config

To start, make a copy of `wrangler.template.json` and rename it to `wrangler.json`.

Then fill in the information on the fields with brackets (`[]`). They are:
- `[YOUR DOMAIN]`: The domain name you want to publish the code.
- `[YOUR DB ID]`: The database ID provided by Cloudflare for the D1 database. Refer to their docs on [how to create a new database](https://developers.cloudflare.com/d1/get-started/#2-create-a-database).
- `[YOUR SITE ORIGINS]`: The list of origins to allow webmentions to be sent to. If the origin don't match, the webmentions will be blocked. It is a semi-colon separated list. E.g.: `foo.com;bar.com;baz.com`.
- `[YOUR SITE ORIGINS]`: The list of paths to allow webmentions to be sent to. If the path don't start with one of those strings, the webmentions will be blocked. It is a semi-colon separated list. E.g.: `/foo/;/bar;/baz.html`.

## Run migrations

Migrations are ran on remote similar to local, with a slightly diferent command: `db:migrations:remote`.

## Run deploy command

run the `deploy` command to deploy it to Cloudflare.
