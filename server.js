const express = require('express');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

client.on('error', (err) => console.error('Redis Client Error:', err));

// Liveness and readiness probe endpoint for Docker and Kubernetes
app.get('/health', async (req, res) => {
  try {
    const ping = await client.ping();
    res.status(200).json({ status: 'UP', redis: ping });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', error: err.message });
  }
});

// Basic hit-counter / task increment endpoint
app.get('/tasks', async (req, res) => {
  try {
    const count = await client.incr('task_counter');
    res.status(200).json({ message: 'Task logged successfully', totalTasks: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  try {
    await client.connect();
    console.log(`Server running on port ${PORT}, connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (err) {
    console.error('Failed to connect to Redis on startup:', err.message);
  }
});