import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

function parsePDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const text = pdfData.Pages
        .map((page: any) =>
          page.Texts
            .map((text: any) => decodeURIComponent(text.R[0].T))
            .join(' ')
        )
        .join('\n');

      resolve(text);
    });

    pdfParser.on('pdfParser_dataError', (error) => {
      reject(error);
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const rawText = await parsePDF(buffer);

    // Remove extra spaces (PDFs often have spaces between characters)
    const text = rawText.replace(/\s+/g, ' ');

    // Also create version with no spaces for better matching
    const noSpaceText = rawText.replace(/\s+/g, '');

    console.log('📄 PDF Parsed:', {
      filename: file.name,
      rawLength: rawText.length,
      cleanedLength: text.length,
      noSpaceLength: noSpaceText.length,
      rawSample: rawText.substring(0, 300),
      cleanedSample: text.substring(0, 300),
      noSpaceSample: noSpaceText.substring(0, 300),
      hasAWRS: text.includes('AWRS') || noSpaceText.includes('AWRS'),
      hasURN: text.includes('URN') || noSpaceText.includes('URN'),
    });

    // Try both versions of text
    const textsToCheck = [text, noSpaceText];

    // AWRS URN Format: [X][A-Z]AW + 11 digits
    const patterns = [
      /[X][A-Z]AW\d{11}/gi,
      /[X][A-Z]AW\s*\d{3}\s*\d{4}\s*\d{4}/gi,
      /(?:AWRS\s*)?URN\s*(?:Number)?:?\s*([X][A-Z]AW[\s-]*\d{3}[\s-]*\d{4}[\s-]*\d{4})/gi,
      /(?:AWRS\s*)?URN:?\s*([X][A-Z]AW\d{11})/gi,
    ];

    let allMatches: string[] = [];

    for (const textVersion of textsToCheck) {
      for (const pattern of patterns) {
        const matches = Array.from(textVersion.matchAll(pattern));

        for (const match of matches) {
          const urn = match[1] || match[0];
          allMatches.push(urn);
          console.log(`  ✓ Found: ${urn}`);
        }
      }
    }

    // Clean and deduplicate
    const urns = Array.from(new Set(
      allMatches.map(urn => urn.replace(/[\s-]/g, '').toUpperCase())
    ));

    console.log('📋 Final URNs:', urns);

    // If still no matches, log full text for debugging
    if (urns.length === 0) {
      console.log('❌ No URNs found. Full text:', noSpaceText);
    }

    return NextResponse.json({
      success: urns.length > 0,
      urns,
      count: urns.length,
      message: urns.length > 0
        ? `Found ${urns.length} AWRS number${urns.length > 1 ? 's' : ''}`
        : 'No AWRS numbers found',
    });

  } catch (error: any) {
    console.error('❌ Extraction failed:', error);

    return NextResponse.json({
      success: false,
      urns: [],
      count: 0,
      error: error.message
    }, { status: 500 });
  }
}
