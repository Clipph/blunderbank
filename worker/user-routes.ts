import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, FlashCardEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // FLASHCARDS
  app.get('/api/users/:userId/cards', async (c) => {
    const userId = c.req.param('userId');
    const { items } = await FlashCardEntity.list(c.env, null, 1000);
    const filtered = items.filter(card => card.userId === userId);
    return ok(c, filtered);
  });
  app.post('/api/cards', async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.fen || !body.correctMove) return bad(c, 'Missing required fields');
    const card = {
      ...FlashCardEntity.initialState,
      ...body,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return ok(c, await FlashCardEntity.create(c.env, card));
  });
  app.put('/api/cards/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const updated = await entity.mutate(s => ({
      ...s,
      ...body,
      updatedAt: Date.now()
    }));
    return ok(c, updated);
  });
  app.delete('/api/cards/:id', async (c) => {
    return ok(c, { deleted: await FlashCardEntity.delete(c.env, c.req.param('id')) });
  });
  app.post('/api/cards/:id/attempt', async (c) => {
    const id = c.req.param('id');
    const { correct } = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
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