const pool = require('./db');

exports.handler = async () => {
  try {
    const { rows } = await pool.query('SELECT url, alt_text, category FROM images ORDER BY uploaded_at DESC');
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};