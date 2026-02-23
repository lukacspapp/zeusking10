import { NextResponse } from 'next/server';

export async function GET() {
  // Real examples from your PDFs
  const testCases = [
    'AWRS URN Number: XNAW00000102308',
    'XHAW 000 0010 7666',
    'XHAW00000107666',
    'XJAW00000102990',
    'XCAW00000102577',
    'Invoice text... URN: XNAW00000102308 more text...',
  ];

  // Official HMRC pattern: 2 letters + AW + 11 digits
  const pattern = /[X][A-Z]AW[\s-]*\d{3}[\s-]*\d{4}[\s-]*\d{4}/gi;
  const labelPattern = /(?:AWRS\s*)?URN\s*(?:Number)?:?\s*([X][A-Z]AW[\s-]*\d{3}[\s-]*\d{4}[\s-]*\d{4})/gi;

  const results = testCases.map(test => {
    const direct = test.match(pattern);
    const withLabel = Array.from(test.matchAll(labelPattern)).map(m => m[1]);

    const allMatches = [...(direct || []), ...withLabel];
    const cleaned = Array.from(new Set(
      allMatches.map(m => m.replace(/[\s-]/g, '').toUpperCase())
    ));

    return {
      input: test,
      directMatch: direct,
      labelMatch: withLabel,
      cleaned: cleaned
    };
  });

  return NextResponse.json({
    officialFormat: '2 letters + AW + 11 digits (e.g., XXAW00000123456)',
    examples: ['XNAW00000102308', 'XHAW00000107666', 'XJAW00000102990'],
    testResults: results
  });
}
