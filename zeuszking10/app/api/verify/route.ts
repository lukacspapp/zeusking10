import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export const runtime = 'nodejs';

function cleanText(s: string) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

/** Stable JSON stringify (sort keys) so hashing/signing is deterministic */
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;

  const keys = Object.keys(obj).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(',')}}`;
}

function sha256Hex(input: string | Buffer) {
  return crypto.createHash('sha256').update(input as any).digest('hex');
}

function hmacSha256Hex(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Extract HMRC-provided "Search date ..." line from the results page text.
 * Example: "Search date 3 March 2026 8:36pm"
 */
function extractHmrcSearchDateRaw($: cheerio.CheerioAPI): string | null {
  const bodyText = cleanText($('body').text());

  // Allow optional space before am/pm
  const re =
    /Search date\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}\s+[0-9]{1,2}:[0-9]{2}\s*(?:am|pm))/i;

  const m = bodyText.match(re);
  return m?.[1] ? cleanText(m[1]) : null;
}

/**
 * ✅ Single source of truth for the HMRC check URL.
 * Set env:
 *   AWRS_HMRC_CHECK_URL_BASE="https://www.tax.service.gov.uk/check-the-awrs-register?query="
 */
function buildHmrcUrl(cleanUrn: string) {
  const base =
    process.env.AWRS_HMRC_CHECK_URL_BASE ||
    'https://www.tax.service.gov.uk/check-the-awrs-register?query=';

  // If base already includes query=, append URN directly.
  if (base.includes('query=')) return `${base}${encodeURIComponent(cleanUrn)}`;

  // Otherwise, append query param safely.
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}query=${encodeURIComponent(cleanUrn)}`;
}

export async function GET(request: NextRequest) {
  const urn = request.nextUrl.searchParams.get('urn');
  if (!urn) return NextResponse.json({ error: 'URN is required' }, { status: 400 });

  const cleanUrn = urn.replace(/\s/g, '').toUpperCase();

  // ✅ Correct URN format: X + letter + AW + 11 digits
  const urnRegex = /^X[A-Z]AW\d{11}$/;
  if (!urnRegex.test(cleanUrn)) {
    return NextResponse.json(
      {
        urn: cleanUrn,
        name: 'NOT FOUND',
        status: 'Invalid/Revoked',
        error: 'Invalid URN format',
        checked_at: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const signingKey = process.env.AWRS_SIGNING_KEY;
  if (!signingKey) {
    console.error('❌ Missing env: AWRS_SIGNING_KEY');
    return NextResponse.json(
      { error: 'Server signing key not configured (AWRS_SIGNING_KEY missing)' },
      { status: 500 }
    );
  }

  const hmrcUrl = buildHmrcUrl(cleanUrn);
  const checkedAtIso = new Date().toISOString();

  try {
    const resp = await axios.get(hmrcUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const statusCode = resp.status;
    const html = resp.data;

    if (statusCode < 200 || statusCode >= 300) {
      console.error('❌ HMRC non-2xx response:', statusCode, 'URL:', hmrcUrl);
      return NextResponse.json(
        {
          urn: cleanUrn,
          name: 'ERROR',
          status: 'Error',
          error: `HMRC returned HTTP ${statusCode}`,
          checked_at: checkedAtIso,
          hmrc_url: hmrcUrl,
        },
        { status: 502 }
      );
    }

    if (typeof html !== 'string' || html.length < 200) {
      console.error('❌ HMRC response not HTML or too short', 'URL:', hmrcUrl);
      return NextResponse.json(
        {
          urn: cleanUrn,
          name: 'ERROR',
          status: 'Error',
          error: 'HMRC response was not valid HTML',
          checked_at: checkedAtIso,
          hmrc_url: hmrcUrl,
        },
        { status: 502 }
      );
    }

    const $ = cheerio.load(html);

    const businessName =
      cleanText($('#result_businessName_detail_result').text()) ||
      cleanText($('[id*="businessName"]').text()) ||
      cleanText($('.result-details').find('dd').first().text());

    const statusText =
      cleanText($('#result_awrs_status_detail').text()) ||
      cleanText($('[id*="awrs_status"]').text()) ||
      cleanText($('.result-details').find('dd').eq(1).text());

    const hmrcSearchDateRaw = extractHmrcSearchDateRaw($);

    // Evidence hash of *exact* HTML bytes received by your server
    const evidenceHtmlSha256 = sha256Hex(Buffer.from(html, 'utf-8'));

    // Decide status outcome safely
    let normalizedStatus: 'Approved' | 'Invalid/Revoked' | 'Not Found';
    let rawStatusOut: string;

    if (!businessName || !statusText) {
      normalizedStatus = 'Not Found';
      rawStatusOut = 'No Record';
    } else {
      const isApproved = statusText.toLowerCase().includes('approved');
      normalizedStatus = isApproved ? 'Approved' : 'Invalid/Revoked';
      rawStatusOut = statusText;
    }

    // Canonical record payload (facts that must not change)
    const recordPayload = {
      urn: cleanUrn,
      business_name: businessName || 'NOT FOUND',
      status: normalizedStatus,
      raw_status: rawStatusOut,

      // exact URL fetched (signed)
      hmrc_url: hmrcUrl,

      // HMRC-provided timestamp (signed)
      hmrc_search_date_raw: hmrcSearchDateRaw || null,

      // system timestamp (signed)
      checked_at: checkedAtIso,

      // evidence fingerprint (signed)
      evidence_html_sha256: evidenceHtmlSha256,

      // versioning (signed)
      checker_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    };

    const canonical = stableStringify(recordPayload);
    const canonicalSha256 = sha256Hex(canonical);

    // Record ID tied to the canonical hash
    const recordId = `${cleanUrn}-${canonicalSha256.slice(0, 16)}`;

    // Signature proves this record was produced by your server and wasn't altered
    const signature = hmacSha256Hex(signingKey, `${recordId}.${canonicalSha256}`);

    return NextResponse.json({
      urn: cleanUrn,
      name: businessName || 'NOT FOUND',
      status: normalizedStatus,
      raw_status: rawStatusOut,
      checked_at: checkedAtIso,

      hmrc_url: hmrcUrl,
      hmrc_search_date_raw: hmrcSearchDateRaw,

      record_id: recordId,
      canonical_sha256: canonicalSha256,
      evidence_html_sha256: evidenceHtmlSha256,
      signature_hmac_sha256: signature,
    });
  } catch (error: any) {
    const axiosStatus = error?.response?.status;
    const axiosData = error?.response?.data;

    console.error('❌ Verify route error:', error?.message, 'URL:', hmrcUrl);
    if (axiosStatus) console.error('❌ HMRC status:', axiosStatus);
    if (axiosData) console.error('❌ HMRC body (first 300):', String(axiosData).slice(0, 300));

    return NextResponse.json(
      {
        urn: cleanUrn,
        name: 'ERROR',
        status: 'Error',
        error: error?.message || 'Unknown error',
        checked_at: checkedAtIso,
        hmrc_url: hmrcUrl,
      },
      { status: 502 }
    );
  }
}