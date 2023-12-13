export {};

// This assumes your build tool replaces these variables during the build process
const isDevelopment = process.env.NODE_ENV === 'development';
const siteUrl = process.env.PLASMO_PUBLIC_SITE_URL; // Prefixing with VITE_ is a common convention in Vite

if (isDevelopment) {
  console.log('This is a development build');
} else {
  console.log('This is a production build');
}

console.log('SITE_URL:', siteUrl);
// TODO: Finish core functionality
// TODO: Make sure it is able to persist
