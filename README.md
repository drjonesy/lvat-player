# LVAT Player. Local Video + Audio + Text

Interactive video and audio player with synchronized transcript reading. Load a local
media folder, pair it with SRT/VTT subtitles, and follow along with auto-scrolling
highlights on the active line.

![LVAT Video Player Preview](./lvat-player-preview.gif)

## Features

- Video player with a synchronized, click-to-seek transcript
- Audiobook reader view with an always-on audio player bar
- SRT/VTT parsing, bookmarks, themes, and reader typography settings
- Local file/folder loading — nothing is uploaded anywhere

## Requirements

- Node.js >= 20
- pnpm >= 10 (`corepack enable pnpm`)

## Run locally

```bash
pnpm install
pnpm dev
```

The dev server listens on port 3000.

## Scripts

| Script         | Description                        |
| -------------- | ---------------------------------- |
| `pnpm dev`     | Start the Vite dev server on :3000 |
| `pnpm build`   | Production build to `dist/`        |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint`    | Type-check with `tsc --noEmit`     |
| `pnpm clean`   | Remove build output                |

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · lucide-react · motion
