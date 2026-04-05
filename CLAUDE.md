# sub4u

在线订阅管理工具。追踪和分析个人订阅服务的支出。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- JSON 文件存储（`data/subs.json`），通过 `src/lib/subscriptions.ts` 仓储层访问

## 本地开发

```bash
npm install
npm run dev
```

无需配置环境变量，数据会在首次写入时自动创建 `data/subs.json`。

## 项目结构

```
src/
├── app/
│   ├── layout.tsx         # 根布局 + Sidebar + NextIntlClientProvider
│   ├── page.tsx           # 订阅管理主页
│   ├── globals.css
│   ├── actions/
│   │   └── locale.ts      # Server Action：切换 locale cookie
│   └── api/
│       ├── subscriptions/
│       │   ├── route.ts       # GET, POST
│       │   └── [id]/route.ts  # PUT, DELETE
│       └── exchange-rate/route.ts
├── components/
│   ├── Sidebar.tsx
│   ├── LanguageSwitcher.tsx
│   ├── SubscriptionForm.tsx
│   ├── CalendarWidget.tsx
│   ├── TimelineView.tsx
│   └── Favicon.tsx
├── i18n/
│   ├── config.ts          # locale 常量（客户端安全）
│   ├── request.ts         # next-intl 配置入口（按 cookie 读 locale）
│   └── language/          # 语言包
│       ├── zh-CN.json
│       └── en.json
└── lib/
    ├── types.ts           # Subscription 类型
    ├── subscriptions.ts   # JSON 仓储（findAll/create/update/remove）
    ├── billing.ts         # calcNextBillDate
    ├── date-utils.ts      # getNextBillDate, getBillingDatesInYear
    ├── constants.ts       # CYCLE_KEYS, CATEGORY_KEYS, CURRENCIES, CYCLE_DAYS
    └── category-migrate.ts # 中文 category → key 的兜底迁移
```

## 国际化（i18n）

基于 `next-intl` 的 cookie 方案，URL 不变。默认 zh-CN，支持 en。切换时 `Sidebar` 底部的 `LanguageSwitcher` 会写 `sub4u-locale` cookie 并 `router.refresh()`。

- 所有文案在 `src/i18n/language/{locale}.json` 里按命名空间组织
- `category`/`cycle` 字段在数据库里存 key（如 `"entertainment"`、`"monthly"`），展示时用 `t(\`categories.${key}\`)` 翻译
- 日期格式化统一走 `useFormatter()`，不要直接用 `toLocaleDateString`
- 加新增语言：在 `src/i18n/language/` 下加 JSON，在 `src/i18n/config.ts` 的 `LOCALES` 里加 code

## 切换到真实数据库

UI 和 API 路由只依赖 `src/lib/subscriptions.ts` 导出的函数。切换到 Postgres/SQLite/其他数据库时，只需重写该文件的内部实现，保持导出签名不变即可。

## 注意事项

- Next.js 16 有重大变更，写代码前先读 `node_modules/next/dist/docs/`
- `data/` 目录已在 `.gitignore` 中，订阅数据不会进入 git
- `cookies()` 在 Next.js 16 是 async 的，`await cookies()` 后再用
