const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const DATA_FILE = path.join(__dirname, "tasks.json");
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

async function readTasks() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeTasks(tasks) {
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function generateId() {
  try {
    return require("crypto").randomBytes(8).toString("hex");
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (err) {
    console.error("GET /tasks error", err);
    res.status(500).json({ error: "Failed to read tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { date = "", time = "", task } = req.body || {};
    if (!task || !String(task).trim()) {
      return res.status(400).json({ error: "Task text is required" });
    }

    const newTask = {
      id: generateId(),
      date: String(date || ""),
      time: String(time || ""),
      task: String(task),
      done: false,
    };

    const tasks = await readTasks();
    tasks.push(newTask);
    await writeTasks(tasks);

    res.status(201).json(newTask);
  } catch (err) {
    console.error("POST /tasks error", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, task, done } = req.body || {};
    const tasks = await readTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });

    tasks[idx] = {
      ...tasks[idx],
      date: date !== undefined ? String(date) : tasks[idx].date,
      time: time !== undefined ? String(time) : tasks[idx].time,
      task: task !== undefined ? String(task) : tasks[idx].task,
      done: done !== undefined ? Boolean(done) : tasks[idx].done,
    };

    await writeTasks(tasks);
    res.json(tasks[idx]);
  } catch (err) {
    console.error("PUT /tasks/:id error", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let tasks = await readTasks();
    const exists = tasks.some((t) => t.id === id);
    if (!exists) return res.status(404).json({ error: "Task not found" });

    tasks = tasks.filter((t) => t.id !== id);
    await writeTasks(tasks);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /tasks/:id error", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.patch("/tasks/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await readTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });

    tasks[idx].done = !Boolean(tasks[idx].done);
    await writeTasks(tasks);
    res.json(tasks[idx]);
  } catch (err) {
    console.error("PATCH /tasks/:id/toggle error", err);
    res.status(500).json({ error: "Failed to toggle task" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
