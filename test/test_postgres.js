const { createTask } = require('../models/postgres');

(async () => {
  try {
    console.log(' Testing task creation...');

    const task = {
      user_id: 'dd0095da-a05c-4749-876b-5cd9314a3c6e',
      title: 'First Task',
      description: 'Testing PostgreSQL insert',
      status: 'Pending',
      due_date: '2025-05-20',
      file_url: null
    };

    const result = await createTask(task);
    console.log('✅ Task created with ID:', result.task_id);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
})();
