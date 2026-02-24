import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const { MY_EMAIL, RESEND_API_KEY } = process.env;

const resend = new Resend(RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, supplierCount, timestamp } = body;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #111827; font-weight: 500; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Full Account Request</h1>
            </div>
            <div class="content">
              <p>A new company has requested to activate a full account on the AWRS Compliance Portal.</p>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Company Name:</span>
                  <span class="value">${companyName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Current Suppliers:</span>
                  <span class="value">${supplierCount} suppliers</span>
                </div>
                <div class="info-row">
                  <span class="label">Request Date:</span>
                  <span class="value">${new Date(timestamp).toLocaleString('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short'
    })}</span>
                </div>
              </div>

              <p style="margin-top: 30px;">
                <span class="badge">ACTION REQUIRED</span>
              </p>
              <p style="color: #6b7280;">
                Please follow up with this company to discuss their full account setup and pricing.
              </p>
            </div>
            <div class="footer">
              <p>This email was sent from the AWRS Compliance Portal Demo</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
NEW FULL ACCOUNT REQUEST
========================

Company: ${companyName}
Supplier Count: ${supplierCount}
Request Date: ${new Date(timestamp).toLocaleString('en-GB')}

---
This request was submitted via the AWRS Compliance Portal demo.
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'AWRS Portal <onboarding@resend.dev>', // ← Change after domain verification
      to: MY_EMAIL!,
      subject: `🎯 Full Account Request - ${companyName}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Request received and email sent',
      emailId: data?.id,
    });

  } catch (error: any) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
