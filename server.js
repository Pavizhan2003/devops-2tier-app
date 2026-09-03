const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devopspassword',
  database: process.env.DB_NAME || 'taskdb',
  port: 5432,
});

// Auto-create table on startup
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized: tasks table ready');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
};
initDb();

// 1. Health Probe for AKS / Monitoring
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'UP', database: 'PostgreSQL Connected' });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// 2. Main Web Page: Form + List of Tasks
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    const tasks = result.rows;

    let taskItems = tasks.map(t => `
      <li style="padding: 8px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
        <span><strong>#${t.id}</strong>: ${t.title}</span>
        <small style="color: #666;">${new Date(t.created_at).toLocaleTimeString()}</small>
      </li>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DevOps Task Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 40px; }
          .container { max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h2 { margin-top: 0; color: #1e293b; text-align: center; }
          input[type="text"] { width: 70%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
          button { padding: 10px 15px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          button:hover { background: #0369a1; }
          ul { list-style: none; padding: 0; margin-top: 20px; }
          .status { margin-top: 20px; font-size: 12px; text-align: center; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Task Manager</h2>
          <form method="POST" action="/tasks" style="display: flex; gap: 8px; justify-content: center;">
            <input type="text" name="title" placeholder="Type a new task..." required />
            <button type="submit">Add Task</button>
          </form>
          <ul>
            ${taskItems || '<li style="text-align:center; color:#888; padding: 10px;">No tasks stored in SQL yet!</li>'}
          </ul>
          <div class="status">● Connected to PostgreSQL Database</div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send('Database read error: ' + err.message);
  }
});

// 3. POST Endpoint to Save Tasks to SQL
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (title) {
    try {
      await pool.query('INSERT INTO tasks (title) VALUES ($1)', [title]);
    } catch (err) {
      console.error('Database write error:', err.message);
    }
  }
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});