# Webmention Worker

This is an implementation of a receiver server for the [Webmention standard](https://www.w3.org/TR/webmention/) using [Cloudflare Workers](https://developers.cloudflare.com/workers/).

## Dependencies

- [Cloudflare Workers](https://developers.cloudflare.com/workers/) (Support for other engines TBD).
- [D1 Database](https://developers.cloudflare.com/d1/) (Support for other databases TBD).
- [pnpm](https://pnpm.io/)
- [node.js](https://nodejs.org/)

## How to

### Configuring tool dependencies

Install `nodejs` and `pnpm`. More instructions are available at [Dependencies Documentation](./docs/DEPENDENCIES.md)

### Installing project dependencies

Run the follwoing command to install the project dependencies.

```bash
pnpm install --frozen-lockfile
```

Then run the `bootstrap` command to generate types for the server.

```bash
pnpm run bootstrap
```

### Copy wrangler config

Make a copy of `wrangler.template.json` and rename it to `wrangler.json`. This will provide the needed configuration to run the dev server.


### Running local migrations

Run migrations locally to initialize the database and create all tables.

```bash
pnpm run db:migrations:local
```

### Start the server

To start the server run:

```bash
pnpm start
```

## Next steps

[Contribution Guide](./docs/CONTRIBUTING.md)
