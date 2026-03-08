import * as cheerio from 'cheerio';
import { ParsedHmrcResult, NormalizedSupplierStatus } from '../../types/server/awrs';
import { cleanText } from './awrs';


export function extractHmrcSearchDateRaw($: cheerio.CheerioAPI): string | null {
  const bodyText = cleanText($('body').text());

  const regex =
    /Search date\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}\s+[0-9]{1,2}:[0-9]{2}\s*(?:am|pm))/i;

  const match = bodyText.match(regex);
  return match?.[1] ? cleanText(match[1]) : null;
}

export function parseHmrcHtml(html: string): ParsedHmrcResult {
  const $ = cheerio.load(html);

  const businessName =
    cleanText($('#result_businessName_detail_result').text()) ||
    cleanText($('[id*="businessName"]').text()) ||
    cleanText($('.result-details').find('dd').first().text());

  const statusText =
    cleanText($('#result_awrs_status_detail').text()) ||
    cleanText($('[id*="awrs_status"]').text()) ||
    cleanText($('.result-details').find('dd').eq(1).text());

  return {
    businessName,
    statusText,
    hmrcSearchDateRaw: extractHmrcSearchDateRaw($),
  };
}

export function normalizeHmrcStatus(input: {
  businessName: string;
  statusText: string;
}): {
  normalizedStatus: NormalizedSupplierStatus;
  rawStatusOut: string;
} {
  const { businessName, statusText } = input;

  if (!businessName || !statusText) {
    return {
      normalizedStatus: 'Not Found',
      rawStatusOut: 'No Record',
    };
  }

  const isApproved = statusText.toLowerCase().includes('approved');

  return {
    normalizedStatus: isApproved ? 'Approved' : 'Invalid/Revoked',
    rawStatusOut: statusText,
  };
}