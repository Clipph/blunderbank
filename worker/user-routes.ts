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
    try {
      const { username, password } = await c.req.json();
      console.log('SIGNUP body:', {username: username?.slice(0,10)+'...', passwordLength: password?.length});
      if (!username || !password) return bad(c, 'Username and password required');
      
      const existing = await UserEntity.findByUsername(c.env, username);
      console.log('SIGNUP existing user:', !!existing);
      if (existing) return bad(c, 'Username already exists');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      console.log('SIGNUP hash created');
      
      const user = await UserEntity.create(c.env, {
        id: crypto.randomUUID(),
        username,
        passwordHash,
      });
      console.log('SIGNUP user created:', user.id);
      
      const token = await sign({
        userId: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
      }, JWT_SECRET);
      console.log('SIGNUP token generated');
      
      const { passwordHash: _, ...userNoPass } = user;
      return ok(c, { user: userNoPass, token });
    } catch (err) {
      console.error('SIGNUP error:', err);
      return bad(c, 'Internal server error');
    }
  });

  app.post('/api/auth/login', async (c) => {
    try {
      const { username, password } = await c.req.json();
      console.log('LOGIN body:', {username: username?.slice(0,10)+'...', passwordLength: password?.length});
      
      const user = await UserEntity.findByUsername(c.env, username);
      console.log('LOGIN found user:', !!user);
      if (!user || !user.passwordHash) return bad(c, 'Invalid credentials');
      
      const valid = await bcrypt.compare(password, user.passwordHash);
      console.log('LOGIN password valid:', valid);
      if (!valid) return bad(c, 'Invalid credentials');
      
      const token = await sign({
        userId: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
      }, JWT_SECRET);
      console.log('LOGIN token generated');
      
      const { passwordHash: _, ...userNoPass } = user;
      return ok(c, { user: userNoPass, token });
    } catch (err) {
      console.error('LOGIN error:', err);
      return bad(c, 'Internal server error');
    }
  });

  // PROTECTED ROUTES MIDDLEWARE
  app.use('/api/cards*', jwt({ secret: JWT_SECRET }));

  // FLASHCARDS (Derived from JWT)
  app.get('/api/cards', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const userId = payload.userId;
    const { items } = await FlashCardEntity.list(c.env, null, 1000);
    const filtered = items.filter(card => card.userId === userId);
    return ok(c, filtered);
  });

  app.post('/api/cards', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
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
    const payload = c.get('jwtPayload') as { userId: string };
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
    const payload = c.get('jwtPayload') as { userId: string };
    const userId = payload.userId;
    const id = c.req.param('id');
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Unauthorized');
    return ok(c, { deleted: await FlashCardEntity.delete(c.env, id) });
  });

  app.post('/api/cards/:id/attempt', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
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
//