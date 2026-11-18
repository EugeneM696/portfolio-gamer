import express from 'express';
import path from 'node:path';

const app = express();
const PORT = Number(process.env.PORT) || 3012;

// Початкова колекція квестів (Варіант № 12 — portfolio-gamer)
const quests = [
  { id: 1, title: 'Пройти сюжетну кампанію Cyberpunk 2077', priority: 'high', done: true },
  { id: 2, title: 'Зібрати всі досягнення в Elden Ring', priority: 'medium', done: false },
  { id: 3, title: 'Провести нічний стрім по S.T.A.L.K.E.R. 2', priority: 'high', done: false },
  { id: 4, title: 'Налаштувати мікрофон і бітрейт в OBS Studio', priority: 'low', done: true },
  { id: 5, title: 'Зіграти 5 рейтингових матчів у Counter-Strike 2', priority: 'medium', done: false },
];

let nextId = quests.length + 1;

// Middleware логування (Тип 4: ISO-час, метод, URL, статус, мс, req.ip)
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms} мс ${req.ip}`
    );
  });
  next();
}

app.use(logger);
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));

// 1. Отримання списку квестів (із пошуком ?q= за полем title)
app.get('/api/quests', (req, res) => {
  const { q } = req.query;
  if (q) {
    const search = String(q).trim().toLowerCase();
    const result = quests.filter((item) =>
      item.title.toLowerCase().includes(search)
    );
    return res.json(result);
  }
  res.json(quests);
});

// 2. Створення нового квесту з валідацією полів та типів
app.post('/api/quests', (req, res) => {
  const { title, priority, done } = req.body ?? {};

  if (
    typeof title !== 'string' || title.trim() === '' ||
    typeof priority !== 'string' || priority.trim() === ''
  ) {
    return res.status(400).json({
      error: "Поля title і priority є обов'язковими і мають бути непорожніми рядками",
    });
  }

  if (typeof done !== 'boolean') {
    return res.status(400).json({
      error: "Поле done є обов'язковим і має бути логічним значенням (true або false)",
    });
  }

  const quest = {
    id: nextId++,
    title: title.trim(),
    priority: priority.trim(),
    done,
  };

  quests.push(quest);
  res.status(201).json(quest);
});

// 3. Отримання одного квесту за параметром :id
app.get('/api/quests/:id', (req, res) => {
  const id = Number(req.params.id);
  const quest = quests.find((item) => item.id === id);

  if (!quest) {
    return res.status(404).json({
      error: `Квест з id=${req.params.id} не знайдено`,
    });
  }

  res.json(quest);
});

// Тестовий маршрут для перевірки помилки 500
app.get('/api/error', () => {
  throw new Error('Тестова помилка сервера');
});

// 404: якщо жоден маршрут вище не підійшов
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не знайдено',
    path: req.originalUrl,
  });
});

// Централізований обробник помилок (4 параметри — завжди останній)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка сервера' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});