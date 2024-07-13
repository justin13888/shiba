import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['storage'],
    author: 'Justin Chung',
    // browser_action
    // browser_specific_settings
    description: 'Cute tab manager and custom homepage',
    homepage_url: 'https://github.com/justin13888/shiba',
    
  },
  modules: ['@wxt-dev/module-solid'],
});
