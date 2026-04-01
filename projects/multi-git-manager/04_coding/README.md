# multi-git-manager

> 基于 Git Hook 的多仓库同步工具 - 一次提交，自动同步到多个远程仓库

## 快速开始

### 安装

```bash
# 克隆或下载本工具
git clone <this-repo> /path/to/multi-git-manager

# 在你的项目仓库中执行安装
cd /path/to/your/repo
/path/to/multi-git-manager/04_coding/install.sh
```

### 配置

编辑 `.multi-git/config.json`：

```json
{
  "primary": "origin",
  "mirrors": [
    {
      "name": "github",
      "url": "https://github.com/USERNAME/REPO.git",
      "branches": ["master", "main"],
      "enabled": true
    },
    {
      "name": "gitee",
      "url": "git@gitee.com:USERNAME/REPO.git",
      "branches": ["master"],
      "enabled": true
    }
  ],
  "syncMode": "auto",
  "retryCount": 3,
  "retryDelay": 1000,
  "logLevel": "info"
}
```

### 使用

```bash
# 正常提交代码
git add .
git commit -m "your message"

# 自动同步到镜像仓库
# 输出示例：
# [multi-git] 开始同步到镜像仓库...
# [multi-git] ✓ github: 推送成功 (master)
# [multi-git] ✓ gitee: 推送成功 (master)
# [multi-git] 同步完成，共 2 个仓库
```

## 配置说明

### 字段说明

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

### 同步模式

- `auto`: 提交后自动同步（默认）
- `manual`: 需要手动触发同步

### 分支过滤

配置 `branches` 数组选择需要同步的分支：

```json
{
  "name": "github",
  "branches": ["master", "main", "develop"]
}
```

## 目录结构

```
your-repo/
├── .git/
│   └── hooks/
│       ├── post-commit → ../../.multi-git/hooks/post-commit
│       └── pre-push → ../../.multi-git/hooks/pre-push
└── .multi-git/
    ├── config.json           # 配置文件
    ├── config.template.json  # 配置模板
    └── hooks/
        ├── logger.sh         # 日志模块
        ├── config.sh         # 配置模块
        ├── sync.sh           # 同步脚本
        ├── post-commit       # 提交后 Hook
        └── pre-push          # 推送前 Hook
```

## 故障排除

### Hook 未触发

检查 Hook 是否有执行权限：

```bash
chmod +x .git/hooks/post-commit
chmod +x .multi-git/hooks/*.sh
```

### 同步失败

1. 检查网络连接
2. 检查仓库 URL 是否正确
3. 检查 Git 认证配置（SSH Key 或 Token）

### 查看调试日志

设置 `logLevel: "debug"` 查看详细日志：

```json
{
  "logLevel": "debug"
}
```

## 卸载

```bash
# 删除 .multi-git 目录
rm -rf .multi-git

# 删除 Git Hook
rm .git/hooks/post-commit
rm .git/hooks/pre-push
```

## 许可证

MIT
