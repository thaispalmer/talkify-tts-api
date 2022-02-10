/**
 * Enumerators for {@link TalkifyError} names to identify specific errors.
 */
export enum TalkifyErrors {
  /**
   * Thrown when no API Key is given during {@link Talkify} class initialization.
   */
  KeyMissing = 'KEY_MISSING',

  /**
   * Thrown when it fails validating a option.
   */
  ValidationError = 'VALIDATION_ERROR',

  /**
   * Thrown when the HTTP request has failed.
   */
  RequestError = 'REQUEST_ERROR',
}

/**
 * Custom Error class for Talkify responses
 */
export class TalkifyError extends Error {
  /**
   * The specific error name.
   *
   * @remarks
   * There are a enumerated list of available errors that can be thrown through this class, suited for better error handling.
   *
   * @see {@link TalkifyErrors} enumerator for the available names and the situations they will be used.
   */
  public name: string;

  /**
   * A more detailed information about the error.
   */
  public message: string;

  /**
   * The error stack, if available.
   */
  public stack?: string;

  /**
   * The HTTP status code of the response. This will be populated only if {@link TalkifyError.name} is {@link TalkifyErrors.RequestError} (`REQUEST_ERROR`).
   * @defaultValue `undefined`
   */
  public statusCode?: number;

  /**
   * Creates an instance for the {@link TalkifyError} class.
   *
   * @param err - Original `Error` object.
   * @param [name] - Name identifier for this error.
   * @param [message] - Detailed message about this error.
   * @param [statusCode] - HTTP status code.
   */
  constructor(err: Error, name?: string, message?: string, statusCode?: number) {
    super(message);
    this.name = name ?? err.name;
    this.message = message ?? err.message;
    this.stack = err.stack;
    this.statusCode = statusCode;
  }
}

export default TalkifyError;
