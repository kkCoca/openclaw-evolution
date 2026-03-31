import { PageMeta, TransformOptions } from '../types';
export declare class Transformer {
    private turndownService;
    constructor();
    private addCustomRules;
    transform(html: string, options?: TransformOptions): Promise<string>;
    private convertTable;
    private markdownTable;
    private cleanMarkdown;
    extractMeta(document: any): PageMeta;
}
//# sourceMappingURL=Transformer.d.ts.map