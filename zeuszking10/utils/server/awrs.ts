import crypto, { BinaryLike } from 'crypto';

export function cleanText(value: string) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function normalizeUrn(urn: string) {
  return urn.replace(/\s/g, '').toUpperCase();
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`);

  return `{${entries.join(',')}}`;
}

export function sha256Hex(input: string | Uint8Array) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function hmacSha256Hex(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

