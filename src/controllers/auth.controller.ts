import { loginSchema, signupSchema } from "@/lib/validators";
import { loginUser, registerUser } from "@/services/auth.service";
import { setAuthCookie } from "@/lib/auth";
import { logAuditEvent } from "@/services/audit.service";
import { NextRequest } from "next/server";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";

async function signup(payload: NextRequest) {
  const data = signupSchema.parse(payload);

  const result = await registerUser(data);

  await setAuthCookie(result.token);

  await logAuditEvent({
    actorId: result.user.id,
    action: AUDIT_ACTIONS.SIGNUP,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Signed up",
  });

  return result.user;
}

async function login(payload: unknown) {
  const data = loginSchema.parse(payload);

  const result = await loginUser(data);

  await setAuthCookie(result.token);

  await logAuditEvent({
    actorId: result.user.id,
    action: AUDIT_ACTIONS.LOGIN,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Logged in",
  });

  return result.user;
}

const authService = {
  signup,
  login,
};

export default authService;
