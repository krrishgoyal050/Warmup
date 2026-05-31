import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking by forbidding embedding this app in external iframes
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME-type sniffing attacks by instructing browsers to adhere strictly to Content-Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable legacy browser XSS filters and block page rendering if attack is suspected
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS for a standard duration (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');

  // Control DNS prefetching to avoid user activity leakage
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Limit cross-origin resource leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce frame-ancestors block to keep embedding locked
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://maps.gstatic.com https://maps.googleapis.com; connect-src 'self' https://maps.googleapis.com;");

  next();
};
