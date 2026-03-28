# 示例 2: 增量需求开发

## 场景说明

在现有用户系统基础上，添加头像上传功能，包括文件上传、压缩、缩略图生成、CDN 存储等。

## 使用方式

```bash
/sessions_spawn openclaw-research-workflow

# 任务：添加用户头像上传功能
# 场景类型：增量需求
# 需求描述：
#   在现有用户系统基础上，添加头像上传功能：
#   - 支持 JPG/PNG/GIF 格式
#   - 最大 5MB
#   - 自动压缩和裁剪（1:1 比例）
#   - 自动生成缩略图（200x200）
#   - 存储到 CDN（阿里云 OSS）
#   - 支持删除和更换头像
#   - 头像审核（可选，敏感图片检测）
# 现有系统：
#   - 用户表：users (id, email, password, created_at)
#   - 认证：JWT
#   - 存储：本地文件系统
# 约束条件：
#   - 复用现有用户系统和认证机制
#   - 使用现有 PostgreSQL 数据库
#   - CDN：阿里云 OSS
#   - 图片处理：sharp
#   - 保持向后兼容（不强制头像）
# 验收标准：
#   - 上传成功返回 CDN URL
#   - 自动压缩和生成缩略图
#   - 支持删除和更换头像
#   - 头像 URL 存储在用户表
#   - 所有接口都有完整的单元测试
#   - 集成测试验证完整流程
```

## 预期输出

### 阶段 1: designing

**输出文件**:
- `01_designing/PRD.md` - 产品需求文档（增量版）
- `01_designing/TRD.md` - 技术架构文档（增量版）

**PRD.md 包含**:
- 增量功能需求（头像上传、管理）
- 与现有系统的集成点
- 用户故事（上传、查看、更换、删除）
- 界面设计（头像上传组件、预览）
- 验收标准

**TRD.md 包含**:
- 现有系统分析
- 增量架构设计
- 数据库变更（users 表添加 avatar_url 字段）
- API 设计（POST/PUT/DELETE /api/user/avatar）
- 技术选型（sharp、阿里云 OSS SDK）

### 阶段 2: roadmapping

**输出文件**:
- `02_roadmapping/ROADMAP.md` - 开发计划

**包含**:
- 增量开发阶段
- 与现有系统的集成计划
- 数据迁移计划（如有）
- 回滚计划

### 阶段 3: detailing

**输出文件**:
- `03_detailing/DETAIL.md` - 文件级设计

**包含**:
- 增量文件结构
- 接口定义
- 数据库迁移脚本
- 错误码定义（增量）

### 阶段 4: coding

**输出文件**:
```
04_coding/
├── src/
│   ├── user/
│   │   ├── avatar.js          # 新增
│   │   ├── avatar.test.js     # 新增
│   │   └── user.controller.js # 修改
│   ├── services/
│   │   ├── oss.js             # 新增（阿里云 OSS 服务）
│   │   └── image-processor.js # 新增（图片处理）
│   └── models/
│       └── user.js            # 修改（添加 avatar_url）
├── database/
│   └── migrations/
│       └── add_avatar_url_to_users.sql  # 新增
├── tests/
│   └── integration/
│       └── avatar.test.js     # 新增
└── README.md                  # 更新
```

### 阶段 5: reviewing

**输出文件**:
- `05_reviewing/REVIEW-REPORT.md` - 验收报告

**包含**:
- 增量代码审查结果
- 测试覆盖率报告（增量部分）
- 集成测试报告
- 验收结论

## 完整流程

```
增量需求
  ↓
designing → 分析现有系统 → PRD.md(增量) + TRD.md(增量)
  ↓
roadmapping → 增量开发计划 → ROADMAP.md
  ↓
detailing → 增量文件设计 → DETAIL.md
  ↓
coding → 增量代码 + 测试 + 文档
  ↓
reviewing → 增量验收报告
  ↓
完整研发产出（增量）
```

## 关键检查点

1. **现有系统分析**: 确认理解现有架构和代码
2. **增量设计**: 确认增量部分与现有系统兼容
3. **数据迁移**: 确认迁移脚本安全可回滚
4. **集成测试**: 确认增量功能与现有功能不冲突
5. **验收通过**: 确认增量功能符合预期

## 与全新功能开发的区别

| 方面 | 全新功能 | 增量需求 |
|------|----------|----------|
| **designing** | 完整设计 | 分析现有 + 增量设计 |
| **TRD** | 完整架构 | 现有架构 + 增量变更 |
| **coding** | 从零开始 | 修改/扩展现有代码 |
| **测试** | 完整测试 | 增量测试 + 回归测试 |
| **部署** | 全新部署 | 增量更新 + 数据迁移 |

## 常见问题

**Q: 如何确保增量代码不影响现有功能？**

A: reviewing 阶段包含回归测试，确保现有功能不受影响。

**Q: 数据迁移失败怎么办？**

A: roadmapping 阶段包含回滚计划，迁移脚本必须可回滚。

**Q: 如何管理增量文档？**

A: 增量文档标注版本号，与现有文档一起维护。

## 参考

- [增量设计指南](../../bundled-skills/designing/SKILL.md)
- [代码审查清单](../../bundled-skills/reviewing/CHECKLISTS.md)
- [数据库迁移最佳实践](../../bundled-skills/coding/SKILL.md)
