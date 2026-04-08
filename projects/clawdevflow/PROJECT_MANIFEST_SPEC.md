# PROJECT_MANIFEST.json 规范

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **用途**: 项目自描述文件，定义 test/lint/build 命令

---

## 文件位置

项目根目录：`PROJECT_MANIFEST.json`

---

## 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `language` | string | 编程语言：`"node" | "python" | "go" | "java" | "mixed"` |
| `commands.test` | string | 测试命令（必填） |
| `commands.verify` | string | 验收命令（必填，可先占位） |

---

## 选填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `commands.lint` | string | Lint 命令 |
| `commands.build` | string | 构建命令 |
| `commands.run` | string | 运行命令 |

---

## 模板

### Node.js 项目

```json
{
  "language": "node",
  "commands": {
    "test": "npm test",
    "lint": "npm run lint",
    "build": "npm run build",
    "run": "npm start",
    "verify": "./scripts/verify.sh"
  }
}
```

### Python 项目

```json
{
  "language": "python",
  "commands": {
    "test": "pytest tests/",
    "lint": "flake8 src/",
    "build": "python setup.py build",
    "run": "python src/main.py",
    "verify": "./scripts/verify.sh"
  }
}
```

### Go 项目

```json
{
  "language": "go",
  "commands": {
    "test": "go test ./...",
    "lint": "golangci-lint run",
    "build": "go build -o bin/app",
    "run": "go run main.go",
    "verify": "./scripts/verify.sh"
  }
}
```

### Java 项目

```json
{
  "language": "java",
  "commands": {
    "test": "mvn test",
    "lint": "mvn checkstyle:check",
    "build": "mvn package",
    "run": "mvn spring-boot:run",
    "verify": "./scripts/verify.sh"
  }
}
```

---

## 质量门禁（Coding 阶段）

### Gate 列表

| Gate | 检查项 | 失败处理 |
|------|--------|---------|
| C0 | PROJECT_MANIFEST.json 存在 | reject → 自动返工 |
| C1 | commands.test 存在且非空 | reject → 自动返工 |
| C2 | 执行 commands.test 成功 | reject → 自动返工（TEST_FAILED） |
| C3 | commands.lint 存在则必须通过 | reject → 自动返工（LINT_FAILED） |
| C4 | commands.build 存在则必须通过 | reject → 自动返工（BUILD_FAILED） |
| C5 | CHANGESET.md 存在且包含 test 命令 | reject → 自动返工 |

### 失败语义

- Gate 失败：`decision = reject` → 自动返工（while-loop）
- `clarify` 的语义：需要人工介入，会导致 stage 进入 `BLOCKED`（暂停）
- **重试耗尽（>= maxRetries）最终状态：`TERMINATED`（硬失败）** ← 拍板决策
- `commands.verify`：字段必须存在；但当前阶段不执行 verify（后续 verification 才执行）

### 重试机制

- 最大重试次数：`maxRetries = 3`
- 每次 reject → `retryCount++` → 写入 `lastRegenerateHint` → 下一轮注入 hint
- 重试耗尽 → `TERMINATED`（需要人工介入）

---

## 示例项目

### 示例 1：Node.js Web 应用

```json
{
  "language": "node",
  "commands": {
    "test": "jest --coverage",
    "lint": "eslint src/ --ext .js,.jsx",
    "build": "webpack --mode production",
    "run": "node dist/server.js",
    "verify": "./scripts/verify.sh"
  }
}
```

### 示例 2：Python API 服务

```json
{
  "language": "python",
  "commands": {
    "test": "pytest tests/ -v --cov=src",
    "lint": "black src/ --check && flake8 src/",
    "build": "python -m build",
    "run": "uvicorn src.main:app --reload",
    "verify": "./scripts/verify.sh"
  }
}
```

### 示例 3：Go 微服务

```json
{
  "language": "go",
  "commands": {
    "test": "go test -race -cover ./...",
    "lint": "golangci-lint run --timeout 5m",
    "build": "CGO_ENABLED=0 go build -ldflags='-w -s' -o bin/service",
    "run": "go run cmd/service/main.go",
    "verify": "./scripts/verify.sh"
  }
}
```

---

## 与引擎集成

### workflow-orchestrator.js

```javascript
// prepareStageInput('coding')
input.manifestFile = path.join(projectPath, 'PROJECT_MANIFEST.json');
input.attempt = (codingStage.retryCount || 0) + 1;
input.regenerateHint = this.stateManager.state.stages.coding.lastRegenerateHint || '';
```

### review-orchestrator.js

```javascript
// executeAutoReview('coding')
// Gate C0-C5 检查
// 执行 commands.test/lint/build
// 返回 pass/reject + fixItems
```

### stage-executor.js

```javascript
// executeCoding()
// Gate 防绕过：校验 manifest 存在 + commands.test 存在
// 确保 CHANGESET.md 一定存在
```

---

## 验收用例

| 用例 | 验证点 | 期望结果 |
|------|--------|---------|
| 无 manifest | 不创建 PROJECT_MANIFEST.json | reject（MANIFEST_MISSING） |
| manifest 无效 | JSON 格式错误 | reject（MANIFEST_INVALID） |
| test 缺失 | 缺少 commands.test | reject（TEST_COMMAND_MISSING） |
| test 失败 | commands.test 执行失败 | reject（TEST_FAILED） |
| test 通过 | commands.test 执行成功 | pass |
| lint 失败 | commands.lint 执行失败 | reject（LINT_FAILED） |
| build 失败 | commands.build 执行失败 | reject（BUILD_FAILED） |
| CHANGESET 缺失 | 无 CHANGESET.md | reject（CHANGESET_MISSING） |
| CHANGESET 无 test | 未包含 test 命令 | reject（CHANGESET_NO_TEST） |

---

*PROJECT_MANIFEST 规范 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08
