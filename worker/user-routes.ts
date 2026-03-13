import { Hono } from "hono";
import { jwt, sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import type { Env } from './core-utils';
import { UserEntity, FlashCardEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
const JWT_SECRET = "blunderbank-secret-key-repertoire-mastery";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // PUBLIC AUTH ROUTES
  app.post('/api/auth/signup', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) return bad(c, 'Username and password required');
    const existing = await UserEntity.findByUsername(c.env, username);
    if (existing) return bad(c, 'Username already exists');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await UserEntity.create(c.env, {
      id: crypto.randomUUID(),
      username,
      passwordHash,
    });
    const token = await sign({ userId: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) }, JWT_SECRET);
    const { passwordHash: _, ...userNoPass } = user;
    return ok(c, { user: userNoPass, token });
  });
  app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    const user = await UserEntity.findByUsername(c.env, username);
    if (!user || !user.passwordHash) return bad(c, 'Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return bad(c, 'Invalid credentials');
    const token = await sign({ userId: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) }, JWT_SECRET);
    const { passwordHash: _, ...userNoPass } = user;
    return ok(c, { user: userNoPass, token });
  });
  // PROTECTED ROUTES MIDDLEWARE
  app.use('/api/cards/*', jwt({ secret: JWT_SECRET }));
  // FLASHCARDS (Derived from JWT)
  app.get('/api/cards', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const { items } = await FlashCardEntity.list(c.env, null, 1000);
    const filtered = items.filter(card => card.userId === userId);
    return ok(c, filtered);
  });
  app.post('/api/cards', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const body = await c.req.json();
    if (!body.fen || !body.correctMove) return bad(c, 'Missing required fields');
    const card = {
      ...FlashCardEntity.initialState,
      ...body,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return ok(c, await FlashCardEntity.create(c.env, card));
  });
  app.put('/api/cards/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const id = c.req.param('id');
    const body = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Unauthorized');
    const updated = await entity.mutate(s => ({
      ...s,
      ...body,
      updatedAt: Date.now()
    }));
    return ok(c, updated);
  });
  app.delete('/api/cards/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const id = c.req.param('id');
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Unauthorized');
    return ok(c, { deleted: await FlashCardEntity.delete(c.env, id) });
  });
  app.post('/api/cards/:id/attempt', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const id = c.req.param('id');
    const { correct } = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Unauthorized');
    const updated = await entity.mutate(s => {
      const stats = { ...s.stats };
      stats.timesReviewed += 1;
      if (correct) stats.timesCorrect += 1;
      else stats.timesWrong += 1;
      stats.lastReviewedAt = Date.now();
      stats.lastResult = correct ? 'correct' : 'wrong';
      return { ...s, stats };
    });
    return ok(c, updated);
  });
}