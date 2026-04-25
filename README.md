# 志愿服务平台

基于 **Uni-app 3 + Vue 3 + TypeScript + Vite** 的志愿服务管理平台前端，覆盖志愿者端、管理员端与超级管理员端核心业务。主要面向微信小程序，同时支持 H5 及多端构建。

## 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [角色与权限](#角色与权限)
- [页面地图](#页面地图)
- [目录结构](#目录结构)
- [环境要求](#环境要求)
- [安装与启动](#安装与启动)
- [环境变量](#环境变量)
- [项目架构](#项目架构)
- [核心业务规则](#核心业务规则)
- [文档索引](#文档索引)
- [常见问题](#常见问题)

## 项目简介

本项目为中国矿业大学公共管理学院志愿服务团队开发，主要实现以下能力：

| 角色 | 功能 |
|---|---|
| 志愿者 (role=0) | 扫码签到/签退、历史记录查询、事务申请（申诉/时长变更）、审核进度查看 |
| 临界青年 (role=1) | 专属临界青年页面 |
| 管理员 (role=2) | 项目启停、二维码出码、事务审核、志愿者信息管理、打卡管理 |
| 超级管理员 (role=3) | 创建项目、指定/修改项目负责人、全局管理 |

### 事务申请（Appeal）流程

```
志愿者发起申请（申诉/时长变更） → 管理员审核（通过/拒绝，审核意见必填） → 志愿者查看进度
```

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Uni-app 3 |
| UI 运行时 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite 5 |
| 样式 | Sass (SCSS) |
| 包管理 | npm |
| 目标平台 | 微信小程序（主）/ H5 / 其他小程序 |

## 角色与权限

| 角色值 | 名称 | 权限说明 |
|---|---|---|
| 0 | 志愿者 | 扫码签到/签退、查看个人记录、提交事务申请、查看审核进度 |
| 1 | 临界青年 | 临界青年专属页面 |
| 2 | 管理员 | 项目启停、二维码出码、事务审核、志愿者管理、打卡管理 |
| 3 | 超级管理员 | 管理员全部权限 + 创建项目、修改项目负责人 |

关键约束：

- 仅超级管理员可创建项目与修改项目负责人
- 已结束的项目不允许修改负责人
- 管理员仅能操作自己权限范围内的项目与审核请求

## 页面地图

### 通用页面

| 路由 | 标题 | 说明 |
|---|---|---|
| `pages/index/index` | 首页 | 轮播图、团队介绍、功能入口 |
| `pages/mine/mine` | 我的 | 个人信息、登录/退出、身份切换 |
| `pages/mine/profile-form` | 完善信息 | 填写/编辑志愿者资料 |
| `pages/message/message` | 消息 | 通知列表，支持已读/未读标记 |

### 志愿者端 (role=0)

| 路由 | 标题 | 说明 |
|---|---|---|
| `pages/volunteer/volunteer` | 志愿者 | 项目列表、扫码签到/签退入口 |
| `pages/volunteer/appeal` | 事务申请 | 提交申诉或时长变更申请 |
| `pages/volunteer/progress` | 审核进度 | 查看申请审核状态（全部/审核中/通过/拒绝） |

### 临界青年 (role=1)

| 路由 | 标题 | 说明 |
|---|---|---|
| `pages/juvenile/juvenile` | 临界青年 | 临界青年专属页面 |

### 管理端 (role=2, 3)

| 路由 | 标题 | 说明 |
|---|---|---|
| `pages/admin/admin` | 管理员 | 管理端首页/仪表盘 |
| `pages/admin/project-manage` | 项目管理 | 项目 CRUD、分配负责人、启停项目 |
| `pages/admin/project-review` | 申请审批 | 审核志愿者提交的事务申请 |
| `pages/admin/clockin` | 打卡管理 | 扫码签到/签退记录管理 |
| `pages/admin/volunteer-info` | 志愿者信息管理 | 志愿者列表、筛选、查看详情 |
| `pages/admin/volunteer-detail` | 志愿者详情 | 单个志愿者信息、项目记录、打卡记录 |
| `pages/admin/juvenile` | 临界少年信息管理 | 临界青年数据管理 |

## 目录结构

```text
.
├── docs/                           # 对接文档与设计说明
│   ├── api.md                      # API 联调文档（权威参考）
│   ├── back_design.md              # 后端认证与权限设计
│   └── database.md                 # 数据库表结构说明
├── src/
│   ├── components/                 # 公共组件
│   │   ├── BottomTabbar.vue        # 底部 Tab 导航栏（含未读角标）
│   │   ├── BackgroundGlow.vue      # 背景光效
│   │   ├── DateRangeFilter.vue     # 日期范围筛选
│   │   ├── PopupDateCalendar.vue   # 日期选择弹窗
│   │   ├── PopupDurationPicker.vue # 时长选择弹窗
│   │   ├── PopupTimePicker.vue     # 时间选择弹窗
│   │   ├── SegmentFilter.vue       # 分段筛选器
│   │   ├── FilterInput.vue         # 过滤输入框
│   │   ├── ProjectRecordSection.vue# 项目记录展示区
│   │   └── list/                   # 列表子组件
│   ├── composables/                # 组合式函数
│   │   ├── useAuthGuard.ts         # 页面鉴权守卫
│   │   └── useUserInfo.ts          # 用户信息管理
│   ├── pages/                      # 页面
│   │   ├── index/                  # 首页
│   │   ├── volunteer/              # 志愿者页面
│   │   ├── admin/                  # 管理端页面
│   │   ├── mine/                   # 个人中心
│   │   ├── message/                # 消息通知
│   │   └── juvenile/               # 临界青年
│   ├── utils/                      # 工具与 API 封装
│   │   ├── request.ts              # 请求封装（鉴权、刷新、缓存、去重、并发控制）
│   │   ├── project.ts              # 业务 API 封装与类型定义
│   │   ├── auth.ts                 # 认证状态管理
│   │   ├── urls.ts                 # API/静态资源 URL 处理
│   │   ├── constants.ts            # 常量定义
│   │   ├── navigation.ts           # 导航守卫（Tab 切换鉴权）
│   │   └── notification.ts         # 通知相关 API
│   ├── App.vue                     # 根组件（启动时恢复登录态）
│   ├── main.ts                     # 入口文件
│   ├── pages.json                  # 路由配置
│   ├── manifest.json               # 平台配置
│   └── uni.scss                    # 全局 SCSS 变量
├── .env                            # 环境变量
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html                      # H5 入口
```

## 环境要求

- **Node.js** 18+
- **npm** 9+
- 微信小程序开发需安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

## 安装与启动

### 安装依赖

```bash
npm install
```

### 本地开发

微信小程序（主要目标平台）：

```bash
npm run dev:mp-weixin
```

然后用微信开发者工具打开 `dist/dev/mp-weixin` 目录。

H5：

```bash
npm run dev:h5
```

浏览器访问 `http://127.0.0.1:4173`。

### 构建

```bash
npm run build:mp-weixin   # 微信小程序
npm run build:h5           # H5
```

### 类型检查

```bash
npm run type-check
```

## 环境变量

在项目根目录创建 `.env` 文件：

```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_PAGE_SIZE=10
VITE_VISION=v1.0.0
```

| 变量 | 说明 | 默认值 |
|---|---|---|
| `VITE_API_BASE_URL` | 后端 API 基地址（需包含 `/api` 前缀） | - |
| `VITE_PAGE_SIZE` | 列表默认分页大小 | `10` |
| `VITE_VISION` | 版本号标识 | `v1.0.0` |

## 项目架构

### 请求层 (`src/utils/request.ts`)

集中式 HTTP 客户端，提供：

- **Bearer Token 注入** — 自动在请求头附加 JWT access token
- **401 自动刷新** — token 过期时自动使用 refresh token 续期，刷新失败则清除登录态
- **GET 缓存** — 8 秒默认 TTL，减少重复请求
- **请求去重** — 相同请求并发时自动合并
- **并发控制** — 最大 4 个并发请求

### 业务 API 层 (`src/utils/project.ts`)

所有业务接口和类型定义集中管理，页面不直接调用后端。处理前后端字段命名不一致（snake_case ↔ camelCase）。

### 认证模块 (`src/utils/auth.ts`)

管理登录态、用户信息、头像缓存（小程序端下载后本地缓存 7 天）。

### 导航守卫 (`src/utils/navigation.ts`)

Tab 切换时统一检查登录状态、资料完整性和角色权限。

### 页面鉴权 (`src/composables/useAuthGuard.ts`)

页面级鉴权守卫，进入页面前校验登录态和角色。

### 静态资源 (`src/utils/urls.ts`)

小程序端自动下载公开文件并缓存 7 天，减少网络请求。

## 核心业务规则

### 事务申请 (Appeal)

- 发起：`POST /api/appeals`
- 可申请对象：`GET /api/appeals/targets`
- 我的进度：`GET /api/appeals/my`
- 同一项目下已有"审核中"申请时，不允许重复提交

### 审核流程

- 管理端列表：`GET /api/admin/appeals`
- 通过：`POST /api/admin/appeals/:appealId/approve`
- 拒绝：`POST /api/admin/appeals/:appealId/reject`
- 通过和拒绝均需填写审核意见（必填）

### 扫码签到/签退

- 管理员在项目详情中生成签到/签退二维码
- 志愿者扫码后自动记录打卡时间
- QR token 5 秒内有效，防止重复使用

## 文档索引

| 文档 | 说明 |
|---|---|
| [docs/api.md](docs/api.md) | 完整 API 接口文档（请求/响应/错误码） |
| [docs/back_design.md](docs/back_design.md) | 后端认证与权限设计 |
| [docs/database.md](docs/database.md) | 数据库表结构说明 |

## 常见问题

**1. `npm run dev:h5` 启动失败**

先执行 `npm install`，再执行 `npm run type-check` 查看 TypeScript 错误，确认 `.env` 中 `VITE_API_BASE_URL` 配置正确。

**2. 接口全部返回未登录**

检查本地登录态是否过期，确认后端 CORS 配置、网关和 token 刷新接口可用。

**3. 小程序真机资源加载异常**

确认后端域名已加入小程序合法域名白名单，检查静态资源路径与 `getAssetUrl` 解析是否一致。

**4. 微信开发者工具打开项目后白屏**

确保微信开发者工具已开启"将 JS 编译成 ES5"选项，并在项目设置中勾选"不校验合法域名"（开发阶段）。

**5. 事务申请提交失败提示"重复申请"**

同一项目下已有状态为"审核中"的申请，需等待该申请处理完毕后方可重新提交。

## 开发约定

- 页面仅处理 UI 与交互，业务请求统一放在 `src/utils/project.ts`
- 新增接口在 `project.ts` 中定义类型和字段映射，避免页面直接处理后端原始字段
- 权限判断统一走 `useAuthGuard` 和导航守卫，不在按钮层级分散判断
- 组件命名使用 PascalCase，文件目录使用 kebab-case
- 提交前运行 `npm run type-check` 确保无类型错误
