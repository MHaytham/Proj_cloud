const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'task_db',
  password: 'Mh24116528',
  port: 5432
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

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('❌ Task creation error:', err.message);
    throw err;
  }
}

// Get task by ID
async function getTaskById(task_id) {
  const query = `SELECT * FROM tasks WHERE task_id = $1`;
  try {
    const result = await pool.query(query, [task_id]);
    return result.rows[0];
  } catch (err) {
    console.error('❌ Error getting task by ID:', err.message);
    throw err;
  }
}

// Get tasks by user ID
async function getTasksByUser(user_id) {
  const query = `SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date DESC`;
  try {
    const result = await pool.query(query, [user_id]);
    return result.rows;
  } catch (err) {
    console.error('❌ Error getting tasks by user:', err.message);
    throw err;
  }
}

// Update task
async function updateTask(task_id, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in updates) {
    fields.push(`${key} = $${index}`);
    values.push(updates[key]);
    index++;
  }

  const query = `
    UPDATE tasks SET ${fields.join(', ')}
    WHERE task_id = $${index}
    RETURNING *;
  `;
  values.push(task_id);

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('❌ Error updating task:', err.message);
    throw err;
  }
}

// Delete task
async function deleteTask(task_id) {
  const query = `DELETE FROM tasks WHERE task_id = $1 RETURNING *`;
  try {
    const result = await pool.query(query, [task_id]);
    return result.rows[0];
  } catch (err) {
    console.error('❌ Error deleting task:', err.message);
    throw err;
  }
}

// Export all
module.exports = {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  deleteTask
};
