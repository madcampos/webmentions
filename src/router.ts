import { ErrorResponse, STATUS_CODES } from './utils.ts';

export type RequestHandler = (request: Request, env: Env, context: ExecutionContext) => Promise<Response> | Response;

export type HTTPMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

interface StaticSiteHandlerOptions {
	routes?: {
		method: HTTPMethod,
		route: string,
		handler: RequestHandler
	}[];
	fallbackRoute?: RequestHandler;
}

export class Router {
	#routes: Record<HTTPMethod, { pattern: URLPattern, handler: RequestHandler }[]> = {
		GET: [],
		HEAD: [],
		POST: [],
		PUT: [],
		DELETE: [],
		OPTIONS: [],
		PATCH: []
	};
	#fallbackRoute: RequestHandler;

	constructor({ routes, fallbackRoute }: StaticSiteHandlerOptions = {}) {
		this.#fallbackRoute = fallbackRoute ?? (() => new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } }));

		routes?.forEach(({ method, route, handler }) => {
			const methodRoutes = this.#routes[method];

			methodRoutes.push({
				pattern: new URLPattern({ pathname: route }),
				handler
			});
		});
	}

	get(route: string, handler: RequestHandler) {
		this.#routes.GET.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	head(route: string, handler: RequestHandler) {
		this.#routes.HEAD.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	post(route: string, handler: RequestHandler) {
		this.#routes.POST.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	put(route: string, handler: RequestHandler) {
		this.#routes.PUT.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	delete(route: string, handler: RequestHandler) {
		this.#routes.DELETE.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	options(route: string, handler: RequestHandler) {
		this.#routes.OPTIONS.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	patch(route: string, handler: RequestHandler) {
		this.#routes.PATCH.push({
			pattern: new URLPattern({ pathname: route }),
			handler
		});
	}

	async fetch<CfHostMetadata = unknown>(request: Request<CfHostMetadata, IncomingRequestCfProperties<CfHostMetadata>>, env: Env, context: ExecutionContext) {
		try {
			const resolvedUrl = new URL(request.url);
			// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unsafe-type-assertion
			const methodRoutes = this.#routes[request.method.toUpperCase() as HTTPMethod];
			const { pattern, handler } = methodRoutes.find(({ pattern: curPattern }) => curPattern.test(resolvedUrl.href)) ?? {};

			if (!pattern || !handler) {
				return await this.#fallbackRoute(request, env, context);
			}

			return await handler(request, env, context);
		} catch (err) {
			if (err instanceof ErrorResponse) {
				return err;
			}

			if (err instanceof Error) {
				return new ErrorResponse(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
			}

			return new ErrorResponse('Oops...', STATUS_CODES.INTERNAL_SERVER_ERROR);
		}
	}
}
