import { DdgSearchAdapter, DdgSearchResponse, SmartSearchInput } from './types.js';
interface DdgProviderResult {
    results?: Array<{
        title?: string;
        url?: string;
        snippet?: string;
    }>;
}
interface DdgProviderInstance {
    search(input: SmartSearchInput): Promise<DdgProviderResult>;
}
export interface DdgAdapterOptions {
    providerEntry?: string;
    providerFactory?: () => Promise<DdgProviderInstance>;
    now?: () => number;
}
export declare class DdgAdapter implements DdgSearchAdapter {
    private readonly providerFactory;
    private readonly now;
    constructor(options?: DdgAdapterOptions);
    search(input: SmartSearchInput): Promise<DdgSearchResponse>;
}
export {};
