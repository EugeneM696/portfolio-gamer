import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import Quest from './models/Quest.js';

const PORT = Number(process.env.PORT) || 3012;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Створіть файл .env за зразком .env.example');
  process.exit(1);
}

const app = express();

// Middleware логування (Тип 4 з ЛР № 11: ISO-час, метод, URL, статус, мс, req.ip)
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

// Екранує спеціальні символи регулярних виразів у пошуковому запиті
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 1. Список квестів із пошуком (?q=) за полем title та обмеженням кількості (?limit=)
app.get('/api/quests', async (req, res) => {
  const { q, limit } = req.query;
  const filter = q ? { title: { $regex: escapeRegex(String(q)), $options: 'i' } } : {};
  const max = Math.min(Number(limit) || 50, 100);
  const quests = await Quest.find(filter).sort({ createdAt: -1 }).limit(max);
  res.json(quests);
});

// 2. Отримання одного квесту за ідентифікатором ObjectId
app.get('/api/quests/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Некоректний формат id' });
  }
  const quest = await Quest.findById(id);
  if (!quest) {
    return res.status(404).json({ error: `Квест з id=${id} не знайдено` });
  }
  res.json(quest);
});

// 3. Створення нового квесту (передаємо лише дозволені схемою поля)
app.post('/api/quests', async (req, res) => {
  const { title, priority, done } = req.body ?? {};
  const quest = await Quest.create({ title, priority, done });
  res.status(201).json(quest);
});

// Навмисна помилка для перевірки централізованого обробника помилок (500)
app.get('/api/error', () => {
  throw new Error('Тестова помилка сервера');
});

// Обробник 404: жоден маршрут вище не підійшов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено', path: req.originalUrl });
});

// Централізований обробник помилок (чотири параметри)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Дані не пройшли перевірку', details });
  }
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка сервера' : err.message,
  });
});

// Підключаємося до MongoDB і запускаємо сервер
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`Підключено до MongoDB, база даних: ${mongoose.connection.name}`);
} catch (err) {
  console.error('Не вдалося підключитися до MongoDB:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});