export const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || '';

export const posthogConfig = {
  api_host: posthogHost,

  // Privacy-friendly settings
  persistence: 'memory' as const,
  disable_session_recording: true,
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,

  // Don't track IP
  property_blacklist: ['$ip'],

  loaded: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 PostHog initialized (privacy mode)');
    }
  },
};