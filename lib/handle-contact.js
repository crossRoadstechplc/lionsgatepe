const nodemailer = require('nodemailer');

const MAX_NAME_LEN = 120;
const MAX_ORG_LEN = 160;
const MAX_MESSAGE_LEN = 5000;

function sanitize(value) {
  return String(value ?? '')
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<[^>]*>/g, '');
}

function getMailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE || 'tls').toLowerCase() === 'ssl';

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail: process.env.FROM_EMAIL || user,
    fromName: process.env.FROM_NAME || 'Lionsgate Private Equity',
    toEmail: process.env.TO_EMAIL || process.env.FROM_EMAIL || user,
  };
}

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<{ success: boolean, message: string, statusCode: number }>}
 */
async function handleContact(payload) {
  const honeypot = sanitize(payload.website);
  if (honeypot) {
    return {
      success: true,
      message: 'Thank you. Your message has been sent.',
      statusCode: 200,
    };
  }

  const name = sanitize(payload.name);
  const email = sanitize(payload.email);
  const organization = sanitize(payload.organization);
  const message = sanitize(payload.message);

  if (!name || !email || !message) {
    return {
      success: false,
      message: 'Please fill in all required fields.',
      statusCode: 422,
    };
  }

  if (name.length > MAX_NAME_LEN) {
    return { success: false, message: 'Name is too long.', statusCode: 422 };
  }

  if (organization.length > MAX_ORG_LEN) {
    return { success: false, message: 'Organization name is too long.', statusCode: 422 };
  }

  if (message.length > MAX_MESSAGE_LEN) {
    return { success: false, message: 'Message is too long.', statusCode: 422 };
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
      statusCode: 422,
    };
  }

  const mailConfig = getMailConfig();
  if (!mailConfig) {
    return {
      success: false,
      message: 'Mail is not configured. Set SMTP environment variables on your host.',
      statusCode: 503,
    };
  }

  const subject = `Website inquiry from ${name}`;
  const text = [
    'New message from the Lionsgate website',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${organization || '—'}`,
    '',
    'Message:',
    message,
    '',
    '—',
    `Sent: ${new Date().toISOString()}`,
  ].join('\n');

  try {
    const transporter = createTransporter(mailConfig);
    await transporter.sendMail({
      from: `"${mailConfig.fromName}" <${mailConfig.fromEmail}>`,
      to: mailConfig.toEmail,
      replyTo: `"${name}" <${email}>`,
      subject,
      text,
    });
  } catch (err) {
    console.error('Contact mail error:', err.message);
    return {
      success: false,
      message: 'Unable to send your message right now. Please email info@lionsgatepe.com directly.',
      statusCode: 500,
    };
  }

  return {
    success: true,
    message: 'Thank you. Your message has been sent. We will respond shortly.',
    statusCode: 200,
  };
}

module.exports = { handleContact };
