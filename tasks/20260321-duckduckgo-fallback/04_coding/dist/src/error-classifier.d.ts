import { ClassifiedError, SmartSearchError } from './types.js';
type UnknownErrorLike = Error | SmartSearchError | string | Record<string, unknown> | null | undefined;
export declare function classifyError(error: UnknownErrorLike): ClassifiedError;
export declare function classifyEmptyResponse(): ClassifiedError;
export declare function createCircuitOpenClassification(): ClassifiedError;
export {};
