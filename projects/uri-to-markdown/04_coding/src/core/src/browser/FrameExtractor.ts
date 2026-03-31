import { Page, Frame } from 'playwright';
import { FrameInfo, FrameContent } from '../types';

export class FrameExtractor {
  /**
   * 检测页面所有 iframe
   */
  async detectFrames(page: Page): Promise<FrameInfo[]> {
    const frames = page.frames();
    const frameInfos: FrameInfo[] = [];

    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );

        frameInfos.push({
          url: frame.url(),
          textLength,
          hasContent: textLength > 0
        });
      } catch (error) {
        // Frame 可能无法访问，标记为无内容
        frameInfos.push({
          url: frame.url(),
          textLength: 0,
          hasContent: false
        });
      }
    }

    return frameInfos;
  }

  /**
   * 提取有内容的 iframe
   */
  async extractContentFrames(page: Page): Promise<FrameContent[]> {
    const frameInfos = await this.detectFrames(page);
    const contentFrames = frameInfos.filter(f => f.hasContent);

    const contents: FrameContent[] = [];
    for (const info of contentFrames) {
      const frame = page.frames().find(f => f.url() === info.url);
      if (!frame) continue;

      try {
        const html = await frame.content();
        const text = await frame.evaluate(
          () => document.body?.innerText || ''
        );

        contents.push({
          url: info.url,
          html,
          text,
          textLength: info.textLength
        });
      } catch (error) {
        // 跳过无法提取的 frame
        continue;
      }
    }

    return contents;
  }

  /**
   * 合并多个 iframe 内容
   * 
   * 排序规则：
   * 1. collaboration.do (Frame 2) - 头部信息
   * 2. cap4/form (Frame 4) - 表单详情
   * 3. 其他有内容的 frame
   */
  mergeFrameContents(frames: FrameContent[]): string {
    const sortedFrames = frames.sort((a, b) => {
      const aIsHeader = a.url.includes('collaboration.do');
      const bIsHeader = b.url.includes('collaboration.do');
      const aIsForm = a.url.includes('cap4/form');
      const bIsForm = b.url.includes('cap4/form');

      // Header 在前
      if (aIsHeader && !bIsHeader) return -1;
      if (bIsHeader && !aIsHeader) return 1;

      // Form 在后
      if (aIsForm && !bIsForm) return 1;
      if (bIsForm && !aIsForm) return -1;

      // 其他按文本长度排序（长的在前）
      return b.textLength - a.textLength;
    });

    return sortedFrames
      .map(f => f.html)
      .join('\n\n<!-- FRAME_SEPARATOR -->\n\n');
  }

  /**
   * 获取有内容的 frame 数量
   */
  getContentFrameCount(frames: FrameInfo[]): number {
    return frames.filter(f => f.hasContent).length;
  }
}
