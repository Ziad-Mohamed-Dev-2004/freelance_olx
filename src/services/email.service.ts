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

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
    html,
  });
};

export const sendVerificationOtpEmail = async (to: string, code: string): Promise<void> => {
  const subject = 'Your OLX Clone verification code';
  const text = `Your verification code is ${code}. It is valid for 5 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>This code is valid for 5 minutes.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};
