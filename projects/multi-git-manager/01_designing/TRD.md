# 多 Git 仓库管理工具 - 技术设计文档 (TRD)

> **版本**: v1.0.0  
> **日期**: 2026-04-01  
> **状态**: 待审阅  

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Git 仓库                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  .git/                                          │   │
│  │  ├── hooks/                                     │   │
│  │  │   ├── post-commit → ../.multi-git/hooks/    │   │
│  │  │   └── pre-push → ../.multi-git/hooks/       │   │
│  │  └── config                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  .multi-git/                                    │   │
│  │  ├── config.json         # 配置文件             │   │
│  │  └── hooks/                                     │   │
│  │      ├── sync.sh         # 同步脚本             │   │
│  │      ├── post-commit     # Hook 入口            │   │
│  │      └── pre-push        # Hook 入口            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

| 组件 | 文件 | 职责 |
|------|------|------|
| 配置文件 | `.multi-git/config.json` | 存储主仓库和镜像仓库配置 |
| 同步脚本 | `.multi-git/hooks/sync.sh` | 执行实际的同步逻辑 |
| Post-commit Hook | `.multi-git/hooks/post-commit` | 提交后触发同步 |
| Pre-push Hook | `.multi-git/hooks/pre-push` | 推送前验证配置 |
| 安装脚本 | `install.sh` | 初始化和配置 Hook |

### 1.3 技术栈

| 技术 | 选型 | 理由 |
|------|------|------|
| 脚本语言 | Bash | 跨平台，Git 原生支持 |
| 配置格式 | JSON | 易读，易解析 |
| 依赖 | 无 | 仅使用 Git 和系统命令 |

---

## 2. 核心流程

### 2.1 提交流程

```
用户执行 git commit
        ↓
┌───────────────────┐
│  Git 完成提交     │
└───────────────────┘
        ↓
┌───────────────────┐
│ 触发 post-commit  │
│  Hook             │
└───────────────────┘
        ↓
┌───────────────────┐
│ 读取 config.json  │
│ 获取镜像仓库配置  │
└───────────────────┘
        ↓
┌───────────────────┐
│ 检查 syncMode     │
│ auto: 继续        │
│ manual: 退出      │
└───────────────────┘
        ↓
┌───────────────────┐
│ 获取当前分支名    │
│ 检查是否在同步列表│
└───────────────────┘
        ↓
┌───────────────────┐
│ 遍历 mirrors 数组  │
│ 对每个启用的仓库   │
│ 执行 git push     │
└───────────────────┘
        ↓
┌───────────────────┐
│ 输出同步报告      │
│ 成功/失败状态     │
└───────────────────┘
```

### 2.2 同步流程（带重试）

```
for each mirror in mirrors:
        ↓
┌───────────────────┐
│ 检查 enabled=true │
│ 检查 branches     │
└───────────────────┘
        ↓
┌───────────────────┐
│ 尝试 git push     │
│ mirror.url        │
└───────────────────┘
        ↓
    ┌───────┐
    │ 成功？ │
    └───────┘
     ↓     ↓
    是     否
     ↓     ↓
┌─────────┐  ┌─────────────┐
│ 记录成功 │  │ retry < max │
└─────────┘  └─────────────┘
                ↓     ↓
               是     否
                ↓     ↓
         ┌──────────┐ ┌──────────┐
         │ wait +   │ │ 记录失败 │
         │ retry++  │ └──────────┘
         └──────────┘
```

---

## 3. 数据结构

### 3.1 配置文件结构

```json
{
  "primary": "origin",
  "mirrors": [
    {
      "name": "github",
      "url": "https://github.com/user/repo.git",
      "branches": ["master", "main"],
      "enabled": true
    }
  ],
  "syncMode": "auto",
  "retryCount": 3,
  "retryDelay": 1000,
  "logLevel": "info"
}
```

### 3.2 字段说明

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| primary | string | ✅ | origin | 主仓库 remote 名称 |
| mirrors | array | ✅ | [] | 镜像仓库列表 |
| mirrors[].name | string | ✅ | - | 仓库标识名称 |
| mirrors[].url | string | ✅ | - | 仓库 URL |
| mirrors[].branches | array | ⚠️ | ["master", "main"] | 同步的分支列表 |
| mirrors[].enabled | boolean | ⚠️ | true | 是否启用 |
| syncMode | string | ⚠️ | auto | 同步模式（auto/manual） |
| retryCount | number | ⚠️ | 3 | 失败重试次数 |
| retryDelay | number | ⚠️ | 1000 | 重试间隔（毫秒） |
| logLevel | string | ⚠️ | info | 日志级别 |

---

## 4. 模块设计

### 4.1 配置模块 (config.sh)

**职责**: 读取和解析配置文件

**函数**:
```bash
# 读取配置文件
load_config()

# 获取主仓库
get_primary()

# 获取镜像仓库列表
get_mirrors()

# 验证配置
validate_config()
```

### 4.2 同步模块 (sync.sh)

**职责**: 执行同步逻辑

**函数**:
```bash
# 同步到单个仓库
sync_to_mirror()

# 带重试的同步
sync_with_retry()

# 同步所有镜像仓库
sync_all_mirrors()

# 输出同步报告
print_report()
```

### 4.3 日志模块 (logger.sh)

