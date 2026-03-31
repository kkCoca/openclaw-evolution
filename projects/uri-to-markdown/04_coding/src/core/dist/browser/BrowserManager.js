import { chromium } from 'playwright';
export class BrowserManager {
    constructor(config = {}) {
        this.browser = null;
        this.context = null;
        this.config = {
            headless: true,
            ...config
        };
    }
    async initialize() {
        if (this.browser) {
            return;
        }
        this.browser = await chromium.launch({
            headless: this.config.headless,
        });
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }
    async createPage() {
        if (!this.context) {
            throw new Error('Browser not initialized. Call initialize() first.');
        }
        return this.context.newPage();
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
        }
    }
    isInitialized() {
        return this.browser !== null;
    }
}
//# sourceMappingURL=BrowserManager.js.map