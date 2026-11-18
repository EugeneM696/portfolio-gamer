import { useEffect, useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoFilters from './components/TodoFilters';
import TodoList from './components/TodoList';
import './App.css';

const API_URL = 'https://jsonplaceholder.typicode.com/todos';

// === ПАРАМЕТРИ ВАРІАНТА № 12 (portfolio-gamer) ===
const STORAGE_KEY = 'todos-lr10-12';
const PROJECT_TITLE = 'Список ігор для проходження та стрімів';
const USER_ID = 2;
const LIMIT = 10;
const INITIAL_FILTER = 'all'; // 'all' | 'active' | 'done'
const MIN_QUERY = 2;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [todos, setTodos] = useState(() => loadSaved() ?? []);
  const [status, setStatus] = useState(() =>
    loadSaved() !== null ? 'success' : 'loading'
  );
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState(INITIAL_FILTER);
  const [query, setQuery] = useState('');

  // Ефект 1: завантаження початкових даних із АРІ, якщо в localStorage ще немає збереженого списку
  useEffect(() => {
    if (reloadKey === 0 && loadSaved() !== null) return;

    const controller = new AbortController();

    async function fetchTodos() {
      try {
        const url = `${API_URL}?userId=${USER_ID}&_limit=${LIMIT}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Сервер відповів зі статусом ' + response.status);
        }
        const data = await response.json();
        setTodos(
          data.map(({ id, title, completed }) => ({ id, title, completed }))
        );
        setStatus('success');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(
          err instanceof TypeError
            ? "Немає з'єднання з мережею."
            : err.message
        );
        setStatus('error');
      }
    }

    fetchTodos();
    return () => controller.abort();
  }, [reloadKey]);

  // Ефект 2: автоматичне збереження списку в localStorage після кожної зміни
  useEffect(() => {
    if (status === 'success') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch {
        // Ігноруємо помилку переповнення або блокування сховища
      }
    }
  }, [todos, status]);

  function addTodo(title) {
    const newTodo = { id: Date.now(), title, completed: false };
    setTodos((prev) => [newTodo, ...prev]);
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function handleReload() {
    localStorage.removeItem(STORAGE_KEY);
    setStatus('loading');
    setError('');
    setReloadKey((key) => key + 1);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleTodos = todos.filter((todo) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !todo.completed) ||
      (filter === 'done' && todo.completed);
    const matchesQuery =
      normalizedQuery.length < MIN_QUERY ||
      todo.title.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });

  const doneCount = todos.filter((todo) => todo.completed).length;

  return (
    <main className="app">
      <header className="app-header">
        <h1>To-Do List</h1>
        <p className="app-subtitle">{PROJECT_TITLE}</p>
      </header>

      <TodoForm onAdd={addTodo} />

      <TodoFilters
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {status === 'loading' && (
        <p className="status" role="status">
          Завантаження завдань...
        </p>
      )}

      {status === 'error' && (
        <div className="status status-error" role="alert">
          <p>Не вдалося завантажити завдання: {error}</p>
          <button type="button" onClick={handleReload}>
            Спробувати ще раз
          </button>
        </div>
      )}

      {status === 'success' && (
        <>
          <p className="counter">
            Виконано <strong>{doneCount}</strong> із{' '}
            <strong>{todos.length}</strong> (показано: {visibleTodos.length})
          </p>
          <TodoList
            todos={visibleTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
          <button
            type="button"
            className="reload-btn"
            onClick={handleReload}
          >
            Завантажити з сервера знову
          </button>
        </>
      )}
    </main>
  );
}

export default App;