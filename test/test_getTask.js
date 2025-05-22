const { getTaskById } = require('../models/postgres');

(async () => {
  try {
    console.log('🧪 Testing getTaskById...');

    const task_id = '94485719-f543-47f4-ad63-26c9cd011ef7'; // copy from pgAdmin

    const result = await getTaskById(task_id);
    console.log('✅ Task found:', result);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
})();
