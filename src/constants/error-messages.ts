// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid username or password",
  UNAUTHORIZED: "You are not authorized to perform this action",
  SESSION_EXPIRED: "Your session has expired. Please log in again",
  TOKEN_INVALID: "Invalid or expired authentication token",
} as const;

// ─────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────

const SIGNUP_ERRORS = {
  NAME_TOO_SHORT: (min: number) => `Name must be at least ${min} characters`,

  NAME_TOO_LONG: (max: number) => `Name must not exceed ${max} characters`,

  USERNAME_TOO_SHORT: (min: number) => `Username must be at least ${min} characters`,

  USERNAME_TOO_LONG: (max: number) => `Username must not exceed ${max} characters`,

  USERNAME_INVALID: "Username can only contain lowercase letters, numbers, and underscores",

  USERNAME_TAKEN: "Username is already taken",

  PASSWORD_TOO_SHORT: (min: number) => `Password must be at least ${min} characters`,

  PASSWORD_TOO_LONG: (max: number) => `Password must not exceed ${max} characters`,
} as const;

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const VALIDATION_ERRORS = {
  GENERIC: "Validation Error",

  INVALID_REQUEST: "Invalid request",
  INVALID_INPUT: "One or more fields contain invalid values",

  REQUIRED_FIELD: (field: string) => `${field} is required`,

  INVALID_FIELD: (field: string) => `${field} is invalid`,

  FIELD_TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,

  FIELD_TOO_LONG: (field: string, max: number) => `${field} must not exceed ${max} characters`,
} as const;

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

const USER_ERRORS = {
  NOT_FOUND: "User not found",
  ALREADY_EXISTS: "User already exists",

  NOT_FOUND_BY_ID: (id: string) => `User with ID "${id}" was not found`,

  EMAIL_ALREADY_EXISTS: "An account with this email already exists",
} as const;

// ─────────────────────────────────────────────
// Server
// ─────────────────────────────────────────────

const SERVER_ERRORS = {
  INTERNAL_ERROR: "Something went wrong. Please try again later",
  DATABASE_ERROR: "A database error occurred",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
} as const;

// ─────────────────────────────────────────────
// Filters / search
// ─────────────────────────────────────────────

const FILTER_ERRORS = {
  INVALID_SORT_FIELD: (field: string) => `Invalid sort field: ${field}`,

  INVALID_DATE_RANGE: "Invalid date range",

  INVALID_ID: "Invalid ID",
} as const;

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export { AUTH_ERRORS, SIGNUP_ERRORS, VALIDATION_ERRORS, USER_ERRORS, SERVER_ERRORS, FILTER_ERRORS };
