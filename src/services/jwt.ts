import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
}

const DEFAULT_ACCESS_SECRET = "booking-system-access-secret";
const DEFAULT_RESET_SECRET = "booking-system-reset-secret";

const getAccessTokenSecret = (): string => {
  return process.env.JWT_SECRET || DEFAULT_ACCESS_SECRET;
};

const getResetTokenSecret = (): string => {
  return process.env.JWT_RESET_SECRET || DEFAULT_RESET_SECRET;
};

export const signAccessToken = (payload: JwtPayload, expiresIn: string = "1d"): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, getAccessTokenSecret(), options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as JwtPayload;
};

export const signResetToken = (
  payload: Omit<JwtPayload, "type">,
  expiresIn: string = "15m",
): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, type: "reset-password" }, getResetTokenSecret(), options);
};

export const verifyResetToken = (token: string): JwtPayload => {
  return jwt.verify(token, getResetTokenSecret()) as JwtPayload;
};
