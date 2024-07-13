import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['storage'],
    // browser_action
    // browser_specific_settings 
    author: "Justin Chung"
  },
  modules: ['@wxt-dev/module-solid'],
});
