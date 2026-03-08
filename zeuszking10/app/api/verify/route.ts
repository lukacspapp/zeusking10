import { NextRequest, NextResponse } from 'next/server';
import { AWRS_URN_REGEX } from '../../../constants/server/awrs';
import { SignedRecordPayload } from '../../../types/server/awrs';
import { normalizeUrn, sha256Hex, stableStringify, hmacSha256Hex } from '../../../utils/server/awrs';
import { buildHmrcUrl, fetchHmrcHtml } from '../../../utils/server/hmrc';
import { parseHmrcHtml, normalizeHmrcStatus } from '../../../utils/server/parser';

function jsonError(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const urn = request.nextUrl.searchParams.get('urn');

  if (!urn) {
    return jsonError({ error: 'URN is required' }, 400);
  }

  const cleanUrn = normalizeUrn(urn);
  const checkedAtIso = new Date().toISOString();

  if (!AWRS_URN_REGEX.test(cleanUrn)) {
    return jsonError(
      {
        urn: cleanUrn,
        name: 'NOT FOUND',
        status: 'Invalid/Revoked',
        error: 'Invalid URN format',
        checked_at: checkedAtIso,
      },
      400
    );
  }

  const signingKey = process.env.AWRS_SIGNING_KEY;

  if (!signingKey) {
    console.error('❌ Missing env: AWRS_SIGNING_KEY');

    return jsonError(
      {
        error: 'Server signing key not configured (AWRS_SIGNING_KEY missing)',
      },
      500
    );
  }

  const hmrcUrl = buildHmrcUrl(cleanUrn);

  try {
    const { statusCode, html } = await fetchHmrcHtml(hmrcUrl);

    if (statusCode < 200 || statusCode >= 300) {
      console.error('❌ HMRC non-2xx response:', statusCode, 'URL:', hmrcUrl);

      return jsonError(
        {
          urn: cleanUrn,
          name: 'ERROR',
          status: 'Error',
          error: `HMRC returned HTTP ${statusCode}`,
          checked_at: checkedAtIso,
          hmrc_url: hmrcUrl,
        },
        502
      );
    }

    if (typeof html !== 'string' || html.length < 200) {
      console.error('❌ HMRC response not HTML or too short', 'URL:', hmrcUrl);

      return jsonError(
        {
          urn: cleanUrn,
          name: 'ERROR',
          status: 'Error',
          error: 'HMRC response was not valid HTML',
          checked_at: checkedAtIso,
          hmrc_url: hmrcUrl,
        },
        502
      );
    }

    const { businessName, statusText, hmrcSearchDateRaw } = parseHmrcHtml(html);
    const { normalizedStatus, rawStatusOut } = normalizeHmrcStatus({
      businessName,
      statusText,
    });

    const evidenceHtmlSha256 = sha256Hex(html);

    const recordPayload: SignedRecordPayload = {
      urn: cleanUrn,
      business_name: businessName || 'NOT FOUND',
      status: normalizedStatus,
      raw_status: rawStatusOut,
      hmrc_url: hmrcUrl,
      hmrc_search_date_raw: hmrcSearchDateRaw || null,
      checked_at: checkedAtIso,
      evidence_html_sha256: evidenceHtmlSha256,
      checker_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    };

    const canonical = stableStringify(recordPayload);
    const canonicalSha256 = sha256Hex(canonical);
    const recordId = `${cleanUrn}-${canonicalSha256.slice(0, 16)}`;
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

    if (axiosStatus) {
      console.error('❌ HMRC status:', axiosStatus);
    }

    if (axiosData) {
      console.error('❌ HMRC body (first 300):', String(axiosData).slice(0, 300));
    }

    return jsonError(
      {
        urn: cleanUrn,
        name: 'ERROR',
        status: 'Error',
        error: error?.message || 'Unknown error',
        checked_at: checkedAtIso,
        hmrc_url: hmrcUrl,
      },
      502
    );
  }
}