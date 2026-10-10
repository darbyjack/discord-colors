# Discord Colors

A fast, client-side Discord ANSI text generator. Create rainbow text or customize individual characters with Discord-supported colors, backgrounds, bold, and underline, then copy a complete `ansi` code block into Discord.

Inspired by [kkrypt0nn's ANSI guide](https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06).

## Features

- Five one-click text color presets, including rainbow.
- Select words in the text input to format just those characters, or click a character in the preview to edit it individually. With nothing selected, formatting applies to the whole message.
- Eight foreground colors, eight background colors, bold, underline, and clear/reset actions.
- A Discord-style live preview and copy-ready ANSI output with real ESC characters.
- Adjacent characters with matching styles share one ANSI escape sequence, saving message length.
- Counts the complete Discord message against the standard 2,000-character limit.
- Responsive design; no accounts, tracking, database, backend, or external font requests.

**Compatibility:** Discord ANSI formatting displays on supported desktop clients, but mobile Discord clients generally do not render it. The preview approximates desktop colors. Discord owns its client behavior.

## Local development

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

To create the production build:

```sh
npm run build
```

The static output is generated in `dist/`.

## Deploy to Cloudflare Pages

In Cloudflare, create a **Pages** project connected to this GitHub repository using these settings:

| Setting | Value |
| --- | --- |
| Framework preset | React (Vite), or None |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `22` (`.node-version` included) |

No Cloudflare Functions, Workers, API tokens, or environment variables are needed. All text processing happens in the browser, so serving this site uses no Workers request allowance.

## How the output works

Generated messages use the form:

```text
```ansi
ESC[1;31mHello ESC[1;34mworld ESC[0m
```
```

`ESC` in the example above stands for the actual U+001B escape control character placed on the clipboard. The editor's code view shows the printable `\\u001b` representation so users can inspect the codes.

Only standard Discord ANSI colors are generated: foreground 30–37 and background 40–47. No arbitrary hex or 24-bit terminal colors are emitted.

## Project scope

Static Vite + React + TypeScript + Tailwind CSS v4. No CI or test files are included.
