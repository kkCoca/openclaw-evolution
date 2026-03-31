# 阶段 2 实施说明 - AI 工具适配层

> **版本**: v2.0.0  
> **日期**: 2026-03-28  
> **状态**: 已完成 ✅

---

## 实施摘要

**阶段 2：AI 工具适配层** 已完成，实现以下功能：

| 任务 | 工作量 | 输出文件 | 状态 |
|------|--------|---------|------|
| 2.1 创建 AI 工具抽象接口 | 1 人天 | `ai-tool-adapter.js` | ✅ |
| 2.2 实现 OpenCode 适配器 | 0.5 人天 | `adapters/opencode.js` | ✅ |
| 2.3 实现 Claude Code 适配器 | 0.5 人天 | `adapters/claude-code.js` | ✅ |
| 2.4 实现 Custom 适配器 | 0.5 人天 | `adapters/custom.js` | ✅ |

**总计**：2.5 人天

---

## 架构设计

### 适配器架构

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (编排器)                          │
│                                                             │
│  适配层：                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AIToolAdapter (抽象基类)                │   │
│  │  - getType()                                        │   │
│  │  - execute(stageName, input)                        │   │
│  │  - buildTask(stageName, input)                      │   │
│  │  - validateConfig()                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│           ↑                    ↑                    ↑       │
│  ┌────────┴───────┐  ┌────────┴───────┐  ┌────────┴───────┐│
│  │ OpenCodeAdapter│  │ClaudeCodeAdapter│ │ CustomAdapter  ││
│  └────────────────┘  └─────────────────┘ └────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 类层次结构

```
AIToolAdapter (抽象基类)
├── OpenCodeAdapter
│   └── 通过 OpenClaw sessions_spawn API 调用
├── ClaudeCodeAdapter
│   └── 通过 CLI 命令行调用
└── CustomAdapter
    └── 支持任意自定义工具
```

---

## 核心文件

### 1. ai-tool-adapter.js

**功能**：AI 工具适配器统一接口

**核心类**：
- `ToolType` - 工具类型枚举
- `ExecutionResult` - 执行结果结构
- `AIToolAdapter` - 抽象基类
- `AdapterFactory` - 适配器工厂

**使用示例**：
```javascript
const { AdapterFactory, ToolType } = require('./ai-tool-adapter');

// 方式 1：从配置创建
const adapter = AdapterFactory.fromConfig(config, stageName);

// 方式 2：手动创建
const adapter = AdapterFactory.create(ToolType.OPENCODE, config);

// 执行阶段任务
const result = await adapter.execute(stageName, input);
```

---

### 2. adapters/opencode.js

**功能**：OpenCode 适配器

**调用方式**：通过 OpenClaw sessions_spawn API

**特点**：
- 与 OpenClaw 深度集成
- 支持子会话管理
- 自动处理超时和错误

**配置示例**：
```yaml
aiTools:
  opencode:
    timeoutSeconds: 1800
```

---

### 3. adapters/claude-code.js

**功能**：Claude Code 适配器

**调用方式**：通过 CLI 命令行

**特点**：
- 支持完整的权限模式
- 自动解析输出文件
- 支持超时控制

**配置示例**：
```yaml
aiTools:
  claude-code:
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    timeoutSeconds: 1800
```

---

### 4. adapters/custom.js

**功能**：自定义 AI 工具适配器

**调用方式**：任意命令行工具

**特点**：
- 支持占位符替换（{stage}, {input}, {inputFile}）
- 支持环境变量配置
- 支持输出解析器

**配置示例**：
```yaml
aiTools:
  custom:
    command: /path/to/custom/tool
    args:
      - --stage
      - '{stage}'
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
    outputParser:
      patterns:
        - '[0-9a-z_/-]+\\.md'
      extractFiles: true
```

---

## 适配器接口

所有适配器都实现以下接口：

```javascript
class AIToolAdapter {
  /**
   * 获取工具类型
   * @returns {string} 工具类型
   */
  getType()
  
  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input)
  
  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input)
  
  /**
   * 验证配置
   * @returns {Promise<boolean>} 配置是否有效
   */
  async validateConfig()
  
  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(message, data)
}
```

---

## 执行结果结构

```javascript
class ExecutionResult {
  constructor({ success, outputs, error, sessionId, duration }) {
    this.success = success;        // 是否成功 (boolean)
    this.outputs = outputs;        // 输出文件列表 (string[])
    this.error = error;            // 错误信息 (string|null)
    this.sessionId = sessionId;    // 会话 ID (string|null)
    this.duration = duration;      // 执行时长 (number, 毫秒)
  }
}
```

---

## 使用示例

### 示例 1：使用 OpenCode

```javascript
const { AdapterFactory } = require('./ai-tool-adapter');

const config = {
  global: { defaultAITool: 'opencode' },
  aiTools: {
    opencode: { timeoutSeconds: 1800 }
  }
};

const adapter = AdapterFactory.fromConfig(config, 'designing');
const result = await adapter.execute('designing', {
  requirementsFile: './REQUIREMENTS.md'
});

console.log(result);
// {
//   success: true,
//   outputs: ['01_designing/PRD.md', '01_designing/TRD.md'],
//   sessionId: 'session-123',
//   duration: 15000
// }
```

