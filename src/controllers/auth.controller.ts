import { connectToDatabase } from '@/lib/db';
import { loginSchema, signupSchema } from '@/lib/validators';
import { loginUser, registerUser } from '@/services/auth.service';
import { setAuthCookie } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit.service';

export async function signupController(payload: unknown) {
  await connectToDatabase();
  const data = signupSchema.parse(payload);
  const result = await registerUser(data);
  await setAuthCookie(result.token);
  await logAuditEvent({
    actorId: result.user.id,
    action: 'signup',
    entity: 'auth',
    note: 'Signed up',
  });
  return result.user;
}

export async function loginController(payload: unknown) {
  await connectToDatabase();
  const data = loginSchema.parse(payload);
  const result = await loginUser(data);
  await setAuthCookie(result.token);
  await logAuditEvent({
    actorId: result.user.id,
    action: 'login',
    entity: 'auth',
    note: 'Logged in',
  });
  return result.user;
}
