import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/core/src/config/ConfigManager';

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
    process.env.TEST_USER = 'testuser';
    process.env.TEST_PASS = 'testpass';
  });

  afterEach(() => {
    delete process.env.TEST_USER;
    delete process.env.TEST_PASS;
  });

  describe('resolveEnvVariables', () => {
    it('应该解析环境变量引用', () => {
      const config = {
        global: { timeout: 30000 },
        sites: [{
          domain: 'test.com',
          username: '${TEST_USER}',
          password: '${TEST_PASS}'
        }]
      };

      const resolved = (manager as any).resolveEnvVariables(config);

      expect(resolved.sites[0].username).toBe('testuser');
      expect(resolved.sites[0].password).toBe('testpass');
    });

    it('应该保留非环境变量引用', () => {
      const config = {
        global: { timeout: 30000 },
        sites: [{
          domain: 'test.com',
          username: 'plainuser',
          password: 'plainpass'
        }]
      };

      const resolved = (manager as any).resolveEnvVariables(config);

      expect(resolved.sites[0].username).toBe('plainuser');
      expect(resolved.sites[0].password).toBe('plainpass');
    });

    it('应该抛出错误当环境变量未设置', () => {
      const config = {
        global: { timeout: 30000 },
        sites: [{
          domain: 'test.com',
          username: '${UNDEFINED_VAR}',
          password: 'pass'
        }]
      };

      expect(() => (manager as any).resolveEnvVariables(config))
        .toThrow('环境变量 UNDEFINED_VAR 未设置');
    });
  });

  describe('getSiteConfig', () => {
    it('应该抛出错误当配置未加载', () => {
      expect(() => manager.getSiteConfig('test.com'))
        .toThrow('Config not loaded');
    });

    it('应该精确匹配域名', () => {
      // 模拟已加载配置
      (manager as any).config = {
        global: { timeout: 30000 },
        sites: [
          { domain: 'test.com', username: 'user1' },
          { domain: 'example.com', username: 'user2' }
        ]
      };

      const config = manager.getSiteConfig('test.com');
      expect(config?.username).toBe('user1');
    });

    it('应该支持子域名匹配', () => {
      (manager as any).config = {
        global: { timeout: 30000 },
        sites: [
          { domain: 'example.com', username: 'user1' }
        ]
      };

      const config = manager.getSiteConfig('sub.example.com');
      expect(config?.username).toBe('user1');
    });

    it('应该返回 undefined 当没有匹配', () => {
      (manager as any).config = {
        global: { timeout: 30000 },
        sites: [
          { domain: 'test.com', username: 'user1' }
        ]
      };

      const config = manager.getSiteConfig('other.com');
      expect(config).toBeUndefined();
    });
  });

  describe('isLoaded', () => {
    it('应该返回 false 当配置未加载', () => {
      expect(manager.isLoaded()).toBe(false);
    });

    it('应该返回 true 当配置已加载', () => {
      (manager as any).config = {
        global: { timeout: 30000 },
        sites: []
      };
      expect(manager.isLoaded()).toBe(true);
    });
  });
});
