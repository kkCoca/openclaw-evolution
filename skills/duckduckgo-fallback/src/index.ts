/**
 * DuckDuckGo Fallback - 智能 web_search fallback 机制
 * 
 * 功能：当 Gemini web_search 失败时，自动切换到 DuckDuckGo Provider
 * 触发条件：429/503/Timeout/Network Error
 */

import { spawn } from 'child_process';
import { join } from 'path';

const DDG_PROVIDER_PATH = '/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/index.js';

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: 'gemini' | 'duckduckgo';
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  metadata: {
    provider: 'gemini' | 'duckduckgo';
    fallback: boolean;
    fallbackReason?: string;
    timestamp: number;
  };
}

export interface WebSearchOptions {
  query: string;
  count?: number;
  country?: string;
  language?: string;
}

/**
 * 调用 DuckDuckGo Provider（通过 Node.js 子进程）
 */
async function callDuckDuckGoProvider(query: string, count: number = 5): Promise<WebSearchResult[]> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', `
      const { DuckDuckGoSearchProvider } = require('${DDG_PROVIDER_PATH}');
      const provider = new DuckDuckGoSearchProvider();
      provider.search({
        query: '${query.replace(/'/g, "\\'")}',
        count: ${count}
      }).then(result => {
        console.log(JSON.stringify(result));
      }).catch(err => {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      });
    `]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          const results: WebSearchResult[] = (result.results || []).map((r: any) => ({
            title: r.title,
            snippet: r.snippet,
            url: r.url,
            source: 'duckduckgo' as const,
          }));
          resolve(results);
        } catch (e) {
          reject(new Error(`Failed to parse DDG response: ${e}`));
        }
      } else {
        reject(new Error(`DDG provider failed: ${errorOutput}`));
      }
    });
  });
}

/**
 * 智能搜索：Gemini 为主，DDG 为 fallback
 */
export async function smartSearch(options: WebSearchOptions): Promise<WebSearchResponse> {
  const { query, count = 5, country, language } = options;
  const startTime = Date.now();

  // 尝试 1: 使用 Gemini（通过 OpenClaw web_search 工具）
  try {
    // 注意：这里需要调用 OpenClaw 的 web_search 工具
    // 在实际使用中，这个函数会被 Skill 调用，web_search 是可用的
    const geminiResults = await callGeminiSearch(query, count, country, language);
    
    return {
      query,
      results: geminiResults.map(r => ({ ...r, source: 'gemini' as const })),
      metadata: {
        provider: 'gemini',
        fallback: false,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const shouldFallback = shouldTriggerFallback(errorMessage);

    if (!shouldFallback) {
      throw error; // 非 fallback 错误，直接抛出
    }

    console.log(`[DuckDuckGo Fallback] Gemini failed: ${errorMessage}, switching to DuckDuckGo...`);

    // 尝试 2: 使用 DuckDuckGo Provider
    try {
      const ddgResults = await callDuckDuckGoProvider(query, count);
      
      return {
        query,
        results: ddgResults,
        metadata: {
          provider: 'duckduckgo',
          fallback: true,
          fallbackReason: errorMessage,
          timestamp: Date.now(),
        },
      };
    } catch (ddgError) {
      throw new Error(`Both providers failed. Gemini: ${errorMessage}, DDG: ${ddgError instanceof Error ? ddgError.message : String(ddgError)}`);
    }
  }
}

/**
 * 调用 Gemini web_search（通过 OpenClaw 工具）
 * 注意：这个函数在实际 Skill 执行时会被 web_search 工具替换
 */
async function callGeminiSearch(query: string, count: number, country?: string, language?: string): Promise<WebSearchResult[]> {
  // 这个函数在实际使用时会被 Skill 系统替换为 web_search 工具调用
  // 这里只是类型定义
  throw new Error('Not implemented - use web_search tool instead');
}

/**
 * 判断是否应该触发 fallback
 */
function shouldTriggerFallback(errorMessage: string): boolean {
  const fallbackTriggers = [
    '429', // 频率限制
    'Too Many Requests',
    '503', // 服务不可用
    'Service Unavailable',
    'Timeout',
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'Network Error',
    'network',
  ];

  return fallbackTriggers.some(trigger => errorMessage.includes(trigger));
}

// 导出给 OpenClaw Skill 系统使用
export default {
  smartSearch,
  callDuckDuckGoProvider,
  shouldTriggerFallback,
};
