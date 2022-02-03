export class TalkifyError extends Error {
  public statusCode?: number;

  constructor(err: Error, name?: string, message?: string, statusCode?: number) {
    super(message);
    this.name = name ?? err.name;
    this.message = message ?? err.message;
    this.stack = err.stack;
    this.statusCode = statusCode;
  }
}

export default TalkifyError;
