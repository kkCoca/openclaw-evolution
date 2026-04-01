# 详细设计（DETAIL）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v2.0.1 |
| 日期 | 2026-03-30 |
| 状态 | 已完成 |
| 作者 | 流程引擎（AI） |

---

## 1. 架构设计

### 1.1 Bugfix 修复架构

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 v2.0.1 Bugfix                    │
│                                                             │
│  输入层：                                                    │
│  - REQUIREMENTS.md v2.0.1（已更新）                          │
│  - 01_designing/PRD.md v2.0.0（已有）                        │
│  - 01_designing/TRD.md v2.0.0（已有）                        │
│  - 04_coding/src/（已有，保留）                              │
│                                                             │
│  修复层：                                                    │
│  - 追加 PRD.md v2.0.1 章节                                   │
│  - 追加 TRD.md v2.0.1 章节                                   │
│  - 创建 02_roadmapping/ROADMAP.md                            │
│  - 创建 03_detailing/DETAIL.md                               │
│  - 创建 CHANGELOG.md                                         │
│  - 更新 REVIEW-REPORT.md v2.0.1                              │
│                                                             │
│  输出层：                                                    │
│  - 5 个阶段产物完整（01_designing~05_reviewing）              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 目录结构

```
projects/openclaw-research-workflow/
├── REQUIREMENTS.md              # v2.0.1（openclaw-ouyp 提供）
├── CHANGELOG.md                 # v2.0.1（新建）
├── 01_designing/
│   ├── PRD.md                   # v2.0.1（追加）
│   └── TRD.md                   # v2.0.1（追加）
├── 02_roadmapping/
│   └── ROADMAP.md               # v2.0.1（新建）
├── 03_detailing/
│   └── DETAIL.md                # v2.0.1（新建）
├── 04_coding/
│   └── src/                     # 保留原有代码
│       ├── workflow.md
│       ├── SKILL.md
│       ├── config.yaml
│       ├── state-manager.js
│       └── ...
└── 05_reviewing/
    └── REVIEW-REPORT.md         # v2.0.1（更新）
```

---

## 2. 模块设计

### 2.1 文档模块

#### 2.1.1 PRD.md 模块

**结构**：
```markdown
# 产品需求文档（PRD）

## 文档信息（v1.1.0）
## 1-8. 原有章节（v1.1.0 + v2.0.0）
## 9. v2.0.1 Bugfix 修复（新增）
   - 9.1 问题描述
   - 9.2 影响范围
   - 9.3 修复目标
   - 9.4 功能需求
   - 9.5 验收标准
   - 9.6 非功能需求
```

**修改方式**：追加式（不覆盖原有内容）

#### 2.1.2 TRD.md 模块

**结构**：
```markdown
# 技术需求文档（TRD）

## 文档信息（v1.1.0）
## 1-8. 原有章节（v1.1.0 + v2.0.0）
## 9. v2.0.1 Bugfix 技术设计（新增）
   - 9.1 问题根因
   - 9.2 修复方案
   - 9.3 技术约束
   - 9.4 验收检查点
```

**修改方式**：追加式（不覆盖原有内容）

#### 2.1.3 ROADMAP.md 模块

**结构**：
```markdown
# 开发计划（ROADMAP）

## 文档信息
## 1. 开发目标
## 2. 阶段划分
## 3. 时间估算
## 4. 资源分配
## 5. 风险识别
## 6. 交付物清单
## 7. 验收标准
## 8. 版本历史
```

**修改方式**：新建文件

#### 2.1.4 DETAIL.md 模块

**结构**：
```markdown
# 详细设计（DETAIL）

## 文档信息
## 1. 架构设计
## 2. 模块设计
## 3. 接口定义
## 4. 数据结构
## 5. 算法说明
## 6. 验收检查点
## 7. 版本历史
```

**修改方式**：新建文件

#### 2.1.5 CHANGELOG.md 模块

**结构**：
```markdown
# 变更日志（CHANGELOG）

## 版本历史
| 版本 | 日期 | 类型 | 变更说明 |
|------|------|------|---------|
| v2.0.1 | 2026-03-30 | Bugfix | BUG-002 修复 |
| v2.0.0 | 2026-03-28 | Feature | FEATURE-002 |
| v1.1.0 | 2026-03-26 | Feature | FEATURE-001 |
| v1.0.1 | 2026-03-26 | Bugfix | BUG-001 |
| v1.0.0 | 2026-03-26 | Initial | 初始版本 |
```

**修改方式**：新建文件

#### 2.1.6 REVIEW-REPORT.md 模块

