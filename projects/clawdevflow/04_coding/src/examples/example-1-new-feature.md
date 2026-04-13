# 示例 1: 全新功能开发

## 场景说明

从 0 到 1 创建用户登录功能，包括邮箱密码登录、JWT 认证、记住登录状态等。

## 使用方式

先准备 `REQUIREMENTS.md`（示例内容）：

```markdown
# 用户登录功能 - 需求说明

## v1.0.0
### 目标
- 邮箱和密码登录
- JWT 认证
- 记住登录状态（7 天）

### 约束条件
- 后端：Node.js + Express
- 数据库：PostgreSQL
- 密码加密：bcrypt
- JWT 过期时间：2 小时
- Redis 用于登录失败计数和锁定

### 验收标准
- 登录成功返回 JWT token 和用户信息
- 登录失败返回明确错误信息（密码错误/账户锁定/账户不存在）
- 触发锁定后返回锁定剩余时间
- 密码强度验证在前端和后端都执行
- 所有接口都有完整的单元测试
```

```bash
/sessions_spawn clawdevflow

# 任务：创建用户登录功能
# 场景类型：全新功能
# 需求说明：REQUIREMENTS.md
# 约束条件：见 REQUIREMENTS.md
# 验收标准：见 REQUIREMENTS.md
```

## 预期输出

### 阶段 1: designing

**输出文件**:
- `01_designing/PRD.md` - 产品需求文档
- `01_designing/TRD.md` - 技术架构文档

**PRD.md 包含**:
- 功能需求（登录、锁定、密码重置）
- 用户故事
- 界面设计（登录表单、错误提示）
- 验收标准

**TRD.md 包含**:
- 系统架构
- 数据库设计（users 表）
- API 设计（POST /api/auth/login）
- 技术选型（JWT、bcrypt、Redis）

### 阶段 2: roadmapping

**输出文件**:
- `02_roadmapping/ROADMAP.md` - 开发计划

**包含**:
- 开发阶段（设计→实现→测试→部署）
- 里程碑
- 时间估算
- 资源需求

### 阶段 3: detailing

**输出文件**:
- `03_detailing/DETAIL.md` - 文件级设计

**包含**:
- 文件结构
- 接口定义
- 数据模型
- 错误码定义

### 阶段 4: coding

**输出文件**:
```
04_coding/
├── src/
│   ├── auth/
│   │   ├── login.js
│   │   ├── login.test.js
│   │   ├── password-reset.js
│   │   └── password-reset.test.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rate-limit.js
│   └── models/
│       └── user.js
├── tests/
│   └── integration/
│       └── auth.test.js
└── README.md
```

### 阶段 5: reviewing

**输出文件**:
- `05_reviewing/FINAL_REPORT.md` - 验收报告
- `05_reviewing/RELEASE_READINESS.json` - 发布就绪凭证

**包含**:
- 代码审查结果
- 测试覆盖率报告
- 验收结论

## 完整流程

```
用户需求
  ↓
designing → PRD.md + TRD.md
  ↓
roadmapping → ROADMAP.md
  ↓
detailing → DETAIL.md
  ↓
coding → 代码 + 测试 + 文档
  ↓
reviewing → 验收报告
  ↓
完整研发产出
```

## 关键检查点

1. **designing 完成后**: 确认 PRD 和 TRD 完整性
2. **roadmapping 完成后**: 确认开发计划可行性
3. **detailing 完成后**: 确认文件级设计可实施
4. **coding 完成后**: 确认代码质量和测试覆盖率
5. **reviewing 完成后**: 确认验收通过

## 常见问题

**Q: 如果需求不明确怎么办？**

A: designing skill 会主动询问需求细节，一次一问，直到需求清晰。

**Q: 可以跳过某些阶段吗？**

A: 不建议。完整流程保证质量。如果时间紧迫，可简化文档但不可跳过检查点。

**Q: 如何修改已生成的文档？**

A: 可重新运行 designing skill，选择"增量"模式进行修改。

## 参考

- [PRD 模板](../../bundled-skills/designing/TEMPLATES.md)
- [TRD 模板](../../bundled-skills/designing/TEMPLATES.md)
- [代码审查清单](../../bundled-skills/reviewing/CHECKLISTS.md)
