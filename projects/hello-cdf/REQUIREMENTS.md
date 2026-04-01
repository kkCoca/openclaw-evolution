# hello-cdf - 需求说明

## v1.0.0（2026-04-01）

### 目标
创建一个简单的命令行问候工具，用于验证 CDF 研发流程。

### 功能需求
- 默认输出 "Hello, CDF!"
- 支持通过参数自定义名字
- 支持 --help 和 --version 参数

### 技术约束
- 使用 Node.js 编写
- 代码简洁，不超过 50 行
- 遵循 AGENTS.md 规范的项目结构

### 验收标准
- Given 用户在终端运行 hello-cdf
- When 不提供参数
- Then 输出 "Hello, CDF!"
- Given 用户提供名字参数
- When 运行 hello-cdf --name Alice
- Then 输出 "Hello, Alice!"