**结构**：
```markdown
# 验收报告（REVIEW REPORT）

## 文档信息（v2.0.1）
## 1. 验收概述
## 2. 验收范围
## 3. 验收标准
## 4. 详细验收
   - 4.1 PRD.md 验收
   - 4.2 TRD.md 验收
   - 4.3 ROADMAP.md 验收
   - 4.4 DETAIL.md 验收
   - 4.5 CHANGELOG.md 验收
   - 4.6 代码保留验收
## 5. 验收结论
## 6. 版本历史
```

**修改方式**：更新版本

---

## 3. 接口定义

### 3.1 文件操作接口

| 操作 | 输入 | 输出 | 说明 |
|------|------|------|------|
| read | 文件路径 | 文件内容 | 读取现有文档 |
| edit | 文件路径 + 旧文本 + 新文本 | 无 | 追加式更新 |
| write | 文件路径 + 内容 | 无 | 创建新文件 |
| exec | mkdir 命令 | 无 | 创建目录 |

### 3.2 验收接口

| 检查点 | 验证命令 | 期望结果 |
|--------|---------|---------|
| C1 | `ls -la 02_roadmapping/` | ROADMAP.md 存在 |
| C2 | `ls -la 03_detailing/` | DETAIL.md 存在 |
| C3 | `grep "v2.0.1" 01_designing/PRD.md` | 包含 v2.0.1 章节 |
| C4 | `grep "v2.0.1" 01_designing/TRD.md` | 包含 v2.0.1 章节 |
| C5 | `ls -la CHANGELOG.md` | CHANGELOG.md 存在 |
| C6 | `ls -la 04_coding/src/` | 原有代码完整 |
| C7 | `grep "v2.0.1" 05_reviewing/REVIEW-REPORT.md` | 包含 v2.0.1 章节 |

---

## 4. 数据结构

### 4.1 版本历史结构

```json
{
  "version": "v2.0.1",
  "date": "2026-03-30",
  "type": "Bugfix",
  "issueId": "BUG-002",
  "description": "补充 02_roadmapping/和 03_detailing/阶段产物",
  "changes": [
    {
      "file": "01_designing/PRD.md",
      "action": "append",
      "section": "9. v2.0.1 Bugfix 修复"
    },
    {
      "file": "01_designing/TRD.md",
      "action": "append",
      "section": "9. v2.0.1 Bugfix 技术设计"
    },
    {
      "file": "02_roadmapping/ROADMAP.md",
      "action": "create",
      "section": "全部"
    },
    {
      "file": "03_detailing/DETAIL.md",
      "action": "create",
      "section": "全部"
    },
    {
      "file": "CHANGELOG.md",
      "action": "create",
      "section": "全部"
    },
    {
      "file": "05_reviewing/REVIEW-REPORT.md",
      "action": "update",
      "section": "版本更新"
    }
  ]
}
```

### 4.2 目录结构数据

```json
{
  "project": "openclaw-research-workflow",
  "version": "v2.0.1",
  "directories": {
    "01_designing": {
      "files": ["PRD.md", "TRD.md"],
      "status": "updated"
    },
    "02_roadmapping": {
      "files": ["ROADMAP.md"],
      "status": "created"
    },
    "03_detailing": {
      "files": ["DETAIL.md"],
      "status": "created"
    },
    "04_coding": {
      "files": ["src/*"],
      "status": "preserved"
    },
    "05_reviewing": {
      "files": ["REVIEW-REPORT.md"],
      "status": "updated"
    }
  },
  "rootFiles": {
    "REQUIREMENTS.md": "preserved",
    "CHANGELOG.md": "created"
  }
}
```

---

## 5. 算法说明

### 5.1 追加式更新算法

```javascript
function appendToFile(filePath, newContent) {
  // 1. 读取文件末尾
  const existingContent = read(filePath);
  
  // 2. 定位插入点（文件末尾）
  const insertPoint = existingContent.length;
  
  // 3. 追加新内容
  const updatedContent = existingContent + '\n\n' + newContent;
  
  // 4. 写回文件
  write(filePath, updatedContent);
  
  // 5. 验证更新
  verifyUpdate(filePath, newContent);
}
```

### 5.2 目录创建算法

```javascript
function createMissingDirectories(basePath, directories) {
  for (const dir of directories) {
    const dirPath = `${basePath}/${dir}`;
    
    // 检查目录是否存在
    if (!exists(dirPath)) {
      // 创建目录（包括父目录）
      exec(`mkdir -p ${dirPath}`);
      log(`Created directory: ${dirPath}`);
    } else {
      log(`Directory exists: ${dirPath}`);
    }
  }
}
```

### 5.3 验收验证算法

