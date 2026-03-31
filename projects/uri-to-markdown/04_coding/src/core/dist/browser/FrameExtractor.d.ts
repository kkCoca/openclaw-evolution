import { Page } from 'playwright';
import { FrameInfo, FrameContent } from '../types';
export declare class FrameExtractor {
    /**
     * 检测页面所有 iframe
     */
    detectFrames(page: Page): Promise<FrameInfo[]>;
    /**
     * 提取有内容的 iframe
     */
    extractContentFrames(page: Page): Promise<FrameContent[]>;
    /**
     * 合并多个 iframe 内容
     *
     * 排序规则：
     * 1. collaboration.do (Frame 2) - 头部信息
     * 2. cap4/form (Frame 4) - 表单详情
     * 3. 其他有内容的 frame
     */
    mergeFrameContents(frames: FrameContent[]): string;
    /**
     * 获取有内容的 frame 数量
     */
    getContentFrameCount(frames: FrameInfo[]): number;
}
//# sourceMappingURL=FrameExtractor.d.ts.map