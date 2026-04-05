# sub4u

个人订阅管理工具，追踪所有在线订阅服务的支出。

## 功能

**订阅管理**
- 增删改查订阅服务
- 分类管理、合租标记、敏感模式

**账单与币种**
- 多币种支持（CNY、USD、EUR 等 10 种）
- 按计费周期自动计算下次扣费日

**可视化**
- 日历视图（年 → 月 钻取）
- 时间线视图

## 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4

数据以 JSON 文件形式保存在本地 `data/subs.json`，无需数据库。

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:3000 即可。

## 项目结构

```
src/
├── app/              # 页面与 API 路由
├── components/       # UI 组件
└── lib/              # 数据仓储、工具函数
```

## License

MIT
