export async function checkHTMLIncludesDest(response: Response, sourceUrl: URL, destUrl: URL) {
	const responseClone = response.clone();
	const htmlRewriter = new HTMLRewriter();

	const urlsForLinks: URL[] = [];

	htmlRewriter.on(
		'a, link, embed, iframe, track, source, video, audio, img, image',
		new (class LinkHandler implements HTMLRewriterElementContentHandlers {
			element(element: HTMLElement) {
				const url = element.getAttribute('href') ?? element.getAttribute('src') ?? '';

				// INFO: set `sourceUrl` as the base url to handle relative links and such.
				if (URL.canParse(url, sourceUrl)) {
					urlsForLinks.push(new URL(url, sourceUrl));
				}
			}
		})()
	);

	const transformedResponse = htmlRewriter.transform(responseClone);
	// INFO: we need to consume the response body for the handlers to be called.
	await transformedResponse.arrayBuffer();

	const matchingUrls = urlsForLinks.filter((link) => {
		const doesProtocolMatch = link.protocol === destUrl.protocol;
		const doesHostnameMatch = link.hostname === destUrl.hostname;
		const doesPathMatch = link.pathname === destUrl.pathname;

		return doesProtocolMatch && doesHostnameMatch && doesPathMatch;
	});

	return matchingUrls[0] !== undefined;
}

export async function checkTextIncludesDest(response: Response, destUrl: URL) {
	const responseClone = response.clone();

	const text = await responseClone.text();

	return text.includes(`${destUrl.origin}${destUrl.pathname}`);
}

export async function checkJSONIncludesDest(response: Response, destUrl: URL) {
	const responseClone = response.clone();

	try {
		const json = await responseClone.json();

		const search = (obj: unknown): boolean => {
			if (typeof obj === 'string') {
				if (URL.canParse(obj)) {
					const url = new URL(obj);
					return (
						url.protocol === destUrl.protocol &&
						url.hostname === destUrl.hostname &&
						url.pathname === destUrl.pathname
					);
				}
				return obj === destUrl.toString();
			}

			if (Array.isArray(obj)) {
				return obj.some(search);
			}

			if (typeof obj === 'object' && obj !== null) {
				return Object.values(obj).some(search);
			}

			return false;
		};

		return search(json);
	} catch (err) {
		console.error(err);

		return false;
	}
}
