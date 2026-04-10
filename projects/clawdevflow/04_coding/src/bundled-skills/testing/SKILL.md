---
name: testing
description: 运行测试与验收并生成测试报告。在需要验证实现或生成测试证据时使用。
---

# 测试

本 skill 由 ClawDevFlow 流程引擎自动调用，输出目录为 `06_testing/`。

## 输入

- `04_coding/src/` - 源代码目录
- `PROJECT_MANIFEST.json` - 必须包含 `commands.test` 与 `commands.verify`

## 输出

- `06_testing/TEST_CONTEXT.json`
- `06_testing/TEST.log`
- `06_testing/TEST_RESULTS.json`
- `06_testing/VERIFY.log`
- `06_testing/VERIFY_RESULTS.json`
- `06_testing/VERIFICATION_REPORT.md`

## 执行流程

1. 读取 `PROJECT_MANIFEST.json` 并解析测试/验收命令
2. 执行 `commands.test`，记录日志与结构化结果
3. 执行 `commands.verify`，记录日志与结构化结果
4. 汇总生成 `VERIFICATION_REPORT.md`

## 约束

- 所有产物必须写入 `06_testing/`
- 禁止修改项目根目录其他文件
