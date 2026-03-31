/**
 * 致远 OA 表单解析器
 *
 * 支持 16 个区域，82 个字段的提取
 * 处理左右/上下两种布局模式
 */
export class FormParser {
    constructor() {
        // 16 个区域定义
        this.regions = [
            'BUG 单期限信息',
            '上报人信息',
            '客户信息',
            '联系人信息',
            '问题描述信息',
            '开发人员填写',
            '备注说明',
            '补丁包相关',
            '核心代码',
            '转客开处理',
            '代码检查结果',
            '诊断结论',
            '测试人员填写',
            '客开人员填写信息',
            '区域客开',
            '发起人交付信息'
        ];
    }
    /**
     * 提取表单字段
     */
    async extractFields(page) {
        const fields = [];
        // 获取所有 iframe
        const frames = page.frames();
        // 找到包含表单的 frame（cap4/form）
        const formFrame = frames.find(f => f.url().includes('cap4/form'));
        if (!formFrame) {
            console.warn('Form frame not found');
            return fields;
        }
        try {
            // 在 frame 内提取所有表格
            const tables = await formFrame.$$('table');
            for (const table of tables) {
                const rows = await table.$$('tr');
                for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    const cells = await rows[rowIndex].$$('td, th');
                    const cellTexts = [];
                    for (const cell of cells) {
                        const text = await cell.textContent() || '';
                        cellTexts.push(text.trim());
                    }
                    // 配对字段
                    const pairedFields = this.pairFields(cellTexts, rowIndex);
                    fields.push(...pairedFields);
                }
            }
        }
        catch (error) {
            console.error('Error extracting fields:', error);
        }
        return fields;
    }
    /**
     * 字段配对逻辑
     *
     * 规则：
     * 1. 跳过空单元格（null/undefined）
     * 2. 跳过区域标题（含 █ 符号）
     * 3. 跳过说明文字（以"注："、"1、"开头）
     * 4. 按顺序配对字段名→字段值（空字符串作为占位符保留）
     */
    pairFields(cells, rowIndex) {
        const fields = [];
        let currentRegion = '';
        // 过滤掉需要跳过的项，但保留空字符串作为占位符
        const validCells = [];
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            // 跳过 null/undefined
            if (cell == null) {
                continue;
            }
            // 跳过区域标题（含 █ 符号）
            if (cell.includes('█')) {
                currentRegion = cell.replace(/[█▓]/g, '').trim();
                continue;
            }
            // 跳过说明文字
            if (cell.startsWith('注：') || cell.startsWith('说明：') || cell.match(/^\d+、/)) {
                continue;
            }
            validCells.push(cell);
        }
        // 在纯净列表上进行配对（索引从 0 开始，保证奇偶性正确）
        let j = 0;
        while (j < validCells.length) {
            const name = validCells[j];
            // 左右结构：字段名 | 字段值
            if (j + 1 < validCells.length) {
                const value = validCells[j + 1];
                fields.push({ name, value, region: currentRegion });
                j += 2;
            }
            else {
                // 最后一个单元格，没有配对的值
                fields.push({ name, value: '', region: currentRegion });
                j++;
            }
        }
        return fields;
    }
    /**
     * 判断是否为左右布局
     *
     * 左右布局特征：
     * - 同一行有偶数个单元格
     * - 当前单元格后有非空单元格
     */
    isLeftRightLayout(cells, currentIndex) {
        // 如果当前索引是偶数，且下一个单元格存在且非空
        return currentIndex % 2 === 0 &&
            currentIndex + 1 < cells.length &&
            cells[currentIndex + 1]?.trim() !== '';
    }
    /**
     * 按区域分组字段
     */
    groupFieldsByRegion(fields) {
        const grouped = {};
        for (const field of fields) {
            const region = field.region || '未分类';
            if (!grouped[region]) {
                grouped[region] = [];
            }
            grouped[region].push(field);
        }
        return grouped;
    }
    /**
     * 格式化字段为 Markdown
     */
    formatFieldsAsMarkdown(fields) {
        const grouped = this.groupFieldsByRegion(fields);
        const lines = [];
        for (const [region, regionFields] of Object.entries(grouped)) {
            lines.push(`## ${region}\n`);
            for (const field of regionFields) {
                lines.push(`- **${field.name}**: ${field.value || '(空)'}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=FormParser.js.map