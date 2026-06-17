import { env } from 'cloudflare:workers';
import type { ParsedWebmention } from './parser.ts';

export type WebmentionType = 'comment' | 'mention' | 'reaction' | 'repost' | 'bookmark';

export interface Webmention {
	source: string;
	target: string;
	type: WebmentionType;
	created_at: string;
	updated_at: string | null;
	deleted_at: string | null;
	content: string | null;
	author_name: string | null;
	author_avatar: string | null;
	author_link: string | null;
}

export async function hasExistingMention(source: string, target: string) {
	const { count = 0 } = (await env.Database.prepare(/* sql */ `
		SELECT COUNT(*) as count
		FROM webmentions
		WHERE
			source = ?
			AND target = ?
			AND deleted_at IS NULL
	`).bind(source, target).first<{ count: number }>()) ?? {};

	return count > 0;
}

export async function deleteMention(source: string, target: string) {
	const { success } = await env.Database.prepare(/* sql */ `
		UPDATE webmentions
		SET deleted_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE
			source = ?
			AND target = ?
	`).bind(source, target).run();

	return success;
}

export async function saveWebmention(source: string, webmention: ParsedWebmention) {
	const { success } = await env.Database.prepare(/* sql */ `
		INSERT INTO webmentions
			(
				source, target, type,
				content, author_name, author_avatar, author_link
			)
		VALUES
			(
				?, ?, ?,
				?, ?, ?, ?
			)
		ON CONFLICT(source, target) DO NOTHING
	`).bind(
		source,
		webmention.url,
		webmention.type,
		webmention.content ?? null,
		webmention.author?.name ?? null,
		webmention.author?.avatar ?? null,
		webmention.author?.link ?? null
	).run();

	return success;
}

export async function updateWebmention(source: string, webmention: ParsedWebmention) {
	const { success } = await env.Database.prepare(/* sql */ `
		UPDATE webmentions
		SET
			type = ?,
			content = ?,
			author_name = ?,
			author_avatar = ?,
			author_link = ?,
			updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
		WHERE
			source = ?
			AND target = ?
			AND deleted_at IS NULL
	`).bind(
		webmention.type,
		webmention.content ?? null,
		webmention.author?.name ?? null,
		webmention.author?.avatar ?? null,
		webmention.author?.link ?? null,
		source,
		webmention.url
	).run();

	return success;
}

export async function getRecentOriginMentions(origin: string, windowSize: number) {
	const { results } = await env.Database.prepare(/* sql */ `
		SELECT created_at
		FROM webmentions
		WHERE
			source LIKE ?
			AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT ${windowSize}
	`).bind(`${origin.replaceAll('%', '')}%`).run<Pick<Webmention, 'created_at'>>();

	return results;
}

export async function isOriginBlocked(origin: string) {
	const { count = 0 } = (await env.Database.prepare(/* sql */ `
		SELECT COUNT(*) as count
		FROM blocklist
		WHERE
			origin = ?
	`).bind(origin).first<{ count: number }>()) ?? {};

	return count > 0;
}

export async function blockOrigin(origin: string) {
	const { success } = await env.Database.prepare(/* sql */ `
		INSERT INTO blocklist (origin)
		VALUES (?)
	`).bind(origin).run();

	return success;
}
