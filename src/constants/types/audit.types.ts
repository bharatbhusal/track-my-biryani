const AUDIT_ACTIONS = {
  SIGNUP: "signup",
  LOGIN: "login",
  LOGOUT: "logout",
} as const;

const AUDIT_ENTITIES = {
  AUTH: "auth",
  USER: "user",
  EXPENSE: "expense",
  CATEGORY: "category",
  BUCKET: "bucket",
} as const;

type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];

export { AUDIT_ACTIONS, AUDIT_ENTITIES };
export type { AuditAction, AuditEntity };
