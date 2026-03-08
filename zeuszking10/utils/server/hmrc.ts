import axios from 'axios';
import { DEFAULT_HMRC_CHECK_URL_BASE, HMRC_REQUEST_HEADERS } from '../../constants/server/awrs';


export function buildHmrcUrl(cleanUrn: string) {
  const base =
    process.env.AWRS_HMRC_CHECK_URL_BASE || DEFAULT_HMRC_CHECK_URL_BASE;

  if (base.includes('query=')) {
    return `${base}${encodeURIComponent(cleanUrn)}`;
  }

  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}query=${encodeURIComponent(cleanUrn)}`;
}

export async function fetchHmrcHtml(hmrcUrl: string) {
  const response = await axios.get(hmrcUrl, {
    headers: HMRC_REQUEST_HEADERS,
    timeout: 15000,
    maxRedirects: 5,
    validateStatus: () => true,
  });

  return {
    statusCode: response.status,
    html: response.data,
  };
}