import nodemailer from 'nodemailer';
import { config } from '../config/env.config';
import logger from '../utils/logger';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

if (config.smtp.host && config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
} else {
  logger.warn('SMTP credentials not found. Email service is running in log-only mode.');
}

export const sendEmail = async ({ to, subject, text, html }: EmailPayload): Promise<void> => {
  if (!transporter) {
    logger.info(`Simulated email to ${to} | Subject: ${subject} | Body: ${text}`);
    return;
  }

  const from = config.smtp.from && config.smtp.from.includes('شقتي')
    ? config.smtp.from
    : `"شقتي" <${config.smtp.from || config.smtp.user || 'noreply@sheqaty.com'}>`;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

export const sendVerificationOtpEmail = async (to: string, code: string): Promise<void> => {
  const subject = 'رمز التحقق الخاص بك - شقتي 🏠';
  const text = `أهلاً بك في شقتي!\n\nرمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالِح لمدة 5 دقائق فقط. الرجاء عدم مشاركته مع أي شخص.\n\nشقتي - منصتك العقارية`;
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز التحقق - شقتي</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%); padding: 36px 32px; text-align: center;">
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 12px 24px; border: 1px solid rgba(255, 255, 255, 0.2);">
                <span style="font-size: 28px; vertical-align: middle; margin-left: 8px;">🏠</span>
                <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">شقتي</span>
              </div>
              <p style="margin: 12px 0 0 0; color: #93c5fd; font-size: 14px; font-weight: 500;">منصتك الأولى للبحث عن العقارات والوحدات السكنية</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 36px 32px 36px; text-align: right; direction: rtl;">
              <h1 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 700; text-align: center;">رمز التحقق الخاص بك</h1>
              
              <p style="margin: 0 0 28px 0; color: #475569; font-size: 15px; line-height: 1.7; text-align: center;">
                أهلاً بك! استخدم كود التحقق التالي لإكمال عملية التسجيل وتأكيد حسابك في تطبيق <strong>شقتي</strong>:
              </p>

              <!-- OTP Code Box -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #2563eb; border-radius: 16px; padding: 20px 36px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #1d4ed8; letter-spacing: 12px; text-shadow: 0 1px 2px rgba(29,78,216,0.12);">${code}</span>
                </div>
              </div>

              <!-- Security Notice Card -->
              <div style="background-color: #f1f5f9; border-right: 4px solid #3b82f6; border-radius: 12px; padding: 18px 20px; margin-top: 28px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="direction: rtl;">
                  <tr>
                    <td style="padding-bottom: 8px;">
                      <span style="font-size: 16px; margin-left: 8px;">⏳</span>
                      <span style="font-size: 14px; font-weight: 600; color: #1e293b;">هذا الرمز صالِح لمدة 5 دقائق فقط.</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="font-size: 16px; margin-left: 8px;">🔒</span>
                      <span style="font-size: 13px; color: #64748b;">حفاظاً على أمان حسابك، لا تشارك هذا الرمز مع أي شخص آخر.</span>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 36px 36px; background-color: #fafafa; border-top: 1px solid #f1f5f9; text-align: center; direction: rtl;">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.</p>
              <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 600;">© ${new Date().getFullYear()} شقتي (Sheqaty) – جميع الحقوق محفوظة.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({ to, subject, text, html });
};
