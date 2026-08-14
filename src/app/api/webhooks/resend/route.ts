import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Resend Inbound Email Webhook Route Handler
 * Endpoint URL: POST /api/webhooks/resend
 *
 * Optional Security: Set RESEND_WEBHOOK_SECRET=whsec_... in .env.local to enable Svix signature verification.
 */

function verifyResendSignature(rawBody: string, headers: Headers, secret: string): boolean {
  try {
    const svixId = headers.get('svix-id');
    const svixTimestamp = headers.get('svix-timestamp');
    const svixSignature = headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return false;
    }

    const secretKey = secret.replace(/^whsec_/, '');
    const secretBytes = Buffer.from(secretKey, 'base64');
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

    const computedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const signatures = svixSignature.split(' ').map((sig) => {
      const parts = sig.split(',');
      return parts.length > 1 ? parts[1] : parts[0];
    });

    return signatures.includes(computedSignature);
  } catch (err) {
    console.error('[Resend Webhook] Signature verification error:', err);
    return false;
  }
}

function extractEmail(rawEmail: unknown): string | null {
  if (!rawEmail) return null;
  if (typeof rawEmail === 'object' && rawEmail !== null && 'email' in rawEmail) {
    return String((rawEmail as { email: string }).email).trim().toLowerCase();
  }
  const str = String(rawEmail);
  const match = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].toLowerCase() : null;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Signature Verification (if secret is configured in env)
    if (webhookSecret) {
      const isValid = verifyResendSignature(rawBody, req.headers, webhookSecret);
      if (!isValid) {
        console.warn('[Resend Webhook] Invalid webhook signature detected.');
        return NextResponse.json(
          { status: 'unauthorized', message: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      console.log('[Resend Webhook] RESEND_WEBHOOK_SECRET not set. Signature check skipped.');
    }

    const payload = JSON.parse(rawBody);
    console.log('[Resend Webhook] Received payload:', JSON.stringify(payload, null, 2));

    const emailData = payload.data || payload;
    const rawFrom = emailData.from || emailData.from_email || emailData.sender;
    const senderEmail = extractEmail(rawFrom);

    if (!senderEmail) {
      console.warn('[Resend Webhook] Sender email address not found in payload.');
      return NextResponse.json(
        { status: 'ignored', reason: 'No valid sender email found' },
        { status: 200 }
      );
    }

    const originalSubject = emailData.subject || 'Inquiry';

    // -------------------------------------------------------------
    // LOOP PROTECTION: Avoid auto-reply loops
    // -------------------------------------------------------------
    const ownEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@careerque.in').toLowerCase();
    
    const isSelfOrSystem = 
      senderEmail === ownEmail ||
      senderEmail.includes('careerque.in') ||
      senderEmail.includes('no-reply') ||
      senderEmail.includes('noreply') ||
      senderEmail.includes('mailer-daemon') ||
      senderEmail.includes('postmaster');

    const isAutoReplySubject = /auto[- ]?reply|automatic reply|out of office|delivery status/i.test(originalSubject);

    if (isSelfOrSystem || isAutoReplySubject) {
      console.log(`[Resend Webhook] Skipping auto-reply for ${senderEmail} to prevent email loop.`);
      return NextResponse.json(
        { status: 'ignored', reason: 'Loop protection triggered' },
        { status: 200 }
      );
    }

    // -------------------------------------------------------------
    // DISPATCH AUTO-REPLY VIA RESEND API
    // -------------------------------------------------------------
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@careerque.in';
    const formattedFrom = `CareerQue Onboarding <${fromAddress}>`;

    const replySubject = originalSubject.toLowerCase().startsWith('re:')
      ? originalSubject
      : `Re: ${originalSubject}`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">CareerQue</h2>
        </div>
        <div style="padding: 24px 0;">
          <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
            Hello,
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
            Thank you for reaching out to us. We have received your email successfully and our team will reply to you soon.
          </p>
        </div>
        <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #64748b;">
          <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
            <strong>Note:</strong> Please do not reply to this email as it is an automated auto-generated message.
          </p>
        </div>
        <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} CareerQue. All rights reserved.
        </div>
      </div>
    `;

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: formattedFrom,
          to: [senderEmail],
          subject: replySubject,
          html: htmlBody,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error('[Resend Webhook] Resend API error:', resData);
        return NextResponse.json(
          { status: 'error', error: resData },
          { status: 500 }
        );
      }

      console.log(`[Resend Webhook] Auto-reply sent to ${senderEmail}. Resend ID: ${resData.id}`);
      return NextResponse.json({
        status: 'success',
        message: 'Auto-reply sent successfully',
        resend_id: resData.id,
        to: senderEmail,
      });
    } else {
      console.warn('[Resend Webhook] RESEND_API_KEY is missing.');
      return NextResponse.json(
        { status: 'warning', message: 'RESEND_API_KEY not configured' },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('[Resend Webhook] Error processing request:', error);
    return NextResponse.json(
      { status: 'error', error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'CareerQue Resend Inbound Email Webhook Endpoint',
    endpoint: '/api/webhooks/resend',
    accepted_method: 'POST',
    signature_verification: process.env.RESEND_WEBHOOK_SECRET ? 'enabled' : 'disabled',
  });
}
