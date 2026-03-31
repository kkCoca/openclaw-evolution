import { describe, it, expect, beforeEach } from 'vitest';
import { FormParser } from '../../src/core/src/parser/FormParser';

describe('FormParser', () => {
  let parser: FormParser;

  beforeEach(() => {
    parser = new FormParser();
  });

  describe('pairFields - 左右布局', () => {
    it('应该正确配对左右结构的字段', () => {
      const cells = ['字段名 1', '字段值 1', '字段名 2', '字段值 2'];
      
      // 使用反射调用私有方法
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(2);
      expect(fields[0]).toEqual({ name: '字段名 1', value: '字段值 1', region: '' });
      expect(fields[1]).toEqual({ name: '字段名 2', value: '字段值 2', region: '' });
    });

    it('应该处理空字段值', () => {
      const cells = ['字段名 1', '', '字段名 2', '字段值 2'];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(2);
      expect(fields[0].value).toBe('');
      expect(fields[1].value).toBe('字段值 2');
    });
  });

  describe('pairFields - 跳过项', () => {
    it('应该跳过 null/undefined 单元格', () => {
      const cells = [null as any, '字段名 1', '字段值 1', undefined as any];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('字段名 1');
      expect(fields[0].value).toBe('字段值 1');
    });

    it('应该保留空字符串作为占位符', () => {
      const cells = ['', '字段名 1', '字段值 1', ''];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(2);
      expect(fields[0]).toEqual({ name: '', value: '字段名 1', region: '' });
      expect(fields[1]).toEqual({ name: '字段值 1', value: '', region: '' });
    });

    it('应该跳过区域标题', () => {
      const cells = ['█ 区域标题', '字段名 1', '字段值 1'];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(1);
      expect(fields.every((f: any) => !f.name.includes('█'))).toBe(true);
    });

    it('应该跳过说明文字（注：）', () => {
      const cells = ['注：说明文字', '字段名 1', '字段值 1'];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(1);
      expect(fields.every((f: any) => !f.name.startsWith('注：'))).toBe(true);
    });

    it('应该跳过说明文字（数字序号）', () => {
      const cells = ['1、说明文字', '字段名 1', '字段值 1'];
      
      const fields = (parser as any).pairFields(cells, 0);

      expect(fields).toHaveLength(1);
      expect(fields.every((f: any) => !f.name.match(/^\d+、/))).toBe(true);
    });
  });

  describe('isLeftRightLayout', () => {
    it('应该识别左右布局（偶数索引 + 后有非空单元格）', () => {
      const cells = ['字段名 1', '字段值 1', '字段名 2', '字段值 2'];
      
      expect((parser as any).isLeftRightLayout(cells, 0)).toBe(true);
      expect((parser as any).isLeftRightLayout(cells, 2)).toBe(true);
    });

    it('应该识别非左右布局（奇数索引）', () => {
      const cells = ['字段名 1', '字段值 1', '字段名 2', '字段值 2'];
      
      expect((parser as any).isLeftRightLayout(cells, 1)).toBe(false);
      expect((parser as any).isLeftRightLayout(cells, 3)).toBe(false);
    });

    it('应该识别非左右布局（后单元格为空）', () => {
      const cells = ['字段名 1', '', '字段名 2', '字段值 2'];
      
      expect((parser as any).isLeftRightLayout(cells, 0)).toBe(false);
    });
  });

  describe('groupFieldsByRegion', () => {
    it('应该按区域分组字段', () => {
      const fields = [
        { name: '字段 1', value: '值 1', region: '区域 A' },
        { name: '字段 2', value: '值 2', region: '区域 A' },
        { name: '字段 3', value: '值 3', region: '区域 B' }
      ];

      const grouped = parser.groupFieldsByRegion(fields);

      expect(grouped['区域 A']).toHaveLength(2);
      expect(grouped['区域 B']).toHaveLength(1);
    });

    it('应该将无区域字段归类为"未分类"', () => {
      const fields = [
        { name: '字段 1', value: '值 1', region: undefined },
        { name: '字段 2', value: '值 2' }
      ];

      const grouped = parser.groupFieldsByRegion(fields);

      expect(grouped['未分类']).toHaveLength(2);
    });
  });

  describe('formatFieldsAsMarkdown', () => {
    it('应该格式化字段为 Markdown', () => {
      const fields = [
        { name: '字段 1', value: '值 1', region: '区域 A' },
        { name: '字段 2', value: '值 2', region: '区域 A' }
      ];

      const markdown = parser.formatFieldsAsMarkdown(fields);

      expect(markdown).toContain('## 区域 A');
      expect(markdown).toContain('- **字段 1**: 值 1');
      expect(markdown).toContain('- **字段 2**: 值 2');
    });

    it('应该处理空值', () => {
      const fields = [
        { name: '字段 1', value: '', region: '区域 A' }
      ];

      const markdown = parser.formatFieldsAsMarkdown(fields);

      expect(markdown).toContain('- **字段 1**: (空)');
    });
  });
});
