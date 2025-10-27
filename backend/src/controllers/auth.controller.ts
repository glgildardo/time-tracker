import { User } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../utils/jwt';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errorHandler';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

class AuthController {
  async register(data: RegisterData) {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('A user with this email already exists', 'User already exists');
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Generate token
    const token = generateToken((user._id as string).toString());

    return {
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Email or password is incorrect');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email or password is incorrect');
    }

    // Generate token
    const token = generateToken((user._id as string).toString());

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }
}

export const authController = new AuthController();

