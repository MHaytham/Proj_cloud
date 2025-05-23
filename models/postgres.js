const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false // for AWS RDS
  }
});

// Optional: verify DB connection on startup
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL!');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
})();

// Create a task
async function createTask(task) {
  const query = `
    INSERT INTO tasks (user_id, title, description, status, due_date, file_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING task_id;
  `;
  const values = [
    task.user_id,
    task.title,
    task.description,
    task.status || 'Pending',
    task.due_date,
    task.file_url || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get task by ID
async function getTaskById(task_id) {
  const result = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [task_id]);
  return result.rows[0];
}

// Get tasks by user ID
async function getTasksByUser(user_id) {
  const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date DESC', [user_id]);
  return result.rows;
}

// Update task
async function updateTask(task_id, updates) {
  const fields = [];
  const values = [];
  Object.entries(updates).forEach(([key, value], i) => {
    fields.push(`${key} = $${i + 1}`);
    values.push(value);
  });

  values.push(task_id);
  const query = `
    UPDATE tasks SET ${fields.join(', ')}
    WHERE task_id = $${values.length}
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Delete task
async function deleteTask(task_id) {
  const result = await pool.query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [task_id]);
  return result.rows[0];
}

// Insert or fetch user_id from users table
async function insertOrGetUser(email, name) {
  const query = `
    INSERT INTO users (email, name)
    VALUES ($1, $2)
    ON CONFLICT (email)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING user_id;
  `;
  const values = [email, name];
  const result = await pool.query(query, values);
  return result.rows[0];
}
module.exports = {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  deleteTask,
  insertOrGetUser
};
