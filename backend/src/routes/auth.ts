import { Router, Response } from 'express';
import { RequestWithUser } from '../middleware';
import { validateEmail, validatePassword, validateString } from '../utils/validators';
import logger from '../config/logger';
import { generateToken } from '../services/authService';
import { createUser, findUserByEmail, verifyUserPassword } from '../services/userService';
import { ConflictError, UnauthorizedError } from '../utils/errors';

const router = Router();

/**
 * Register new user
 */
router.post('/register', async (req: RequestWithUser, res: Response) => {
  try {
    const { email, name, password } = req.body;

    const email_validated = validateEmail(email);
    const name_validated = validateString(name, 'name', 2, 100);
    validatePassword(password);

    // Check if user already exists
    const existingUser = await findUserByEmail(email_validated);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user in database
    const user = await createUser(email_validated, password, name_validated);

    const token = generateToken(user.id, user.email);

    logger.info('User registered', { userId: user.id, email: email_validated });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req: RequestWithUser, res: Response) => {
  try {
    const { email, password } = req.body;

    const email_validated = validateEmail(email);
    validateString(password, 'password', 1, 255);

    // Verify user credentials
    const user = await verifyUserPassword(email_validated, password);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info('User logged in', { userId: user.id, email: email_validated });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }
});

/**
 * Get current user
 */
router.get('/me', (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      code: 'UNAUTHORIZED',
    });
  }

  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
    },
  });
  return;
});

export default router;
