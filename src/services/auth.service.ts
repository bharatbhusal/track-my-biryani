import { AppError } from '@/lib/errors';
import { comparePassword, hashPassword, signToken } from '@/lib/auth';
import { createUser, findUserByEmail } from '@/repositories/user.repository';
import type { LoginInput, SignupInput } from '@/lib/validators';

export async function registerUser(input: SignupInput): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
  }

  const password = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    email: input.email,
    password,
  });

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
}

export async function loginUser(input: LoginInput): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
  const user = await findUserByEmail(input.email);
  if (!user?.password) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
}
