/*const express = require('express');
const router = express.Router();
const {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  deleteTask
} = require('../models/postgres');
const authenticate = require('../middleware/auth');

// 🔐 Auth middleware required for all routes
router.use(authenticate);

// 📌 Create Task
router.post('/', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const task = await createTask({ ...req.body, user_id });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get All Tasks by User
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const tasks = await getTasksByUser(user_id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Update Task
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Delete Task
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Task deleted', task: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
*/


const express = require('express');
const router = express.Router();
const {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  deleteTask
} = require('../models/postgres');
const authenticate = require('../middleware/auth');

// 🔐 Auth middleware required for all routes
router.use(authenticate);

// 📌 Create Task
router.post('/', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const { title, description, due_date, status } = req.body;

    // 🔎 Basic validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing task title' });
    }

    const task = await createTask({ title, description, due_date, status, user_id });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get All Tasks by User
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const tasks = await getTasksByUser(user_id);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Task by ID
router.get('/:id', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const task = await getTaskById(req.params.id);
    if (!task || task.user_id !== user_id) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Update Task
router.put('/:id', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const task = await getTaskById(req.params.id);
    if (!task || task.user_id !== user_id) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const { title, description, due_date, status } = req.body;

    // 🔎 Basic validation
    if (title && typeof title !== 'string') {
      return res.status(400).json({ error: 'Invalid title' });
    }

    const updated = await updateTask(req.params.id, { title, description, due_date, status });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Delete Task
router.delete('/:id', async (req, res) => {
  try {
    const user_id = req.user.sub;
    const task = await getTaskById(req.params.id);
    if (!task || task.user_id !== user_id) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const deleted = await deleteTask(req.params.id);
    res.status(200).json({ message: 'Task deleted', task: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
