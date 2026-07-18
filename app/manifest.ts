import type { MetadataRoute } from 'next';

/**
 * PWA manifest (auto-served at /manifest.webmanifest by Next). Makes FitCore installable on
 * mobile home screens and sets the standalone app shell — part of the mobile-ready story.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitCore AI',
    short_name: 'FitCore',
    description: 'Your AI fitness coach that builds consistency.',
    start_url: '/today',
    display: 'standalone',
    background_color: '#0b0d0d',
    theme_color: '#0b0d0d',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Start a Momentum Quest',
        short_name: 'Momentum',
        description: 'Choose one readiness-aware daily fitness quest.',
        url: '/momentum',
        icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
      },
    ],
  };
}
