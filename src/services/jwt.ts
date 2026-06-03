import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
}

const getAccessTokenSecret = (): string => {
  return env.jwt.secret;
};

const getResetTokenSecret = (): string => {
  return env.jwt.resetSecret;
};

export const signAccessToken = (
  payload: JwtPayload,
  expiresIn: string = env.jwt.expiresIn,
): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, getAccessTokenSecret(), options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as JwtPayload;
};

export const signResetToken = (
  payload: Omit<JwtPayload, "type">,
  expiresIn: string = env.jwt.resetExpiresIn,
): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, type: "reset-password" }, getResetTokenSecret(), options);
};

export const verifyResetToken = (token: string): JwtPayload => {
  return jwt.verify(token, getResetTokenSecret()) as JwtPayload;
};
