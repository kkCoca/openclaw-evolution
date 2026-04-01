# hello-cdf - 需求说明

> **版本**: v1.0.0  
> **日期**: 2026-04-01  
> **哈希**: 8cf4f17def01

---

## 1. 项目概述

创建一个简单的命令行问候工具，用于验证 CDF 研发流程。

---

## 2. 功能需求

### **[REQ-001]** 默认问候

- **优先级**: P0
- **描述**: 运行 `hello-cdf` 输出 "Hello, CDF!"
- **验收标准**: 
  - Given 用户在终端
  - When 运行 `hello-cdf` 不提供参数
  - Then 输出 "Hello, CDF!"

### **[REQ-002]** 自定义名字

- **优先级**: P0
- **描述**: 运行 `hello-cdf --name <名字>` 输出 "Hello, <名字>!"
- **验收标准**: 
  - Given 用户提供名字参数
  - When 运行 `hello-cdf --name Alice`
  - Then 输出 "Hello, Alice!"

### **[REQ-003]** 帮助信息

- **优先级**: P0
- **描述**: 运行 `hello-cdf --help` 显示使用说明
- **验收标准**: 
  - Given 用户需要帮助
  - When 运行 `hello-cdf --help`
  - Then 显示使用说明和参数列表

### **[REQ-004]** 版本信息

- **优先级**: P1
- **描述**: 运行 `hello-cdf --version` 显示版本号
- **验收标准**: 
  - Given 用户查询版本
  - When 运行 `hello-cdf --version`
  - Then 显示 "hello-cdf v1.0.0"

---

## 3. 技术约束

- 使用 Node.js 编写
- 代码简洁，不超过 50 行
- 遵循 AGENTS.md 规范的项目结构
- 无外部依赖（仅使用 Node.js 标准库）

---

## 4. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本 |

---

*本需求由 openclaw-ouyp 提供，clawdevflow 执行*
