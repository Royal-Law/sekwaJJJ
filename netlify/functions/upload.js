// netlify/functions/upload.js
const cloudinary = require('cloudinary').v2;
const pool = require('./db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  // 1. Security check
  if (event.headers.authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Parse the multipart form-data manually (Netlify-compatible way)
    const boundary = event.headers['content-type'].split('boundary=')[1];
    const parts = parseMultipart(event.body, boundary, event.isBase64Encoded);

    const filePart = parts.find(p => p.name === 'image');
    const alt_text = parts.find(p => p.name === 'alt_text')?.data || '';
    const category = parts.find(p => p.name === 'category')?.data || '';

    if (!filePart || !filePart.data) {
      return { statusCode: 400, body: 'No image uploaded' };
    }

    // 3. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${filePart.type};base64,${filePart.data.toString('base64')}`,
      { folder: 'sekwa-portfolio' }
    );

    // 4. Save URL to Neon
    await pool.query(
      'INSERT INTO images (url, alt_text, category) VALUES ($1, $2, $3)',
      [uploadResult.secure_url, alt_text, category]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Upload successful!', url: uploadResult.secure_url }),
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, body: err.message };
  }
};

// ──────────────────────────────
// Simple multipart parser (no extra deps needed)
function parseMultipart(body, boundary, isBase64 = false) {
  const raw = isBase64 ? Buffer.from(body, 'base64') : body;
  const parts = [];
  const boundaryBytes = `--${boundary}`;
  let start = raw.indexOf(boundaryBytes) + boundaryBytes.length + 2; // +2 for \r\n

  while (start > boundaryBytes.length) {
    const end = raw.indexOf(boundaryBytes, start);
    const part = raw.subarray(start, end > -1 ? end - 2 : undefined); // -2 removes final \r\n

    const headerEnd = part.indexOf('\r\n\r\n');
    const headers = part.subarray(0, headerEnd).toString();
    const content = part.subarray(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const typeMatch = headers.match(/Content-Type: ([^\r\n]+)/);

    parts.push({
      name: nameMatch?.[1] || '',
      filename: filenameMatch?.[1] || '',
      type: typeMatch?.[1] || 'application/octet-stream',
      data: content,
    });

    if (end === -1) break;
    start = end + boundaryBytes.length + 2;
  }
  return parts;
}
