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
│   ├── layout.tsx         # 根布局 + Sidebar
│   ├── page.tsx           # 订阅管理主页
│   ├── globals.css
│   └── api/
│       └── subscriptions/
│           ├── route.ts       # GET, POST
│           └── [id]/route.ts  # PUT, DELETE
├── components/
│   └── Sidebar.tsx
└── lib/
    ├── types.ts           # Subscription 类型
    ├── subscriptions.ts   # JSON 仓储（findAll/create/update/remove）
    └── billing.ts         # calcNextBillDate
```

## 切换到真实数据库

UI 和 API 路由只依赖 `src/lib/subscriptions.ts` 导出的函数。切换到 Postgres/SQLite/其他数据库时，只需重写该文件的内部实现，保持导出签名不变即可。

## 注意事项

- Next.js 16 有重大变更，写代码前先读 `node_modules/next/dist/docs/`
- `data/` 目录已在 `.gitignore` 中，订阅数据不会进入 git
