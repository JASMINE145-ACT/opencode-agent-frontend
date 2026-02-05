# 前端问题列表（发给 GLM）

**项目**：`data_platform_frontend`  
**开发环境**：`npm start` → http://localhost:3000  
**截图**：见附件两张（Data Search 报错页、main-chat 404 页）

---

## 问题一：Data Search 页面执行查询时报错「APIClient is not defined」

### 现象
- 在 Data Search 页面输入查询（例如「啊」）、选择日期（如 2026-02-01），点击 **Execute Query** 后，页面底部出现红色错误条：
  - **Error: APIClient is not defined**

### 复现步骤
1. 登录后进入 Data Search 页面（或直接访问 http://localhost:3000/data_search.html）
2. 在「Your Query」输入任意内容
3. 选择日期
4. 点击「Execute Query」

### 原因说明
- `data_search.html` 通过 `<script src="./components/api-client.js" type="module"></script>` 加载了 `api-client.js`。
- `api-client.js` 是 **ES Module**（`type="module"`），内部定义了 `class APIClient`，但**没有**把它挂到 `window` 上，只 `export` 了 `dataPlatformClient`、`opencodeAgentClient` 等实例。
- 页面上用于执行查询的逻辑是在 **Alpine.js 的 x-init** 里通过 `window.runQuery` 定义的，其中使用了 `new APIClient('data_platform')`。这段代码运行在**全局作用域**，无法访问 Module 内部未暴露的 `APIClient`，因此会报「APIClient is not defined」。

### 期望
- 点击 Execute Query 后能正常调用 `APIClient` 发起请求（或走 Mock），不再出现「APIClient is not defined」。

### 建议修复方向
- 在 `api-client.js` 中导出 `APIClient` 并在加载后挂到全局，例如：  
  `export { APIClient };` 并在模块末尾执行 `window.APIClient = APIClient;`  
  或  
  将 Data Search 的请求逻辑改为通过单独入口脚本以 import 方式使用 `APIClient`，而不是在 x-init 里直接使用全局名。

---

## 问题二：访问 main-chat.html 返回 404（Cannot GET /main-chat.html）

### 现象
- 点击侧边栏「New Chat」或直接访问  
  `http://localhost:3000/main-chat.html?session=session-xxx`  
  时，页面显示：
  - **Cannot GET /main-chat.html**

### 复现步骤
1. 登录后进入 Dashboard（index.html）
2. 在侧边栏「CHAT SESSIONS」区域点击「New Chat」  
  或  
3. 在地址栏直接输入：`http://localhost:3000/main-chat.html` 或带 `?session=xxx` 的地址

### 原因说明
- 项目根目录下**确实存在** `main-chat.html` 源文件。
- 当前使用 **webpack-dev-server**（`npm start`）时，实际提供的是 **构建输出**（内存或 `build/` 目录）。  
- `main-chat.html` 没有被正确纳入构建产物或 dev server 的提供列表，因此请求 `/main-chat.html` 时服务器返回 404（Cannot GET /main-chat.html）。  
- 可能原因包括：  
  - `webpack.config.js` 里 `HtmlWebpackPlugin` 的入口列表（如 `glob.sync('./*.html')`）未包含 `main-chat.html`，或  
  - dev server 未重启/未重新构建，导致新加的 `main-chat.html` 未被包含。

### 期望
- 访问 `http://localhost:3000/main-chat.html` 或带 session 参数的该 URL 时，能正常打开主对话页，而不是 404。

### 建议修复方向
- 确认 `webpack.config.js` 中生成 HTML 的配置（如 `glob.sync('./*.html')`）会包含 `main-chat.html`。
- 执行一次 `npm run build` 后检查 `build/` 下是否生成 `main-chat.html`；若有，再执行 `npm start` 并重启 dev server 后重试访问。
- 若仍 404，可检查 webpack-dev-server 的 `static`/`devMiddleware` 配置，确保 dev 时也会提供所有由 HtmlWebpackPlugin 生成的 HTML。

---

## 总结

| 问题 | 页面/操作 | 报错/现象 | 核心原因 |
|------|------------|-----------|----------|
| 1 | Data Search → Execute Query | Error: APIClient is not defined | ES Module 未把 APIClient 暴露给全局，x-init 里用到的全局名不存在 |
| 2 | 点击 New Chat 或直接访问 main-chat.html | Cannot GET /main-chat.html (404) | main-chat.html 未进入 webpack 构建产物或 dev server 的提供列表 |

如需补充截图路径或环境版本，可以再加一节「环境与附件」说明。
