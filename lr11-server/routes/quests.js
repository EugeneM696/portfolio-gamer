import { Router } from 'express';
import mongoose from 'mongoose';
import Quest from '../models/Quest.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const FIELDS = ['title', 'priority', 'done'];
const SORT_FIELDS = ['title', 'priority', 'createdAt'];

const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body?.[f] !== undefined).map((f) => [f, body[f]]));

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function validateId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: 'Некоректний формат id' });
  }
  next();
}

async function findQuest(req, res, next) {
  const quest = await Quest.findById(req.params.id);
  if (!quest) {
    return res.status(404).json({ error: `Квест з id=${req.params.id} не знайдено` });
  }
  req.quest = quest;
  next();
}

function requireOwnerOrAdmin(req, res, next) {
  const isOwner = req.quest.owner?.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Змінювати запис може лише його власник або адміністратор' });
  }
  next();
}

const withQuest = [validateId, findQuest];
const ownQuest = [requireAuth, validateId, findQuest, requireOwnerOrAdmin];

// GET /api/quests — публічний список
router.get('/', async (req, res) => {
  const { q, priority, done, sort = '-createdAt' } = req.query;
  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit) || 10, 1), 100);

  const sortName = String(sort);
  const sortField = sortName.replace(/^-/, '');
  if (!SORT_FIELDS.includes(sortField)) {
    return res.status(400).json({ error: `sort: допустимі поля ${SORT_FIELDS.join(', ')}` });
  }

  const filter = {};
  if (q) filter.title = { $regex: escapeRegex(String(q)), $options: 'i' };
  if (priority) filter.priority = String(priority);
  if (done !== undefined) filter.done = done === 'true';

  const [items, total] = await Promise.all([
    Quest.find(filter)
      .sort({ [sortField]: sortName.startsWith('-') ? -1 : 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Quest.countDocuments(filter),
  ]);

  res.set('X-Total-Count', String(total));
  res.json(items);
});

// GET /api/quests/mine — приватний маршрут: лише квести поточного користувача (обов'язково ПЕРЕД '/:id')
router.get('/mine', requireAuth, async (req, res) => {
  const quests = await Quest.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(quests);
});

// GET /api/quests/:id — публічний перегляд одного запису
router.get('/:id', withQuest, (req, res) => {
  res.json(req.quest);
});

// POST /api/quests — створення (власник береться з токена)
router.post('/', requireAuth, async (req, res) => {
  const quest = await Quest.create({ ...pick(req.body), owner: req.user._id });
  res.status(201).location(`${req.baseUrl}/${quest.id}`).json(quest);
});

// PUT /api/quests/:id — повна заміна
router.put('/:id', ownQuest, async (req, res) => {
  const data = pick(req.body);
  req.quest.set(Object.fromEntries(FIELDS.map((f) => [f, data[f]])));
  await req.quest.save();
  res.json(req.quest);
});

// PATCH /api/quests/:id — часткове оновлення
router.patch('/:id', ownQuest, async (req, res) => {
  const data = pick(req.body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: `Передайте хоча б одне з полів: ${FIELDS.join(', ')}` });
  }
  req.quest.set(data);
  await req.quest.save();
  res.json(req.quest);
});

// DELETE /api/quests/:id — видалення
router.delete('/:id', ownQuest, async (req, res) => {
  await req.quest.deleteOne();
  res.status(204).end();
});

export default router;