import twilio from 'twilio';
import { config } from '../config/env.config';
import logger from '../utils/logger';

let client: twilio.Twilio | null = null;

if (config.twilio.accountSid && config.twilio.authToken) {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
} else {
  logger.warn('Twilio credentials not found. SMS service is disabled.');
}

export const sendSms = async (to: string, body: string): Promise<void> => {
  if (!client) {
    logger.warn(`Simulating SMS to ${to}: ${body}`);
    return;
  }

  try {
    const message = await client.messages.create({
      body,
      from: config.twilio.phoneNumber,
      to,
    });
    logger.info(`SMS sent successfully to ${to}. Message SID: ${message.sid}`);
  } catch (error) {
    const twilioError = error as Error & { code?: number };
    // Twilio error 21608: unverified number on trial accounts
    if (twilioError.code === 21608) {
      logger.error(
        `Twilio Trial Account Error: The number "${to}" is not verified. Add it at console.twilio.com → Phone Numbers → Verified Caller IDs`,
      );
      throw new Error(
        `Cannot send SMS to unverified number on a Trial account. Verify "${to}" in your Twilio console first.`,
        { cause: error },
      );
    }
    logger.error(`Failed to send SMS to ${to}: ${twilioError.message}`);
    throw new Error('Failed to send SMS', { cause: error });
  }
};