### 示例 2：使用 Claude Code

```javascript
const config = {
  global: { defaultAITool: 'claude-code' },
  aiTools: {
    claude-code: {
      args: ['--print', '--permission-mode', 'bypassPermissions'],
      timeoutSeconds: 1800
    }
  }
};

const adapter = AdapterFactory.fromConfig(config, 'coding');
const result = await adapter.execute('coding', {
  detailFile: './03_detailing/DETAIL.md'
});
```

### 示例 3：使用自定义工具

```javascript
const config = {
  global: { defaultAITool: 'custom' },
  aiTools: {
    custom: {
      command: '/path/to/ai-tool --stage {stage}',
      env: { API_KEY: '${MY_API_KEY}' },
      timeoutSeconds: 1800,
      outputParser: {
        patterns: ['[0-9a-z_/-]+\\.md'],
        extractFiles: true
      }
    }
  }
};

const adapter = AdapterFactory.fromConfig(config, 'reviewing');
const result = await adapter.execute('reviewing', {
  projectPath: './projects/my-project'
});
```

---

## 配置说明

### 全局配置

```yaml
global:
  defaultAITool: opencode  # 默认 AI 工具
```

### 各阶段配置

```yaml
stages:
  designing:
    aiTool: opencode       # 覆盖全局默认
    timeoutSeconds: 1800
    
  coding:
    aiTool: claude-code    # 不同阶段可用不同工具
    timeoutSeconds: 3600
```

### AI 工具配置

```yaml
aiTools:
  opencode:
    timeoutSeconds: 1800
    
  claude-code:
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    timeoutSeconds: 1800
    cwd: /path/to/project
    
  custom:
    command: /path/to/tool
    args:
      - --stage
      - '{stage}'
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
    timeoutSeconds: 1800
    outputParser:
      patterns:
        - '[0-9a-z_/-]+\\.md'
      extractFiles: true
```

---

## 错误处理

### 适配器错误

```javascript
try {
  const adapter = AdapterFactory.fromConfig(config, stageName);
  
  // 验证配置
  if (!(await adapter.validateConfig())) {
    throw new Error('适配器配置无效');
  }
  
  // 执行任务
  const result = await adapter.execute(stageName, input);
  
  if (!result.success) {
    throw new Error(`执行失败：${result.error}`);
  }
  
  return result;
} catch (error) {
  console.error('AI 工具执行失败:', error.message);
  // 处理错误...
}
```

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Unsupported tool type` | 工具类型不在枚举中 | 检查 toolType 是否正确 |
| `Command not found` | CLI 命令不存在 | 安装对应工具或检查 PATH |
| `Timeout exceeded` | 执行超时 | 增加 timeoutSeconds |
| `Invalid config` | 配置缺失或格式错误 | 检查 config.yaml |

---

## 测试建议

### 单元测试

```javascript
const { OpenCodeAdapter } = require('./adapters/opencode');

describe('OpenCodeAdapter', () => {
  it('should execute designing stage', async () => {
    const adapter = new OpenCodeAdapter({ timeoutSeconds: 1800 });
    const result = await adapter.execute('designing', {
      requirementsFile: './test/REQUIREMENTS.md'
    });
    
    expect(result.success).toBe(true);
    expect(result.outputs).toContain('01_designing/PRD.md');
  });
});
```

### 集成测试

```javascript
// 测试完整的阶段执行流程
const { AdapterFactory } = require('./ai-tool-adapter');

async function testStageExecution() {
  const config = loadConfig('./config.yaml');
  const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
  
  for (const stage of stages) {
    const adapter = AdapterFactory.fromConfig(config, stage);
    const result = await adapter.execute(stage, getTestInput(stage));
    
    console.log(`${stage}: ${result.success ? '✅' : '❌'}`);
  }
}
```

---

## 后续优化方向

1. **性能优化**
   - 支持连接池（复用 AI 工具实例）
   - 支持请求缓存（相同输入返回缓存结果）

2. **功能增强**
   - 支持流式输出（实时查看 AI 生成内容）
   - 支持取消操作（中途停止执行）

3. **可观测性**
   - 增加指标收集（执行时长、成功率等）
   - 增加追踪 ID（跨阶段追踪）

4. **新适配器**
   - 支持更多 AI 工具（Gemini Code、Cursor 等）

---

## 验收清单

- [x] `ai-tool-adapter.js` 实现完整
- [x] `adapters/opencode.js` 实现完整
- [x] `adapters/claude-code.js` 实现完整
- [x] `adapters/custom.js` 实现完整
- [x] `workflow.md` 更新整合适配器
- [x] `SKILL.md` 更新使用说明
- [x] 配置示例完整
- [x] 错误处理完善
- [x] 日志记录完整

---

*阶段 2 实施完成，可以进入阶段 3（增强功能）*  
**版本**: v2.0.0  
**状态**: 已完成 ✅
