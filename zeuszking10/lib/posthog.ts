import posthog from 'posthog-js';
import { posthogConfig, posthogKey } from '../config/posthogConfig';

let isInitialized = false;

export function initPosthog() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (!posthogKey) return;

  posthog.init(posthogKey, posthogConfig);
  isInitialized = true;
}

export { posthog };