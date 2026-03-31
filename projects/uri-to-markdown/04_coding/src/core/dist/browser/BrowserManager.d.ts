import { Page } from 'playwright';
export interface BrowserConfig {
    headless?: boolean;
    userDataDir?: string;
    proxy?: string;
}
export declare class BrowserManager {
    private browser;
    private context;
    private config;
    constructor(config?: BrowserConfig);
    initialize(): Promise<void>;
    createPage(): Promise<Page>;
    close(): Promise<void>;
    isInitialized(): boolean;
}
//# sourceMappingURL=BrowserManager.d.ts.map