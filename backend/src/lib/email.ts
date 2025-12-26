import { log } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Stack-it <noreply@stack-it.dev>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    log.auth.warn("RESEND_API_KEY not configured, skipping email send", { to, subject });
    // In development, just log the email
    console.log("\n📧 Email would be sent:");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}\n`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log.auth.error("Failed to send email", { to, subject, error });
      return false;
    }

    log.auth.info("Email sent successfully", { to, subject });
    return true;
  } catch (error) {
    log.auth.error("Email send error", { to, subject }, error as Error);
    return false;
  }
}

export function generateVerificationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationEmailHtml(code: string, username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
      <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #111827; font-size: 24px; margin: 0 0 8px;">Welcome to Stack-it!</h1>
          <p style="color: #6b7280; margin: 0;">Hey ${username}, verify your email to get started</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</div>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
          This code expires in 15 minutes.<br>
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}
