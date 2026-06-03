export enum Role {
  USER = "USER",
  OWNER = "OWNER",
}

export const roleValues = Object.values(Role);

export const isRole = (value: unknown): value is Role => {
  return typeof value === "string" && roleValues.includes(value as Role);
};
