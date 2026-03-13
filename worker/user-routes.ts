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
      console.log('SIGNUP start:', { username });
      if (!username || !password) return bad(c, 'Username and password required');
      const existing = await UserEntity.findByUsername(c.env, username);
      console.log('SIGNUP existing user:', existing ? { id: existing.id, username: existing.username } : null);
      if (existing) return bad(c, 'Username taken');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      console.log('SIGNUP after hash:', { username });
      const user = await UserEntity.create(c.env, {
        id: crypto.randomUUID(),
        username,
        passwordHash,
      });
      console.log('SIGNUP created user:', { id: user.id, username: user.username });
      const token = await sign({
        userId: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
      }, JWT_SECRET, "HS256");
      console.log('SIGNUP token length:', token.length > 0);
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
      console.log('LOGIN start:', { username });
      const user = await UserEntity.findByUsername(c.env, username);
      console.log('LOGIN found user:', !!user);
      if (!user) return bad(c, 'Username not found');
      if (!user.passwordHash) return bad(c, 'Account configuration error');
      const valid = await bcrypt.compare(password, user.passwordHash);
      console.log('LOGIN hash compare:', valid);
      if (!valid) return bad(c, 'Wrong password');
      const token = await sign({
        userId: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
      }, JWT_SECRET, "HS256");
      console.log('LOGIN token length:', token.length > 0);
      const { passwordHash: _, ...userNoPass } = user;
      return ok(c, { user: userNoPass, token });
    } catch (err) {
      console.error('LOGIN error:', err);
      return bad(c, 'Internal server error');
    }
  });
  // PROTECTED ROUTES MIDDLEWARE
  // FIXED: Explicitly set 'alg' as required by newer Hono JWT versions
  app.use('/api/*', (c, next) => {
    if (c.req.path.startsWith('/api/auth/signup') || c.req.path.startsWith('/api/auth/login')) {
      return next();
    }
    return jwt({ secret: JWT_SECRET, alg: "HS256" })(c, next);
  });
  // ACCOUNT MANAGEMENT
  app.put('/api/auth/account/username', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const { newUsername } = await c.req.json();
    if (!newUsername) return bad(c, 'New username is required');
    const existing = await UserEntity.findByUsername(c.env, newUsername);
    if (existing && existing.id !== payload.userId) return bad(c, 'Username taken');
    const entity = new UserEntity(c.env, payload.userId);
    const updated = await entity.mutate(s => ({ ...s, username: newUsername }));
    const { passwordHash: _, ...userNoPass } = updated;
    return ok(c, userNoPass);
  });
  app.put('/api/auth/account/password', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const { oldPassword, newPassword } = await c.req.json();
    if (!oldPassword || !newPassword) return bad(c, 'Both passwords required');
    const entity = new UserEntity(c.env, payload.userId);
    const user = await entity.getState();
    if (!user.passwordHash) return bad(c, 'User has no password');
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return bad(c, 'Incorrect current password');
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    await entity.mutate(s => ({ ...s, passwordHash: newPasswordHash }));
    return ok(c, { message: 'Password updated' });
  });
  app.delete('/api/auth/account', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const userId = payload.userId;
    console.warn(`[ACCOUNT DELETE] Deleting user ${userId}`);
    // Cascade delete cards
    const { items: allCards } = await FlashCardEntity.list(c.env, null, 1000);
    const userCardIds = allCards.filter(card => card.userId === userId).map(c => c.id);
    if (userCardIds.length > 0) {
      await FlashCardEntity.deleteMany(c.env, userCardIds);
      console.log(`[ACCOUNT DELETE] Removed ${userCardIds.length} cards`);
    }
    await UserEntity.delete(c.env, userId);
    return ok(c, { message: 'Account and data deleted' });
  });
  // FLASHCARDS
  app.get('/api/cards', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const { items } = await FlashCardEntity.list(c.env, null, 1000);
    const filtered = items.filter(card => card.userId === payload.userId);
    return ok(c, filtered);
  });
  app.post('/api/cards', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const body = await c.req.json();
    if (!body.fen || !body.correctMove) return bad(c, 'FEN and correctMove required');
    
    // Check for duplicate FEN for this user
    const { items: userCards } = await FlashCardEntity.list(c.env, null, 1000);
    const duplicate = userCards.filter(card => card.userId === payload.userId).find(card => card.fen === body.fen);
    if (duplicate) return bad(c, 'FEN already exists for this user');
    
    const card = {
      ...FlashCardEntity.initialState,
      ...body,
      id: crypto.randomUUID(),
      userId: payload.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return ok(c, await FlashCardEntity.create(c.env, card));
  });
  app.put('/api/cards/:id', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const id = c.req.param('id');
    const body = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== payload.userId) return bad(c, 'Unauthorized');
    const updated = await entity.mutate(s => ({ ...s, ...body, updatedAt: Date.now() }));
    return ok(c, updated);
  });
  app.delete('/api/cards/:id', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const id = c.req.param('id');
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== payload.userId) return bad(c, 'Unauthorized');
    return ok(c, { deleted: await FlashCardEntity.delete(c.env, id) });
  });
  app.post('/api/cards/:id/attempt', async (c) => {
    const payload = c.get('jwtPayload') as { userId: string };
    const id = c.req.param('id');
    const { correct } = await c.req.json();
    const entity = new FlashCardEntity(c.env, id);
    const state = await entity.getState();
    if (!state.id) return notFound(c);
    if (state.userId !== payload.userId) return bad(c, 'Unauthorized');
    const updated = await entity.mutate(s => {
      const stats = { ...s.stats, ...FlashCardEntity.initialState.stats };
      stats.timesReviewed += 1;
      if (correct) stats.timesCorrect += 1;
      else stats.timesWrong += 1;
      stats.lastReviewedAt = Date.now();
      stats.lastResult = correct ? 'correct' : 'wrong';
      return { ...s, stats };
    });
    return ok(c, updated || state);
  });
}