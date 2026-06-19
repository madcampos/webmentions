# Dependencies

## Tools

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [D1](https://developers.cloudflare.com/d1/)
- [`pnpm`](https://pnpm.io/)
- [`node.js`](https://nodejs.org/)
- (optional) [`mise`](https://mise.jdx.dev/)

## Managing node versions

The recomended way to manage `node` and `pnpm` versions is using [`mise`](https://mise.jdx.dev/).

Install it and follow it's guide to install `node` and `pnpm`

## Project dependencies

Run the follwoing command to install the project dependencies.

```bash
pnpm install --frozen-lockfile
```

Then run the `bootstrap` command to generate types for the server.

```bash
pnpm run bootstrap
```

## Copy wrangler config

Make a copy of `wrangler.template.json` and rename it to `wrangler.json`. This will provide the needed configuration to run the dev server.
