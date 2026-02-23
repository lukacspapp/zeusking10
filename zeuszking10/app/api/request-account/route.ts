import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, supplierCount, timestamp } = body;

    // YOUR EMAIL - Change this to your actual email
    const YOUR_EMAIL = 'your-email@example.com';

    const emailContent = `
NEW FULL ACCOUNT REQUEST
========================

Company: ${companyName}
Supplier Count: ${supplierCount}
Request Date: ${new Date(timestamp).toLocaleString('en-GB')}

---
This request was submitted via the AWRS Compliance Portal demo.
    `.trim();

    // Option 1: Use a simple email service (Resend - Recommended)
    // Uncomment and add your Resend API key
    /*
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AWRS Portal <noreply@yourdomain.com>',
        to: YOUR_EMAIL,
        subject: `Full Account Request - ${companyName}`,
        text: emailContent,
      }),
    });

    if (!resendResponse.ok) {
      throw new Error('Email sending failed');
    }
    */

    // Option 2: Log to console (for demo/testing)
    console.log('📧 EMAIL SENT:');
    console.log(emailContent);

    // Store in a simple JSON file (optional - for demo purposes)
    // In production, you'd save to a database

    return NextResponse.json({
      success: true,
      message: 'Request received'
    });

  } catch (error: any) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Failed to send request' },
      { status: 500 }
    );
  }
}
