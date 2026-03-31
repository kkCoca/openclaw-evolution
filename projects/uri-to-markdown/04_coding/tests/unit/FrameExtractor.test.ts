import { describe, it, expect, beforeEach } from 'vitest';
import { FrameExtractor } from '../../src/core/src/browser/FrameExtractor';
import { FrameContent } from '../../src/core/src/types';

describe('FrameExtractor', () => {
  let extractor: FrameExtractor;

  beforeEach(() => {
    extractor = new FrameExtractor();
  });

  describe('mergeFrameContents', () => {
    it('应该按正确顺序合并 iframe 内容', () => {
      const frames: FrameContent[] = [
        { url: 'cap4/form/dist/index.html', html: '<div>Form Content</div>', text: 'Form', textLength: 3459 },
        { url: 'collaboration.do', html: '<div>Header Content</div>', text: 'Header', textLength: 221 },
      ];

      const merged = extractor.mergeFrameContents(frames);

      // collaboration.do 应该在前
      expect(merged.indexOf('Header Content')).toBeLessThan(merged.indexOf('Form Content'));
    });

    it('应该跳过空 iframe', () => {
      const frames: FrameContent[] = [
        { url: 'about:blank', html: '', text: '', textLength: 0 },
        { url: 'content.do', html: '<div>Content</div>', text: 'Content', textLength: 100 },
      ];

      const merged = extractor.mergeFrameContents(frames);

      expect(merged).toContain('Content');
      expect(merged).not.toContain('about:blank');
    });

    it('多个 frame 应该正确排序', () => {
      const frames: FrameContent[] = [
        { url: 'other.do', html: '<div>Other</div>', text: 'Other', textLength: 500 },
        { url: 'cap4/form', html: '<div>Form</div>', text: 'Form', textLength: 3000 },
        { url: 'collaboration.do', html: '<div>Header</div>', text: 'Header', textLength: 200 },
      ];

      const merged = extractor.mergeFrameContents(frames);

      const headerIndex = merged.indexOf('Header');
      const formIndex = merged.indexOf('Form');
      const otherIndex = merged.indexOf('Other');

      // Header 应该最先
      expect(headerIndex).toBeLessThan(formIndex);
      expect(headerIndex).toBeLessThan(otherIndex);
    });
  });

  describe('getContentFrameCount', () => {
    it('应该返回有内容的 frame 数量', () => {
      const frames = [
        { url: 'frame1', textLength: 100, hasContent: true },
        { url: 'frame2', textLength: 0, hasContent: false },
        { url: 'frame3', textLength: 200, hasContent: true },
        { url: 'frame4', textLength: 0, hasContent: false },
      ];

      const count = extractor.getContentFrameCount(frames);

      expect(count).toBe(2);
    });

    it('空列表应该返回 0', () => {
      const count = extractor.getContentFrameCount([]);
      expect(count).toBe(0);
    });
  });
});
