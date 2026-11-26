export type AuthUser = {
  id: string;
  name: string;
  username: string;
  bucketId: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  username: string;
  password: string;
};

export type GoogleStartPayload = {
  mode: "login" | "link";
  redirectPath?: string;
};

export type GoogleLinkStatus = {
  linked: boolean;
  googleSub?: string;
  emailVerified: boolean;
  hasPassword: boolean;
};
