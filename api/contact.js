const { handleContact } = require('../lib/handle-contact');

/**
 * Vercel serverless function — POST /api/contact
 */
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  let payload = req.body;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }
  }

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid request body.' });
  }

  const result = await handleContact(payload);
  return res.status(result.statusCode).json({
    success: result.success,
    message: result.message,
  });
};
