import React, { useEffect, useState } from 'react';
import './index.css';
const API = 'http://localhost:5000';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', task: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchTasks(); }, []);


  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      setTasks(data.reverse()); // newest first
    } catch (err) {
      console.error(err);
      alert('Could not load tasks');
    } finally { setLoading(false); }
  }
  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }


  async function addTask(e) {
    e.preventDefault();
    if (!form.task.trim()) return alert('Enter a task');
    try {
      const res = await fetch(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const newTask = await res.json();
      setTasks(t => [newTask, ...t]);
      setForm({ date: '', time: '', task: '' });
    } catch (err) { console.error(err); alert('Failed to add task'); }
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
      setTasks(t => t.filter(x => x.id !== id));
    } catch (err) { console.error(err); alert('Failed to delete'); }
  }


  function startEdit(task) { setEditing(task); }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/tasks/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      const updated = await res.json();
      setTasks(t => t.map(x => x.id === updated.id ? updated : x));
      setEditing(null);
    } catch (err) { console.error(err); alert('Failed to save'); }
  }


  async function toggleDone(id) {
    try {
      const res = await fetch(`${API}/tasks/${id}/toggle`, { method: 'PATCH' });
      const updated = await res.json();
      setTasks(t => t.map(x => x.id === updated.id ? updated : x));
    } catch (err) { console.error(err); alert('Failed to toggle'); }
  }

  return (
    <div className="container">
      <h1>Todo List </h1>


      <form className="add-form" onSubmit={addTask}>
        <input name="date" type="date" value={form.date} onChange={onChange} />
        <input name="time" type="time" value={form.time} onChange={onChange} />
        <input name="task" placeholder="Task..." value={form.task} onChange={onChange} />
        <button type="submit">Add</button>
      </form>


      {loading ? <p>Loading...</p> : (
        <ul className="tasks">
          {tasks.map(t => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <label className="left">
                <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
                <div className="text">
                  <div className="task-title">{t.task}</div>
                  <div className="meta">{t.date} {t.time}</div>
                </div>
              </label>
              <div className="actions">
                <button onClick={() => startEdit({ ...t })}>Edit</button>
                <button onClick={() => deleteTask(t.id)} className="danger">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Task</h3>
            <form onSubmit={saveEdit}>
              <input name="date" type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              <input name="time" type="time" value={editing.time} onChange={e => setEditing({ ...editing, time: e.target.value })} />
              <input name="task" value={editing.task} onChange={e => setEditing({ ...editing, task: e.target.value })} />
              <label className="row"><input type="checkbox" checked={editing.done} onChange={e => setEditing({ ...editing, done: e.target.checked })} /> Done</label>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}