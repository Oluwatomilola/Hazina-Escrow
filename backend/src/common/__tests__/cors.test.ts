import { describe, expect, it } from 'vitest';

import { createCorsOptions, parseCorsAllowedOrigins } from '../cors';

describe('CORS configuration', () => {
  it('uses CORS_ALLOWED_ORIGINS as a comma-separated whitelist', () => {
    expect(
      parseCorsAllowedOrigins({
        CORS_ALLOWED_ORIGINS: 'https://app.hazina.example, https://admin.hazina.example ',
      }),
    ).toEqual(['https://app.hazina.example', 'https://admin.hazina.example']);
  });

  it('falls back to FRONTEND_URL for existing environments', () => {
    expect(parseCorsAllowedOrigins({ FRONTEND_URL: 'https://frontend.hazina.example' })).toEqual([
      'https://frontend.hazina.example',
    ]);
  });

  it('keeps localhost as the default development origin', () => {
    expect(parseCorsAllowedOrigins({})).toEqual(['http://localhost:5173']);
  });

  it('does not default to localhost in production', () => {
    expect(parseCorsAllowedOrigins({ NODE_ENV: 'production' })).toEqual([]);
  });

  it('allows requests from whitelisted browser origins', () => {
    const options = createCorsOptions({
      CORS_ALLOWED_ORIGINS: 'https://app.hazina.example,https://admin.hazina.example',
    });

    options.origin?.('https://admin.hazina.example', (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
    });
  });

  it('allows requests without an Origin header', () => {
    const options = createCorsOptions({ CORS_ALLOWED_ORIGINS: 'https://app.hazina.example' });

    options.origin?.(undefined, (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
    });
  });

  it('rejects browser origins outside the whitelist', () => {
    const options = createCorsOptions({ CORS_ALLOWED_ORIGINS: 'https://app.hazina.example' });

    options.origin?.('https://evil.example', (error, allow) => {
      expect(error).toEqual(new Error('Origin https://evil.example is not allowed by CORS'));
      expect(allow).toBeUndefined();
    });
  });
});
