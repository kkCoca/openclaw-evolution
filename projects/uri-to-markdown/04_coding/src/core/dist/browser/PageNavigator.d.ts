import { Page } from 'playwright';
import { SiteConfig, Credentials } from '../types';
export declare class PageNavigator {
    navigate(page: Page, url: string, siteConfig?: SiteConfig): Promise<void>;
    formLogin(page: Page, loginUrl: string, credentials: Credentials): Promise<void>;
}
//# sourceMappingURL=PageNavigator.d.ts.map