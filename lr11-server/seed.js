import mongoose from 'mongoose';
import Quest from './models/Quest.js';

if (!process.env.MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Запускайте скрипт через: npm run seed');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Підключено до бази: ${mongoose.connection.name}`);

  await Quest.deleteMany({});

  const created = await Quest.insertMany([
    { title: 'Пройти сюжетну кампанію Cyberpunk 2077', priority: 'high', done: true },
    { title: 'Зібрати всі досягнення в Elden Ring', priority: 'medium', done: false },
    { title: 'Провести нічний стрім по S.T.A.L.K.E.R. 2', priority: 'high', done: false },
    { title: 'Налаштувати мікрофон і бітрейт в OBS Studio', priority: 'low', done: true },
    { title: 'Зіграти 5 рейтингових матчів у Counter-Strike 2', priority: 'medium', done: false },
  ]);

  console.log(`Додано початкових записів: ${created.length}`);
} catch (err) {
  console.error('Помилка під час наповнення бази даних:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}