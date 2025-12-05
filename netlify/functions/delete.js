const pool = require('./db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.headers.authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { id } = JSON.parse(event.body);

  try {
    // Get image URL first
    const { rows } = await pool.query('SELECT url FROM images WHERE id = $1', [id]);
    if (rows.length === 0) return { statusCode: 404, body: 'Not found' };

    const publicId = rows[0].url.split('/').slice(-2).join('/').split('.')[0];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete from DB
    await pool.query('DELETE FROM images WHERE id = $1', [id]);

    return { statusCode: 200, body: 'Deleted' };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};