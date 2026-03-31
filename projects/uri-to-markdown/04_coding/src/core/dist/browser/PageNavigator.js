export class PageNavigator {
    async navigate(page, url, siteConfig) {
        // 如果需要登录，先执行登录
        if (siteConfig?.loginUrl && siteConfig.username && siteConfig.password) {
            await this.formLogin(page, siteConfig.loginUrl, {
                username: siteConfig.username,
                password: siteConfig.password,
                selectors: siteConfig.selectors
            });
        }
        // 导航到目标页面
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
    }
    async formLogin(page, loginUrl, credentials) {
        await page.goto(loginUrl);
        // 默认选择器（致远 OA）
        const selectors = credentials.selectors || {
            usernameSelector: '#login_username',
            passwordSelector: '#login_password1',
            submitSelector: '#login_button'
        };
        // 填写表单
        await page.fill(selectors.usernameSelector, credentials.username);
        await page.fill(selectors.passwordSelector, credentials.password);
        await page.click(selectors.submitSelector);
        // 等待登录完成
        await page.waitForLoadState('networkidle');
    }
}
//# sourceMappingURL=PageNavigator.js.map