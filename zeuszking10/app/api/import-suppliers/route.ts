import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let data: any[] = [];

    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      data = parsed.data;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(sheet);
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please upload CSV or Excel file.'
      }, { status: 400 });
    }

    console.log('📊 File Parsed:', {
      filename: file.name,
      rowCount: data.length,
      columns: data[0] ? Object.keys(data[0]) : [],
    });

    // Find AWRS column (case-insensitive)
    const awrsColumnNames = [
      'awrs', 'awrs number', 'awrs urn', 'urn', 'urn number',
      'awrs reference', 'reference number', 'registration number'
    ];

    let awrsColumn: string | null = null;
    const columns = data[0] ? Object.keys(data[0]) : [];

    for (const col of columns) {
      const normalizedCol = col.toLowerCase().trim();
      if (awrsColumnNames.some(name => normalizedCol.includes(name))) {
        awrsColumn = col;
        break;
      }
    }

    if (!awrsColumn) {
      return NextResponse.json({
        error: 'No AWRS column found. Please include a column named "AWRS", "AWRS Number", or "URN".',
        availableColumns: columns
      }, { status: 400 });
    }

    console.log(`✓ Found AWRS column: "${awrsColumn}"`);

    // Extract URNs ONLY (no names)
    const urns: string[] = [];
    const awrsPattern = /[X][A-Z]AW\d{11}/i;

    data.forEach((row, index) => {
      const cellValue = row[awrsColumn!];
      if (!cellValue) return;

      const valueStr = String(cellValue).trim();
      const match = valueStr.match(awrsPattern);

      if (match) {
        const urn = match[0].toUpperCase();
        urns.push(urn);
      }
    });

    console.log(`📋 Extracted ${urns.length} URNs from ${data.length} rows`);

    // Remove duplicates
    const uniqueUrns = Array.from(new Set(urns));

    return NextResponse.json({
      success: true,
      suppliers: uniqueUrns.map(urn => ({ urn })), // Only URN, no name
      count: uniqueUrns.length,
      totalRows: data.length,
      awrsColumn,
      message: `Found ${uniqueUrns.length} valid AWRS number${uniqueUrns.length !== 1 ? 's' : ''}`,
    });

  } catch (error: any) {
    console.error('❌ Import failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
