import { loginSchema, signupSchema } from "@/lib/validators";
import { loginUser, registerUser } from "@/services/auth.service";
import { clearAuthCookie, getAuthPayload, setAuthCookie } from "@/lib/auth";
import { logAuditEvent } from "@/services/audit.service";
import { NextRequest } from "next/server";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";

async function signup(request: NextRequest) {
  const payload = await request.json();
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

async function login(request: NextRequest) {
  const payload = await request.json();
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

async function logout() {
  const authUser = await getAuthPayload();

  await clearAuthCookie();

  await logAuditEvent({
    actorId: authUser.userId,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: AUDIT_ENTITIES.AUTH,
    note: "Logged out",
  });
  return { message: "Logged out" };
}

const authController = {
  signup,
  login,
  logout,
};

export default authController;