```javascript
function verifyBugfixCompletion(basePath) {
  const checkpoints = [
    { path: '01_designing/PRD.md', check: 'contains(v2.0.1)' },
    { path: '01_designing/TRD.md', check: 'contains(v2.0.1)' },
    { path: '02_roadmapping/ROADMAP.md', check: 'exists' },
    { path: '03_detailing/DETAIL.md', check: 'exists' },
    { path: 'CHANGELOG.md', check: 'exists' },
    { path: '04_coding/src/', check: 'preserved' },
    { path: '05_reviewing/REVIEW-REPORT.md', check: 'contains(v2.0.1)' }
  ];
  
  const results = [];
  for (const checkpoint of checkpoints) {
    const result = verify(checkpoint);
    results.push(result);
  }
  
  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
```

---

## 6. 验收检查点

### 6.1 文件存在性检查

| 检查点 | 文件/目录 | 期望状态 | 验证方法 |
|--------|----------|---------|---------|
| C1 | 01_designing/PRD.md | 存在 | `ls -la` |
| C2 | 01_designing/TRD.md | 存在 | `ls -la` |
| C3 | 02_roadmapping/ROADMAP.md | 存在 | `ls -la` |
| C4 | 03_detailing/DETAIL.md | 存在 | `ls -la` |
| C5 | CHANGELOG.md | 存在 | `ls -la` |
| C6 | 04_coding/src/ | 存在 | `ls -la` |
| C7 | 05_reviewing/REVIEW-REPORT.md | 存在 | `ls -la` |

### 6.2 内容完整性检查

| 检查点 | 文件 | 期望内容 | 验证方法 |
|--------|------|---------|---------|
| C8 | PRD.md | v2.0.1 章节 | `grep "v2.0.1"` |
| C9 | TRD.md | v2.0.1 章节 | `grep "v2.0.1"` |
| C10 | ROADMAP.md | 完整结构 | `head -50` |
| C11 | DETAIL.md | 完整结构 | `head -50` |
| C12 | CHANGELOG.md | v1.0.0~v2.0.1 | `cat` |
| C13 | REVIEW-REPORT.md | v2.0.1 章节 | `grep "v2.0.1"` |

### 6.3 代码保留检查

| 检查点 | 文件 | 期望状态 | 验证方法 |
|--------|------|---------|---------|
| C14 | workflow.md | 未修改 | `git diff` |
| C15 | SKILL.md | 未修改 | `git diff` |
| C16 | config.yaml | 未修改 | `git diff` |
| C17 | state-manager.js | 未修改 | `git diff` |
| C18 | 其他源代码 | 未修改 | `git diff` |

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/阶段产物 |

---

## 8. v3.1.0 测试框架增强详细设计（2026-04-01）

### 8.1 package.json 设计

**位置**: `04_coding/src/package.json`

**结构**:
```json
{
  "name": "clawdevflow",
  "version": "3.1.0",
  "scripts": {
    "test": "node ../../tests/run-all-tests.js",
    "test:state": "node ../../tests/test-state-manager.js",
    "test:adapter": "node ../../tests/test-ai-tool-adapter.js",
    "test:coverage": "nyc --reporter=html --reporter=text node ../../tests/run-all-tests.js",
    "report:coverage": "nyc report --reporter=html"
  },
  "devDependencies": {
    "nyc": "^15.1.0"
  }
}
```

### 8.2 测试文件设计

**测试目录**: `tests/`

| 文件 | 说明 | 测试用例数 |
|------|------|-----------|
| test-state-manager.js | State Manager 单元测试 | 29 |
| test-ai-tool-adapter.js | AI Tool Adapter 单元测试 | 34 |
| run-all-tests.js | 全量测试运行脚本 | - |

### 8.3 验收检查点

| 检查点 | 文件 | 期望状态 | 验证方法 |
|--------|------|---------|---------|
| C1 | package.json | 存在 | `ls -la` |
| C2 | tests/test-state-manager.js | 存在 | `ls -la` |
| C3 | tests/test-ai-tool-adapter.js | 存在 | `ls -la` |
| C4 | npm test | 通过 | `npm test` |
| C5 | 测试覆盖率 | 80%+ | `npm run test:coverage` |

---

## 9. v3.2.0 硬编码修复详细设计（2026-04-01）

### 9.1 workflow-executor.js 修改

**修改位置**: `loadConfig()` 函数

**修改内容**:
```javascript
// 修改前
const defaultWorkspaceRoot = '/home/ouyp/.openclaw/workspace';

// 修改后
const defaultWorkspaceRoot = process.env.OPENCLAW_WORKSPACE_ROOT || 
                             path.resolve(__dirname, '../../..');
```

### 9.2 config.yaml 修改

**修改内容**:
```yaml
# 修改前
workspaceRoot: /home/ouyp/.openclaw/workspace

# 修改后
workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
```

### 9.3 nyc 配置

**位置**: `04_coding/src/package.json`

