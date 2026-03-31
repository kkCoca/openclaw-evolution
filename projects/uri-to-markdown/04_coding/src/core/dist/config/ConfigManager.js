import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
/**
 * 配置管理器
 *
 * 支持：
 * - YAML 配置文件
 * - 环境变量引用 (${VAR})
 * - 多站点配置
 */
export class ConfigManager {
    constructor() {
        this.config = null;
    }
    /**
     * 加载配置文件
     */
    async load(configPath) {
        this.configPath = configPath || this.getDefaultConfigPath();
        if (!fs.existsSync(this.configPath)) {
            throw new Error(`Config file not found: ${this.configPath}`);
        }
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const rawConfig = yaml.load(content);
        this.config = this.resolveEnvVariables(rawConfig);
    }
    /**
     * 解析环境变量引用
     *
     * 支持格式：${VAR_NAME}
     */
    resolveEnvVariables(config) {
        const resolved = { ...config };
        if (config.sites) {
            resolved.sites = config.sites.map((site) => ({
                ...site,
                username: this.resolveEnv(site.username),
                password: this.resolveEnv(site.password)
            }));
        }
        return resolved;
    }
    /**
     * 解析单个环境变量
     */
    resolveEnv(value) {
        if (!value)
            return value;
        const match = value.match(/^\$\{(.+)\}$/);
        if (match) {
            const envValue = process.env[match[1]];
            if (!envValue) {
                throw new Error(`环境变量 ${match[1]} 未设置`);
            }
            return envValue;
        }
        return value;
    }
    /**
     * 获取站点配置
     */
    getSiteConfig(domain) {
        if (!this.config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        // 精确匹配
        let siteConfig = this.config.sites.find(site => site.domain === domain);
        // 如果没有精确匹配，尝试后缀匹配（支持子域名）
        if (!siteConfig) {
            siteConfig = this.config.sites.find(site => domain.endsWith(site.domain));
        }
        return siteConfig;
    }
    /**
     * 获取全局配置
     */
    getGlobalConfig() {
        if (!this.config) {
            throw new Error('Config not loaded');
        }
        return this.config.global;
    }
    /**
     * 获取所有站点配置
     */
    getAllSites() {
        if (!this.config) {
            throw new Error('Config not loaded');
        }
        return this.config.sites;
    }
    /**
     * 获取默认配置文件路径
     */
    getDefaultConfigPath() {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
        return path.join(homeDir, '.uri2md', 'config.yaml');
    }
    /**
     * 检查配置是否已加载
     */
    isLoaded() {
        return this.config !== null;
    }
}
//# sourceMappingURL=ConfigManager.js.map