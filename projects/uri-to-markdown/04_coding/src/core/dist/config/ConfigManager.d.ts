import { SiteConfig } from '../types';
/**
 * 配置管理器
 *
 * 支持：
 * - YAML 配置文件
 * - 环境变量引用 (${VAR})
 * - 多站点配置
 */
export declare class ConfigManager {
    private config;
    private configPath?;
    /**
     * 加载配置文件
     */
    load(configPath?: string): Promise<void>;
    /**
     * 解析环境变量引用
     *
     * 支持格式：${VAR_NAME}
     */
    private resolveEnvVariables;
    /**
     * 解析单个环境变量
     */
    private resolveEnv;
    /**
     * 获取站点配置
     */
    getSiteConfig(domain: string): SiteConfig | undefined;
    /**
     * 获取全局配置
     */
    getGlobalConfig(): import("../types").GlobalConfig;
    /**
     * 获取所有站点配置
     */
    getAllSites(): SiteConfig[];
    /**
     * 获取默认配置文件路径
     */
    private getDefaultConfigPath;
    /**
     * 检查配置是否已加载
     */
    isLoaded(): boolean;
}
//# sourceMappingURL=ConfigManager.d.ts.map