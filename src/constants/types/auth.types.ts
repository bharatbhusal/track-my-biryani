export type AuthUser = {
  id: string;
  name: string;
  username: string;
  bucketId: string;
};

export type ProfileUser = AuthUser & {
  avatar?: string;
  googleLinked: boolean;
  googleEmail?: string;
  hasPassword: boolean;
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

export type UpdateCredentialsPayload = {
  name?: string;
  username?: string;
  password?: string;
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
