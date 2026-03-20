export class ProviderError extends Error {
    code;
    retryable;
    details;
    constructor(code, message, retryable, details) {
        super(message);
        this.name = 'ProviderError';
        this.code = code;
        this.retryable = retryable;
        this.details = details;
    }
}
