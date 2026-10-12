import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, createStaffSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { loginLimiter, registerLimiter, requireXhrHeader } from '../../middleware/security.js';
import { config } from '../../config/index.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict',
  path: '/api/auth',
};

function setRefreshCookie(res, token) {
  res.cookie(config.refresh.cookieName, token, {
    ...cookieOptions,
    maxAge: config.refresh.ttlDays * 86_400_000,
  });
}

const meta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

authRouter.post('/register', registerLimiter, validate(registerSchema), async (req, res) => {
  const user = await authService.registerCitizen(req.body);
  res.status(201).json({ user });
});

authRouter.post('/login', loginLimiter, requireXhrHeader, validate(loginSchema), async (req, res) => {
  const { refreshToken, accessToken, user } = await authService.login(req.body, meta(req));
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

authRouter.post('/refresh', requireXhrHeader, async (req, res) => {
  if (!req.cookies?.[config.refresh.cookieName]) return res.status(204).end();
  try {
    const { refreshToken, accessToken, user } = await authService.refresh(
      req.cookies?.[config.refresh.cookieName],
      meta(req),
    );
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    res.clearCookie(config.refresh.cookieName, cookieOptions);
    throw err;
  }
});

authRouter.post('/logout', requireXhrHeader, async (req, res) => {
  await authService.logout(req.cookies?.[config.refresh.cookieName]);
  res.clearCookie(config.refresh.cookieName, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.getUserById(req.user.sub) });
});

authRouter.get('/staff', requireAuth, requireRole('officer'), async (_req, res) => {
  res.json({ staff: await authService.listStaff() });
});

authRouter.post('/staff', requireAuth, requireRole('officer'), validate(createStaffSchema), async (req, res) => {
  const user = await authService.createStaff(req.body, req.user);
  res.status(201).json({ user });
});
