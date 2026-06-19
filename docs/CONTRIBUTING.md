# Contibution Guide

This guide assumes you have basic knowledge with `typescript`, `node`, `npm`/`pnpm`, and `git`.

## Project structure

The project has a simple file structure, all files are on the `src` directory, with test beside them (with a `.test` suffix).
Files are organized in rough groups by what they do, and the entrypoing is `index.ts`.

## Linting and formatting

The project uses `oxlint` and `typescript` for linting and `dprint` for formatting.

The commands are:
- `lint`: runs both of the individual linting commands.
- `lint:js`: runs `oxlint`.
- `typecheck`: runs `typescript` to type check the project.
- `format`: formats the files.

## Testing

Testing is done with `vitest`. The tests try to always check the "happy paths" and also all the "unhappy" paths covered by the code in general. Code coverage is targeted at ~75%.

To run tests use the `test` command.

## Migrations

To apply migrations to the database run the `db:migrations:local` command.
This will ensure all tables are created.

## Making changes to the code

- Please add tests to the code you change and ensure none of the existing tests fail.
- Try to keep changes concise and do small edits. Specially important when using LLMs.
- Create a feature branch for the changes and open a PR with them.
