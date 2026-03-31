import { Page } from 'playwright';
import { FormField } from '../types';
/**
 * 致远 OA 表单解析器
 *
 * 支持 16 个区域，82 个字段的提取
 * 处理左右/上下两种布局模式
 */
export declare class FormParser {
    private readonly regions;
    /**
     * 提取表单字段
     */
    extractFields(page: Page): Promise<FormField[]>;
    /**
     * 字段配对逻辑
     *
     * 规则：
     * 1. 跳过空单元格（null/undefined）
     * 2. 跳过区域标题（含 █ 符号）
     * 3. 跳过说明文字（以"注："、"1、"开头）
     * 4. 按顺序配对字段名→字段值（空字符串作为占位符保留）
     */
    private pairFields;
    /**
     * 判断是否为左右布局
     *
     * 左右布局特征：
     * - 同一行有偶数个单元格
     * - 当前单元格后有非空单元格
     */
    private isLeftRightLayout;
    /**
     * 按区域分组字段
     */
    groupFieldsByRegion(fields: FormField[]): Record<string, FormField[]>;
    /**
     * 格式化字段为 Markdown
     */
    formatFieldsAsMarkdown(fields: FormField[]): string;
}
//# sourceMappingURL=FormParser.d.ts.map