**职责**: 统一日志输出

**函数**:
```bash
# 信息日志
log_info()

# 调试日志
log_debug()

# 错误日志
log_error()

# 成功标记
log_success()

# 失败标记
log_failure()
```

### 4.4 Hook 模块

**post-commit**:
```bash
#!/bin/bash
# 加载配置
# 检查 syncMode
# 调用 sync_all_mirrors
```

**pre-push**:
```bash
#!/bin/bash
# 验证配置存在
# 验证主仓库配置
# 输出警告（如有）
```

---

## 5. 错误处理

### 5.1 错误类型

| 错误 | 原因 | 处理方式 |
|------|------|---------|
| 配置文件不存在 | .multi-git/config.json 未创建 | 提示用户运行 install.sh |
| 配置格式错误 | JSON 格式不正确 | 输出错误位置，提示修复 |
| 仓库连接失败 | 网络问题/认证失败 | 重试机制，输出错误信息 |
| 分支不匹配 | 当前分支不在同步列表 | 跳过该仓库，记录日志 |

### 5.2 重试机制

```bash
sync_with_retry() {
    local url=$1
    local max_retries=$2
    local delay=$3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if git push "$url" 2>/dev/null; then
            return 0
        fi
        retry=$((retry + 1))
        if [ $retry -lt $max_retries ]; then
            sleep $((delay / 1000))
        fi
    done
    return 1
}
```

---

## 6. 安装流程

### 6.1 安装步骤

```
用户执行 install.sh
        ↓
┌───────────────────┐
│ 检查 Git 是否安装  │
└───────────────────┘
        ↓
┌───────────────────┐
│ 创建 .multi-git/  │
│ 目录结构          │
└───────────────────┘
        ↓
┌───────────────────┐
│ 创建 config.json  │
│ (如不存在)        │
└───────────────────┘
        ↓
┌───────────────────┐
│ 复制 Hook 脚本    │
│ 到 .git/hooks/    │
└───────────────────┘
        ↓
┌───────────────────┐
│ 验证配置          │
│ 输出使用说明      │
└───────────────────┘
```

### 6.2 目录结构

```
.multi-git/
├── config.json          # 配置文件
├── config.template.json # 配置模板
└── hooks/
    ├── sync.sh          # 同步脚本
    ├── logger.sh        # 日志模块
    ├── post-commit      # 提交后 Hook
    └── pre-push         # 推送前 Hook
```

---

## 7. 测试策略

### 7.1 单元测试

| 测试项 | 测试方法 | 预期结果 |
|--------|---------|---------|
| 配置加载 | 提供有效 config.json | 正确解析所有字段 |
| 配置验证 | 提供无效 JSON | 输出错误信息 |
| 同步功能 | 配置测试仓库 | 成功推送 |
| 重试机制 | 模拟网络失败 | 重试指定次数 |

### 7.2 集成测试

| 测试项 | 测试方法 | 预期结果 |
|--------|---------|---------|
| 完整流程 | git commit | 自动同步到镜像仓库 |
| 分支过滤 | 在非同步分支 commit | 不同步 |
| 手动模式 | syncMode=manual | 不同步 |

---

## 8. 部署说明

### 8.1 部署方式

**方式 1: 脚本安装**
```bash
cd /path/to/repo
/path/to/multi-git-manager/install.sh
```

**方式 2: 手动配置**
```bash
# 创建 .multi-git/ 目录
mkdir -p .multi-git/hooks

# 复制配置文件
cp config.template.json .multi-git/config.json

# 复制 Hook 脚本
cp hooks/* .multi-git/hooks/

# 创建 Git Hook 链接
ln -s ../../.multi-git/hooks/post-commit .git/hooks/post-commit
ln -s ../../.multi-git/hooks/pre-push .git/hooks/pre-push
```

### 8.2 配置示例

```bash
# 编辑配置文件
vi .multi-git/config.json

# 配置主仓库和镜像仓库
# 保存后执行测试提交
git commit --allow-empty -m "test sync"
```

---

## 9. 技术决策

### 9.1 为什么选择 Bash？

| 考量 | 说明 |
|------|------|
| 跨平台 | Linux/macOS/Windows Git Bash 都支持 |
| 无依赖 | 不需要安装额外的运行时 |
| Git 集成 | Git Hook 原生支持 Bash 脚本 |

### 9.2 为什么选择 JSON 配置？

| 考量 | 说明 |
|------|------|
| 易读 | 人类可读的配置格式 |
| 易解析 | jq 或内置工具可解析 |
| 易编辑 | 支持注释（通过模板） |

### 9.3 为什么不使用 Git 原生 remote？

| 考量 | 说明 |
|------|------|
| 灵活性 | 可以配置分支过滤、重试等高级功能 |
| 清晰性 | 明确区分主仓库和镜像仓库 |
| 可控性 | 可以选择同步时机和策略 |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 网络波动导致同步失败 | 中 | 重试机制 |
| 配置错误导致同步异常 | 高 | 配置验证 |
| Hook 脚本权限问题 | 中 | 安装脚本设置权限 |
| 并发推送冲突 | 低 | 串行执行同步 |

---

## 11. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本（纯 Git Hook 方案） |

---

*本文档由 clawdevflow 流程引擎生成，openclaw-ouyp 审阅*
