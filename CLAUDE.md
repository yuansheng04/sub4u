# sub4u

在线订阅管理工具。追踪和分析个人订阅服务的支出。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma + SQLite
- Tailwind CSS 4
- JWT 认证 (jose + bcryptjs)

## 本地开发

```bash
cp .env.example .env   # 填入环境变量
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 项目结构

```
src/app/
├── (app)/              # 需要认证的页面（带 Sidebar 布局）
│   ├── page.tsx        # 订阅管理主页
│   └── security/       # 登录日志 / 安全设置
├── api/
│   ├── auth/           # 登录 / 登出
│   ├── subscriptions/  # 订阅 CRUD
│   └── security/       # 登录日志查询
└── login/              # 登录页
```

## 注意事项

- Next.js 16 有重大变更，写代码前先读 `node_modules/next/dist/docs/`
- .env 中需要 DATABASE_URL 和 AUTH_SECRET，参考 .env.example
