'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

    // 🔒 Privacy-friendly settings
    persistence: 'memory',              // No cookies!
    disable_session_recording: true,    // No recordings
    autocapture: false,                 // Manual events only
    capture_pageview: false,           // We control tracking
    capture_pageleave: false,

    // Don't track IP
    property_blacklist: ['$ip'],

    loaded: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 PostHog initialized (privacy mode)');
      }
    },
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
