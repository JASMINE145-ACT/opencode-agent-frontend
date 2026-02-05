# opencode-agent-frontend

Opencode Agent 前端（原 `data_platform_frontend`）：统一数据平台与 AI Agent 的 Web 界面，Tailadmin 风格。

## 功能

- **Dashboard**：入口、Main Chat、Data Search、Excel 分析快捷入口
- **Skills**：选择 PDF / xlsx 等 Skill，上传或指定文件，执行并查看结果、下载产出
- **Main Chat**：与 OpenCode Agent 对话
- **Data Search**：自然语言查询数据（对接 opencode_agent workflow）
- **登录/设置**：MVP 登录、主题与后端 URL 配置

## 技术栈

- 静态 HTML + Alpine.js + Tailwind CSS
- Webpack 打包（HTML 内联 include、CSS 抽取）
- 后端对接：`opencode_agent`（默认 `http://localhost:8001`）

## 本地运行

```bash
npm install
npm run build    # 输出到 build/
npm start        # 开发服务器 http://localhost:3000
```

需配合 **opencode_agent** 后端（如 8001 端口）使用；Settings 中可配置后端地址。

## 仓库说明

本仓库为从 agent-jk 项目中抽离的前端源码（不含 `node_modules`、`build` 产物及部分二进制图片）。完整资源可从原项目 `data_platform_frontend` 目录同步。
