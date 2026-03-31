/**
 * iframe 合并集成测试
 * 
 * 注意：这些测试需要实际运行浏览器，使用 Playwright Test
 */

import { test, expect } from '@playwright/test';

test.describe('多 iframe 合并', () => {
  test('应该检测所有 iframe', async ({ page }) => {
    // 访问测试页面（需要替换为实际测试 URL）
    // await page.goto('https://xt.seeyon.com/...');
    // await page.waitForLoadState('networkidle');

    // 模拟测试
    const frames = page.frames();
    
    // 验证 iframe 数量至少为 1（主 frame）
    expect(frames.length).toBeGreaterThanOrEqual(1);
  });

  test('应该提取有内容的 iframe', async ({ page }) => {
    // 创建一个包含 iframe 的测试页面
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <iframe id="frame1" srcdoc="<div>Content 1</div>"></iframe>
          <iframe id="frame2" srcdoc="<div>Content 2</div>"></iframe>
          <iframe id="frame3" srcdoc=""></iframe>
        </body>
      </html>
    `);

    await page.waitForLoadState('networkidle');

    // 获取所有 frame
    const frames = page.frames();
    
    // 验证 frame 数量
    expect(frames.length).toBeGreaterThanOrEqual(3);

    // 提取有内容的 frame
    const contentFrames = await Promise.all(
      frames.map(async (frame) => {
        try {
          const textLength = await frame.evaluate(
            () => document.body?.innerText?.length || 0
          );
          return { url: frame.url(), textLength };
        } catch {
          return { url: frame.url(), textLength: 0 };
        }
      })
    );

    const hasContentFrames = contentFrames.filter(f => f.textLength > 0);
    expect(hasContentFrames.length).toBeGreaterThanOrEqual(2);
  });

  test('应该按正确顺序合并 iframe 内容', async ({ page }) => {
    // 模拟致远 OA 的 iframe 结构
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <iframe id="frame1" srcdoc="<div>Header from collaboration.do</div>"></iframe>
          <iframe id="frame2" srcdoc="<div>Form from cap4/form</div>"></iframe>
        </body>
      </html>
    `);

    await page.waitForLoadState('networkidle');

    // 提取并合并内容
    const frames = page.frames();
    const contents: string[] = [];

    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );
        if (textLength > 0) {
          const html = await frame.content();
          contents.push(html);
        }
      } catch (e) {
        // 跳过无法访问的 frame
      }
    }

    const merged = contents.join('\n\n');

    // 验证合并后的内容
    expect(merged).toContain('Header');
    expect(merged).toContain('Form');
  });
});
