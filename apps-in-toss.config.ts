import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'salka-malka',
  navigationBar: { withBackButton: true, withHomeButton: true, theme: 'light' },
  webView: {},
  permissions: [],
  webBundleDir: 'dist',
});
