import posthog from 'posthog-js';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties);

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Event:', eventName, properties);
    }
  }
};