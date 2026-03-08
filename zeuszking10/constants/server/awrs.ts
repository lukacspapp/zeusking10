export const AWRS_URN_REGEX = /^X[A-Z]AW\d{11}$/;

export const DEFAULT_HMRC_CHECK_URL_BASE =
  'https://www.tax.service.gov.uk/check-the-awrs-register?query=';

export const HMRC_REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;