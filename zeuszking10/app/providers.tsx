'use client';

import { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import { initPosthog, posthog } from '../lib/posthog';

initPosthog();

type PHProviderProps = {
  children: ReactNode;
};

export function PHProvider({ children }: PHProviderProps) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}