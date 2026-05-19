import { ENV } from '../config/env.js';

// Sends a WhatsApp message to a single phone number
export const sendMessage = async (phone, message) => {
  if (!ENV.WHATSAPP_API_URL || !ENV.WHATSAPP_API_TOKEN) {
    console.log(`[WhatsApp] To ${phone}: ${message}`);
    return;
  }

  await fetch(`${ENV.WHATSAPP_API_URL}/messages`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ENV.WHATSAPP_API_TOKEN}`,
    },
    body: JSON.stringify({ to: phone, message }),
  });
};

// Notifies multiple staff members
export const notifyStaff = async (phones, message) => {
  await Promise.all(phones.map((phone) => sendMessage(phone, message)));
};
