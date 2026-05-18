/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'googleapis', 'google-auth-library'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          // Legacy XSS protection (browsers that support it)
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          // Don't leak referrer to third parties
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by this app
          { key: 'Permissions-Policy',        value: 'geolocation=(), microphone=(), camera=()' },
          // Force HTTPS for 1 year (only effective in production)
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js needs unsafe-inline for styles; scripts are hashed by Next.js itself
              "script-src 'self' 'unsafe-inline' https://static.elfsight.com https://apps.elfsight.com https://elfsightcdn.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.emailjs.com https://service.elfsight.com https://core.service.elfsight.com https://widget-data.service.elfsight.com https://dentalbot.clouddec.site https://maps.googleapis.com",
              "frame-src 'self' https://www.elfsight.com https://www.google.com https://maps.google.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
