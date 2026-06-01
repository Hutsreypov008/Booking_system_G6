import bcrypt from "bcrypt";

const DEFAULT_SALT_ROUNDS = 10;

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, DEFAULT_SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, passwordHash);
};