```json
"nyc": {
  "include": [
    "cdf-orchestrator/**/*.js",
    "adapters/**/*.js",
    "review-*/**/*.js",
    "ai-tool-adapter.js"
  ],
  "exclude": [
    "tests/**",
    "bundled-skills/**",
    "node_modules/**"
  ],
  "check-coverage": false,
  "lines": 80,
  "functions": 80,
  "branches": 80,
  "statements": 80
}
```

### 9.4 验收检查点

| 检查点 | 文件 | 期望状态 | 验证方法 |
|--------|------|---------|---------|
| C1 | workflow-executor.js | 使用 process.env | `grep "process.env"` |
| C2 | config.yaml | 支持环境变量语法 | `grep "\\$\\{"` |
| C3 | npm run test:coverage | 生成报告 | `npm run test:coverage` |
| C4 | coverage/index.html | 存在 | `ls coverage/` |

---

## 10. v3.3.0 文档增强详细设计（2026-04-01）

### 10.1 substituteEnvVars() 函数设计

**位置**: `04_coding/src/workflow-executor.js`

**函数签名**:
```javascript
/**
 * 替换字符串中的环境变量
 * @param {string} str - 包含环境变量占位符的字符串
 * @returns {string} 替换后的字符串
 */
function substituteEnvVars(str)
```

**实现逻辑**:
1. 检查输入是否为字符串，非字符串直接返回
2. 使用正则表达式匹配环境变量语法：
   - `\$\{([^}:]+)(?::-([^}]*))?\}` - 匹配 `${VAR}` 或 `${VAR:-default}`
   - `\$\{([^}:]+)(?::=([^}]*))?\}` - 匹配 `${VAR:=default}`
3. 对每个匹配项：
   - 提取变量名和默认值
   - 从 `process.env` 获取变量值
   - 如果未设置且有默认值，使用默认值
   - 如果是 `:=` 语法，同时设置环境变量
4. 返回替换后的字符串

**正则表达式说明**:
- `\$\{` - 匹配 `${`
- `([^}:]+)` - 捕获变量名（不包含 `}` 或 `:`）
- `(?::-([^}]*))?` - 可选的 `:-default` 语法
- `(?::=([^}]*))?` - 可选的 `:=default` 语法

### 10.2 loadConfig() 修改

**修改内容**:
```javascript
// 修改前
const yamlContent = fs.readFileSync(configPath, 'utf8');
const config = parseSimpleYaml(yamlContent);

// 修改后
let yamlContent = fs.readFileSync(configPath, 'utf8');
yamlContent = substituteEnvVars(yamlContent);
const config = parseSimpleYaml(yamlContent);
```

### 10.3 README.md 新增章节

**"环境变量配置"章节位置**: 配置说明章节开头

**内容结构**:
1. 环境变量说明表格（变量名/说明/默认值/示例）
2. 配置方式示例（临时/永久/调用时）
3. config.yaml 中使用环境变量的示例

**"测试与覆盖率"章节位置**: 版本历史章节之前

**内容结构**:
1. 运行测试命令说明
2. 覆盖率报告命令说明
3. 覆盖率报告说明表格
4. 覆盖率门槛说明表格

### 10.4 JSDoc 注释要求

```javascript
/**
 * 替换字符串中的环境变量
 * 
 * 支持以下语法：
 * - ${VAR_NAME} - 替换为环境变量值，未设置时替换为空字符串
 * - ${VAR_NAME:-default} - 替换为环境变量值，未设置时使用默认值
 * - ${VAR_NAME:=default} - 替换为环境变量值，未设置时使用默认值并设置环境变量
 * 
 * @function substituteEnvVars
 * @param {string} str - 包含环境变量占位符的字符串
 * @returns {string} 替换后的字符串
 * 
 * @example
 * // 假设环境变量 OPENCLAW_WORKSPACE_ROOT 未设置
 * substituteEnvVars('${OPENCLAW_WORKSPACE_ROOT:-../../..}')
 * // 返回：'../../..'
 * 
 * @author openclaw-ouyp
 * @since 3.3.0
 */
```

### 10.5 验收检查点

| 检查点 | 文件 | 期望状态 | 验证方法 |
|--------|------|---------|---------|
| C1 | workflow-executor.js | substituteEnvVars() 存在 | `grep "substituteEnvVars"` |
| C2 | workflow-executor.js | JSDoc 注释完整 | `grep -A 20 "@function substituteEnvVars"` |
| C3 | loadConfig() | 调用 substituteEnvVars() | `grep -A 5 "substituteEnvVars(yamlContent)"` |
| C4 | README.md | 环境变量配置章节 | `grep "环境变量配置"` |
| C5 | README.md | 测试与覆盖率章节 | `grep "测试与覆盖率"` |
| C6 | npm test | 通过率>80% | `npm test` |

---

*DETAIL 文档结束*
