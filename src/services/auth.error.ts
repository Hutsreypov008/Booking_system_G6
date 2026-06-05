export class AuthModuleError extends Error {
  public readonly cause?: unknown;

  constructor(
    message: string,
    public readonly statusCode: number,
    cause?: unknown,
  ) {
    super(message);
    this.name = "AuthModuleError";
    this.cause = cause;
  }
}
