const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

async function notifyThreeDaysLeft() {
  const rows = await query(`
    SELECT j.id AS job_id, j.user_id, j.title, j.company, j.deadline
    FROM jobs j
    LEFT JOIN notifications n
      ON n.job_id = j.id AND n.user_id = j.user_id AND n.kind = 'deadline_3'
    WHERE DATE(j.deadline) = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      AND n.id IS NULL
  `);

  if (!rows.length) return;

  const values = rows.map(r => ([
    r.user_id,
    r.job_id,
    'deadline_3',
    `Deadline in 3 days`,
    `“${r.title}” at ${r.company} is due on ${new Date(r.deadline).toLocaleDateString()}`,
    null, // link (optional)
  ]));

  // 6 placeholders -> 6 fields per row
  await query(
    `INSERT INTO notifications
      (user_id, job_id, kind, title, body, link, is_read, created_at)
     VALUES ${values.map(() => '(?,?,?,?,?, ?, 0, NOW())').join(',')}`,
    values.flat()
  );
}

module.exports = { notifyThreeDaysLeft };  // <— named export as an object
