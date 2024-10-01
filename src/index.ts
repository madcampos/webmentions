import { Hono } from 'hono';

const app = new Hono();

const INTERNAL_SERVER_ERROR = 500;
const BAD_REQUEST = 400;
const OKAY = 200;

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BASE_URL = new URL('https://madcampos.dev/');
const MANIFEST_URLS: string[] = [];

app.post('/', async (context) => {
	try {
		const data = await context.req.formData();
		const source = data.get('source');
		const target = data.get('tartet');

		if (typeof source !== 'string' || !URL.canParse(source)) {
			throw new Error('Invalid "source"');
		}

		if (typeof target !== 'string' || !URL.canParse(target)) {
			throw new Error('Invalid "target"');
		}

		const parsedSource = new URL(source);
		const parsedTarget = new URL(target);

		if (parsedSource.href === parsedTarget.href) {
			throw new Error('Paradox not accepted');
		}

		if (!ALLOWED_PROTOCOLS.includes(parsedSource.protocol)) {
			throw new Error('Invalid "source" protocol');
		}

		if (!ALLOWED_PROTOCOLS.includes(parsedTarget.protocol)) {
			throw new Error('Invalid "target" protocol');
		}

		if (BASE_URL.host !== parsedTarget.host) {
			throw new Error('Your princess is in another castle');
		}

		if (!MANIFEST_URLS.includes(parsedTarget.pathname)) {
			throw new Error('IDTIMWYTIM');
		}

		// TODO: verify the web mention

		context.status(OKAY);
		return context.text('Your offer was accepted');
	} catch (err) {
		if (err instanceof Error) {
			context.status(BAD_REQUEST);
			return context.text(err.message);
		}

		context.status(INTERNAL_SERVER_ERROR);

		return context.text('Oops...');
	}
});

export default app;
