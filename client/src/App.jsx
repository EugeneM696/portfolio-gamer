import { useCallback, useEffect, useState } from 'react';
import { request, getToken, setToken, clearToken } from './api.js';

function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await request('/api/auth/register', { method: 'POST', body: form });
      }
      const { data } = await request('/api/auth/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      });
      setToken(data.token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>{mode === 'login' ? 'Вхід до системи' : 'Реєстрація'}</h2>
      {mode === 'register' && (
        <label>
          Ім&apos;я <input name="name" value={form.name} onChange={change} required />
        </label>
      )}
      <label>
        Email <input name="email" type="email" value={form.email} onChange={change} required />
      </label>
      <label>
        Пароль{' '}
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={change}
          required
          minLength={8}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={loading}>
        {loading ? 'Зачекайте...' : mode === 'login' ? 'Увійти' : 'Зареєструватися'}
      </button>
      <button
        type="button"
        className="link"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Немає акаунта? Зареєструватися' : 'Вже є акаунт? Увійти'}
      </button>
    </form>
  );
}

function Quests({ user }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [q, setQ] = useState('');
  // Додаткова вимога Типу 4: стани фільтра та сортування
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sort, setSort] = useState('-createdAt');

  const [form, setForm] = useState({ title: '', priority: 'medium', done: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '20', sort });
      if (q.trim()) params.set('q', q.trim());
      if (priorityFilter) params.set('priority', priorityFilter);

      const { data, total: count } = await request(`/api/quests?${params.toString()}`);
      setItems(data);
      setTotal(count);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [q, priorityFilter, sort]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title: form.title,
        priority: form.priority,
        done: Boolean(form.done),
      };
      await request('/api/quests', { method: 'POST', body: payload });
      setForm({ title: '', priority: 'medium', done: false });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setError('');
    try {
      await request(`/api/quests/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const canModify = (item) => item.owner === user.id || user.role === 'admin';

  return (
    <section>
      <form onSubmit={create} className="card row">
        <input
          type="text"
          placeholder="Назва ігрового квесту"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          aria-label="Пріоритет квесту"
        >
          <option value="low">Пріоритет: low</option>
          <option value="medium">Пріоритет: medium</option>
          <option value="high">Пріоритет: high</option>
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.done}
            onChange={(e) => setForm({ ...form, done: e.target.checked })}
          />
          Виконано
        </label>
        <button>Додати</button>
      </form>

      {/* Пошук + селекти фільтра й сортування (Тип 4) */}
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Пошук за назвою..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLoading(true);
          }}
        />
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setLoading(true);
          }}
          aria-label="Фільтр за пріоритетом"
        >
          <option value="">Усі пріоритети</option>
          <option value="low">Тільки low</option>
          <option value="medium">Тільки medium</option>
          <option value="high">Тільки high</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setLoading(true);
          }}
          aria-label="Сортування"
        >
          <option value="-createdAt">Спочатку новіші</option>
          <option value="createdAt">Спочатку старіші</option>
          <option value="title">Назва (А → Я)</option>
          <option value="-title">Назва (Я → А)</option>
          <option value="priority">Пріоритет (A → Z)</option>
          <option value="-priority">Пріоритет (Z → A)</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {loading ? (
        <p>Завантаження... (перший запит після простою може тривати до хвилини)</p>
      ) : items.length === 0 ? (
        <p>Записів не знайдено.</p>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.title}</strong> — [{item.priority}] {item.done ? '✅ Виконано' : '⏳ У процесі'}
              </span>
              {canModify(item) && (
                <button className="link" onClick={() => remove(item.id)}>
                  Видалити
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {total !== null && <p className="muted">Усього записів: {total}</p>}
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    request('/api/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (checking) return <p>Перевірка сесії...</p>;

  return (
    <main>
      <header className="top">
        <h1>Ігрові квести</h1>
        {user && (
          <span>
            {user.name} ({user.role}){' '}
            <button className="link" onClick={logout}>
              Вийти
            </button>
          </span>
        )}
      </header>
      {user ? <Quests user={user} /> : <AuthForm onLoggedIn={setUser} />}
    </main>
  );
}