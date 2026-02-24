import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const urn = searchParams.get('urn');

  if (!urn) {
    return NextResponse.json({ error: 'URN is required' }, { status: 400 });
  }

  const cleanUrn = urn.replace(/\s/g, '').toUpperCase();
  console.log('🔍 Checking URN:', cleanUrn);

  // URN Format validation
  const urnRegex = /^X[A-Z]AW00000\d{6}$/;
  if (!urnRegex.test(cleanUrn)) {
    console.log('❌ Invalid URN format');
    return NextResponse.json({
      urn: cleanUrn,
      name: 'NOT FOUND',
      status: 'Invalid/Revoked',
      error: 'Invalid URN format',
    });
  }

  const url = `https://www.tax.service.gov.uk/check-the-awrs-register?query=${cleanUrn}`;
  console.log('🌐 Scraping:', url);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
    });

    const $ = cheerio.load(data);

    // Try multiple selectors (HMRC might change IDs)
    const businessName =
      $('#result_businessName_detail_result').text().trim() ||
      $('[id*="businessName"]').text().trim() ||
      $('.result-details').find('dd').first().text().trim();

    const status =
      $('#result_awrs_status_detail').text().trim() ||
      $('[id*="awrs_status"]').text().trim() ||
      $('.result-details').find('dd').eq(1).text().trim();

    console.log('📋 Scraped:', { businessName, status });

    // If no data found, return NOT FOUND
    if (!businessName || !status) {
      console.log('⚠️ No data found on HMRC site');
      return NextResponse.json({
        urn: cleanUrn,
        name: 'NOT FOUND',
        status: 'Invalid/Revoked',
        raw_status: 'No Record',
        checked_at: new Date().toISOString(),
      });
    }

    const isApproved = status.toLowerCase().includes('approved');

    return NextResponse.json({
      urn: cleanUrn,
      name: businessName,
      status: isApproved ? 'Approved' : 'Invalid/Revoked',
      raw_status: status,
      checked_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ HMRC Scraping Error:', error.message);

    // Return error status
    return NextResponse.json({
      urn: cleanUrn,
      name: 'ERROR',
      status: 'Invalid/Revoked',
      error: error.message,
      checked_at: new Date().toISOString(),
    }, { status: 500 });
  }
}
