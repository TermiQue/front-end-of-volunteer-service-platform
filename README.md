# Volunteer Service Platform (Uni-app)

基于 Uni-app + Vue 3 + TypeScript 的志愿服务平台前端项目，覆盖志愿者端、管理员端与超级管理员端核心业务。

## 1. 项目简介

本项目主要实现以下能力：

- 志愿者：扫码签到/签退、历史记录查询、事务申请、审核进度查看
- 管理员：项目启停、二维码出码、事务审核（仅可审核权限范围内请求）
- 超级管理员：创建项目、指定/修改项目负责人、全局管理能力

项目已适配新的 `appeal` 审核流程：

- 志愿者发起申请：申诉/时长变更
- 管理员审核：通过/拒绝，审核意见必填
- 志愿者查看审核进度：全部/审核中/通过/拒绝

## 2. 技术栈

- Uni-app 3
- Vue 3 (`<script setup>`)
- TypeScript
- Vite
- Sass

## 3. 目录结构

```text
.
├─ docs/                        # 对接文档与设计说明
│  ├─ api.md                    # API 联调文档（权威）
│  ├─ back_design.md            # 后端设计说明
│  ├─ database.md               # 数据库说明
│  └─ update.md                 # 升级改造说明
├─ src/
│  ├─ components/               # 公共组件
│  ├─ composables/              # 组合式逻辑（鉴权、用户信息等）
│  ├─ pages/                    # 页面
│  │  ├─ admin/                 # 管理端页面
│  │  ├─ volunteer/             # 志愿者页
│  │  └─ mine/                  # 我的页面/资料
│  ├─ utils/                    # 工具与 API 封装
│  │  ├─ request.ts             # 请求封装（鉴权、刷新、重试、缓存）
│  │  ├─ project.ts             # 项目/审核业务 API 封装
│  │  └─ urls.ts                # API/静态资源 URL 处理
│  ├─ App.vue
│  ├─ main.ts
│  ├─ pages.json
│  └─ manifest.json
├─ package.json
└─ vite.config.ts
```

## 4. 环境要求

- Node.js 18+
- npm 9+

建议使用稳定 LTS 版本 Node。

## 5. 安装与启动

### 5.1 安装依赖

```bash
npm install
```

### 5.2 本地开发

H5：

```bash
npm run dev:h5
```

微信小程序：

```bash
npm run dev:mp-weixin
```

### 5.3 构建

H5：

```bash
npm run build:h5
```

微信小程序：

```bash
npm run build:mp-weixin
```

### 5.4 类型检查

```bash
npm run type-check
```

## 6. 环境变量

项目通过 `VITE_API_BASE_URL` 指定后端 API 基地址（`src/utils/urls.ts`）。

可在根目录创建 `.env`：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

说明：

- 生产环境请使用部署域名
- 变量应包含 `/api` 前缀，便于与请求封装保持一致

## 7. 核心业务规则（前端联调重点）

### 7.1 角色与权限

- `role=0` 志愿者
- `role=2` 管理员
- `role=3` 超级管理员

关键约束：

- 仅超级管理员可创建项目与修改负责人
- 已结束项目不允许修改负责人
- 管理员仅能操作自己权限范围项目与审核请求

### 7.2 事务申请（Appeal）

- 发起接口：`POST /api/appeals`
- 可申请对象：`GET /api/appeals/targets`
- 我的审核进度：`GET /api/appeals/my`

前端已实现：

- 申请弹窗默认筛选“全部”，支持切换“申诉/变更”
- 提交前校验：同项目若已有“审核中”申请，不允许重复发起
- 审核进度支持状态筛选：全部、审核中、通过、拒绝

### 7.3 审核流程

- 管理端列表：`GET /api/admin/appeals`
- 通过：`POST /api/admin/appeals/:appealId/approve`
- 拒绝：`POST /api/admin/appeals/:appealId/reject`

前端规则：

- 通过/拒绝均要求填写审核意见（必填）

## 8. 主要页面说明

- 志愿者主页：`src/pages/volunteer/volunteer.vue`
- 管理员项目管理：`src/pages/admin/project-manage.vue`
- 管理员事务审核：`src/pages/admin/project-review.vue`
- 管理员签到管理：`src/pages/admin/check.vue`、`src/pages/admin/qr-attendance.vue`

## 9. 请求与鉴权说明

请求封装位于 `src/utils/request.ts`，具备：

- Bearer Token 注入
- 401 自动 refresh 与会话续期
- GET 缓存与请求去重
- 并发请求数控制

若 refresh 失败，前端会清理会话并跳转登录流程。

## 10. 文档索引

- API 文档：`docs/api.md`
- 升级说明：`docs/update.md`
- 后端设计：`docs/back_design.md`
- 数据库说明：`docs/database.md`

## 11. 常见问题

1. `npm run dev:h5` 启动失败

- 先执行 `npm install`
- 再执行 `npm run type-check` 查看 TS 错误
- 检查 `.env` 中 `VITE_API_BASE_URL` 是否有效

2. 接口全返回未登录

- 检查本地登录态是否过期
- 确认后端 CORS、网关和 token 刷新接口可用

3. 小程序真机资源加载异常

- 检查后端域名是否加入小程序合法域名白名单
- 检查静态资源路径与 `getAssetUrl` 解析是否一致

## 12. 开发约定（建议）

- 页面仅处理 UI 与交互，业务请求统一放在 `src/utils/project.ts`
- 新增接口优先在 `project.ts` 建类型 + 映射，避免页面直接处理后端原始字段
- 权限判断统一走页面守卫与导航守卫，避免分散在按钮层级
