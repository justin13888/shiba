# Shiba

This folder contains browser extension code for Shiba.

## Development

### Prerequisites

- Node.js 22+
- Bun 1.3+
- Chrome and Firefox (for testing)

### Setup

1. Clone this repository
2. Install dependencies (from the repo root)

   ```sh
   bun install
   ```

3. Start the development server

   ```sh
   bun run dev
   bun run dev:firefox
   ```

4. Load the extension in your browser
   1. For Chrome, go to `chrome://extensions`, enable developer mode, click "Load unpacked", and select the `dist` folder
   2. For Firefox, install `web-ext` with `bun add -g web-ext`, then run `web-ext run` in the project directory

### Packaging

1. Build the extension

   ```sh
   bun run build
   bun run build:firefox
   ```
