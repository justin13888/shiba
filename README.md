# Shiba

A cute home page and tab manager (browser extension)

## Features

- [x] Customizable home page
- [ ] Customizable new tab page
- [ ] Customizable themes
- [ ] Customizable shortcuts

## Development

### Prerequisites

- Node.js
  - pnpm
- Chrome and Firefox (for testing)

### Setup

1. Clone this repository
2. Install dependencies

   ```sh
   pnpm install
   ```

3. Start the development server

   ```sh
   pnpm dev
   pnpm dev:firefox
   ```

4. Load the extension in your browser
   1. For Chrome, go to `chrome://extensions`, enable developer mode, click "Load unpacked", and select the `dist` folder
   2. Fore firefox, install `web-ext` with `pnpm install --global web-ext`, then run `web-ext run` in the project directory

### Packaging

1. Build the extension

   ```sh
   pnpm build
   pnpm build:firefox
   ```
