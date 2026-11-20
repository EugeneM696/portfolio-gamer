import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Quest from './models/Quest.js';

if (!process.env.MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Перевірте файл .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

await Quest.deleteMany({});
await User.deleteMany({});
await User.syncIndexes();
await Quest.syncIndexes();

const PASSWORD = 'Password!';
const hashPassword = () => bcrypt.hash(PASSWORD, 10);

const [admin, alice, bob] = await User.insertMany([
  { name: 'Адміністратор', email: 'admin@example.com', passwordHash: await hashPassword(), role: 'admin' },
  { name: 'Аліса', email: 'alice@example.com', passwordHash: await hashPassword() },
  { name: 'Богдан', email: 'bob@example.com', passwordHash: await hashPassword() },
]);

const created = await Quest.insertMany([
  { title: 'Пройти сюжетну кампанію Cyberpunk 2077', priority: 'high', done: true, owner: alice._id },
  { title: 'Зібрати всі досягнення в Elden Ring', priority: 'medium', done: false, owner: alice._id },
  { title: 'Провести нічний стрім по S.T.A.L.K.E.R. 2', priority: 'high', done: false, owner: bob._id },
  { title: 'Налаштувати мікрофон і бітрейт в OBS Studio', priority: 'low', done: true, owner: bob._id },
  { title: 'Зіграти 5 рейтингових матчів у Counter-Strike 2', priority: 'medium', done: false, owner: admin._id },
]);

console.log(`Додано користувачів: 3, квестів: ${created.length}`);
console.log(`Для входу використовуйте пароль ${PASSWORD} (admin@example.com, alice@example.com, bob@example.com)`);

await mongoose.disconnect();