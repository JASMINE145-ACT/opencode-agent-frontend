# 产品思路：统一 Agent + 侧边栏（GPT 式会话）

> 整理自当前需求：主产品是「类 GPT 的通用 Agent」，data_search / excel 作为 tool/subagent，侧边栏保留 Dashboard、Task List，并增加「新对话」与「文件」区域。

---

## 一、核心定位

**主产品 = 类 ChatGPT 的通用 Agent（类似 opencode_agent）**

- **有 Session**：多轮对话、会话列表、可新建/切换/删除会话
- **有上下文**：同一 session 内延续上文，可基于上一句的回答继续问
- **有 Tool / Subagent**：能调用 data_platform、excel 等能力完成子任务
- **用户典型流程**：
  1. 用户问：「昨天收入是多少？」
  2. Agent 以 **tool 或 subagent** 方式调用 **data_platform**，拿到数据
  3. 用户接着问：「那同比上周呢？」——Agent 基于已有上下文 + 再调 data_platform 作答
  4. 用户上传 Excel 问：「帮我分析这份表」——Agent 调用 **excel** 能力

**data_search / excel 的定位**

- **data_search（data_platform）**：本质是 **一个 tool / 一个 subagent**
  - 输入：自然语言（+ 可选日期等）
  - 输出：数据（表格、指标、SQL 等）
  - 不单独作为「主界面」，而是被主 Agent 在会话中按需调用
- **excel**：同理，作为 **tool/subagent**
  - 输入：文件 + 自然语言
  - 输出：分析结果、表格、结论等

---

## 二、侧边栏结构（先保留再演进）

在现有侧边栏（第二张图）基础上：

| 区域 | 内容 | 说明 |
|------|------|------|
| **MENU** | Dashboard | 保留，总览/入口 |
| | Task List | 保留，任务/会话列表入口 |
| | **Task List 下** | **「新对话」session**：类似 ChatGPT（图三） |
| | | 新对话、会话列表（你的聊天）、可搜索（Ctrl+K） |
| | （原 Data Search / Excel / Chat） | 可收拢为「工具入口」或由主会话内的 tool 调用替代，具体是否保留入口再定 |
| **OTHERS** | Settings | 保留 |
| | Logout | 保留 |
| **文件区** | File / 上传文件 | 上传的文件保存在这里，主 Agent 会话中可引用 |

即：

- **Dashboard**：保留
- **Task List**：保留，其下为 **「新对话」+ 会话列表**（ChatGPT 式）
- **新对话 / Session**：像图三——顶部「新聊天」，下面「你的聊天」列表，支持搜索
- **File**：上传文件，文件列表固定展示在侧边栏某块，主会话里可「用这个文件」让 Agent 调 excel 等

---

## 三、与 opencode_agent / data_platform 的关系

| 角色 | 说明 |
|------|------|
| **前端主界面** | 一个「通用对话」页 = 主 Agent 会话（session + 上下文 + 多轮） |
| **opencode_agent** | 主 Agent 后端：会话管理、多轮对话、决定何时调哪个 tool/subagent |
| **data_platform** | 作为 **tool/subagent**：自然语言 → 数据（收入、报表等），由主 Agent 调用 |
| **excel** | 作为 **tool/subagent**：文件 + 自然语言 → 分析结果，由主 Agent 调用 |

用户只面对「一个聊天窗口」，背后由主 Agent 决定：

- 问「昨天收入」→ 调 data_platform
- 问「分析这个 Excel」→ 调 excel
- 问「把刚才的收入和上周对比」→ 用上下文 + 再调 data_platform

---

## 四、简要结论

1. **主产品**：类 GPT 的通用 Agent（session + 上下文 + tool + subagent），不是「data_search 页」或「excel 页」为主。
2. **data_search / excel**：以 **tool/subagent** 形态被主 Agent 调用，本质是「自然语言/文件 → 数据/分析」。
3. **侧边栏**：保留 Dashboard、Task List；Task List 下做 **新对话 + 会话列表**（类似图三）；增加 **File** 上传与列表。
4. **前端演进**：先保留现有 data_search / excel 入口（或收拢），主界面向「一个通用对话页 + 侧边栏会话/文件」收敛，与 opencode_agent 的 session/tool 模型对齐。

如需可再拆成「阶段一：侧边栏 + 新对话」「阶段二：主会话调 data_platform/excel」等实现步骤。
