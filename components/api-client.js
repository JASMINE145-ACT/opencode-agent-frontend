// API Client for dual backend integration
// Supports data_platform (port 8000) and opencode_agent (port 8001)

// 统一后端：opencode_agent (8001) 同时提供 chat 和 workflow，Data Search 可直连 8001
const API_BASE_URL = {
  data_platform: 'http://localhost:8001/api',  // 使用 opencode_agent 的 /api/workflow/run
  opencode_agent: 'http://localhost:8001'
};

// 默认使用真实 API；需 opencode_agent 运行在 8001
const USE_MOCK_MODE = {
  data_platform: false,   // false = Data Search 调用真实 workflow
  opencode_agent: false   // false = Main Chat 调用真实 OpenCode Agent
};

// Agent descriptions
const AGENT_DESCRIPTIONS = {
  'default': 'Orchestrator: Routes tasks to specialized agents automatically',
  'excel': 'Excel Agent: Specialized in Excel file processing',
  'data': 'Data Agent: Queries business data and databases',
  'action': 'Action Agent: Sends emails and notifications',
  'plan': 'Plan Agent: Complex task planning and decomposition'
};

// Mock data for data_platform (used when HTTP API is not available)
const MOCK_WORKFLOW_RESPONSE = {
  status: 'completed',
  task_results: {
    fetch_sales_invoice: {
      sales_invoice_df: [
        { id: 1, date: '2025-01-20', product: 'Product A', quantity: 10, revenue: 1250.00 },
        { id: 2, date: '2025-01-20', product: 'Product B', quantity: 5, revenue: 875.00 },
        { id: 3, date: '2025-01-20', product: 'Product C', quantity: 8, revenue: 2100.00 }
      ],
      total_rows: 3
    },
    sql_task_0: {
      sql_query: 'SELECT date, product, SUM(quantity) as total_qty, SUM(revenue) as total_revenue FROM sales_invoice WHERE date = "2025-01-20" GROUP BY product',
      data: [
        { product: 'Product A', total_qty: 10, total_revenue: 1250.00 },
        { product: 'Product B', total_qty: 5, total_revenue: 875.00 },
        { product: 'Product C', total_qty: 8, total_revenue: 2100.00 }
      ],
      metrics: {
        total_revenue: 4225.00,
        total_quantity: 23,
        average_revenue: 183.70
      }
    }
  },
  completed_steps: ['preflight', 'plan_to_graph', 'run_manifest'],
  error: null
};

// Mock data for opencode_agent chat (used when HTTP API is not available)
const MOCK_CHAT_RESPONSES = {
  'hello 你是谁啊？': '你好！我是DataOrchestrator AI助手，可以帮助你查询数据、分析报表、上传文件等各种数据操作。',
  'default': '我已经收到了你的消息，正在处理中...'
};

class APIClient {
  constructor(backend) {
    if (!API_BASE_URL[backend]) {
      throw new Error(`Unknown backend: ${backend}`);
    }
    this.backend = backend;
    this.baseUrl = API_BASE_URL[backend];
  }

  getBaseUrl() {
    if (this.backend === 'opencode_agent' && typeof localStorage !== 'undefined') {
      const url = localStorage.getItem('opencodeAgentUrl');
      if (url) return url.replace(/\/$/, '');
    }
    if (this.backend === 'data_platform' && typeof localStorage !== 'undefined') {
      const url = localStorage.getItem('dataPlatformUrl');
      if (url) return url.replace(/\/$/, '') + '/api';
    }
    return this.baseUrl;
  }

  async request(endpoint, method = 'GET', body = null) {
    const base = this.getBaseUrl ? this.getBaseUrl() : this.baseUrl;
    const url = `${base}${endpoint}`;

    console.log(`[${this.backend}] ${method} ${url}`, body ? body : '');

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization if token exists
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const REQUEST_TIMEOUT_MS = 60000; // 60s 后超时，避免一直转圈
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[${this.backend}] Request timeout after ${REQUEST_TIMEOUT_MS / 1000}s`);
        throw new Error('请求超时，请检查后端是否运行（如 opencode_agent :8001）');
      }
      console.error(`[${this.backend}] Request failed:`, error);
      throw error;
    }
  }

  // === Authentication (MVP - free login) ===

  async login(email, password) {
    // MVP: Store token and return success
    const token = 'mock_token_' + Date.now();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email }));

    return {
      success: true,
      token: token,
      user: { email }
    };
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return {
      success: true
    };
  }

  // === data_platform APIs ===

  async runWorkflow(query, date, config = {}) {
    // Check if Mock mode is enabled
    if (USE_MOCK_MODE.data_platform) {
      console.log('[data_platform] Using Mock mode for workflow execution');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return mock data
      return {
        ...MOCK_WORKFLOW_RESPONSE,
        query,
        date
      };
    }

    // Use real HTTP API
    return this.request('/workflow/run', 'POST', {
      request: query,
      date: date,
      ...config
    });
  }

  // === opencode_agent APIs ===

  async chat(prompt, agent = 'default', sessionId = null) {
    // Check if Mock mode is enabled
    if (USE_MOCK_MODE.opencode_agent) {
      console.log('[opencode_agent] Using Mock mode for chat');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get mock response based on prompt
      const mockResponse = MOCK_CHAT_RESPONSES[prompt] || MOCK_CHAT_RESPONSES['default'];

      // Return mock response with empty tool_calls array
      return {
        message: mockResponse,
        response: mockResponse,
        tool_calls: []
      };
    }

    // Use real HTTP API
    return this.request('/session/chat', 'POST', {
      parts: [{ type: 'text', text: prompt }],
      agent,
      sessionId,
      no_reply: false
    });
  }

  async getSessions() {
    return this.request('/sessions');
  }

  async createSession(sessionData) {
    return this.request('/sessions', 'POST', sessionData);
  }

  async deleteSession(sessionId) {
    return this.request(`/sessions/${sessionId}`, 'DELETE');
  }

  // === Skills APIs ===

  async listSkills() {
    // Check if Mock mode is enabled
    if (USE_MOCK_MODE.opencode_agent) {
      console.log('[opencode_agent] Using Mock mode for skills list');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return mock skills data
      return {
        skills: [
          {
            "name": "excel-unstructured",
            "type": "function_based",
            "path": "skills/excel-unstructured",
            "description": "Excel 非结构化数据处理",
            "metadata": {
              "function_count": 4,
              "function_names": ["load_raw_data", "get_analysis_prompt", "parse_llm_response", "save_structured_data"]
            }
          },
          {
            "name": "test-e2e-minimal",
            "type": "function_based",
            "path": "skills/test-e2e-minimal",
            "description": "Minimal test skill for E2E",
            "metadata": {
              "function_count": 1,
              "function_names": ["echo"]
            }
          }
        ],
        "total": 2
      };
    }

    // Use real HTTP API
    return this.request('/skills', 'GET');
  }

  async executeSkill(skillName, userRequest, context = {}) {
    // Check if Mock mode is enabled
    if (USE_MOCK_MODE.opencode_agent) {
      console.log(`[opencode_agent] Using Mock mode for skill execution: ${skillName}`);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return mock response
      return {
        success: true,
        result: {
          message: `Mock execution of skill: ${skillName}`,
          output: "Mock output data"
        },
        plan: {
          skill_name: skillName,
          user_request: userRequest,
          context: context,
          steps: [
            {
              step_id: 1,
              action: "Mock step 1",
              function: "mock_function",
              args: {}
            }
          ]
        }
      };
    }

    // Use real HTTP API
    return this.request('/skills/execute', 'POST', {
      skill_name: skillName,
      user_request: userRequest,
      context: context
    });
  }

  /**
   * Upload a file to opencode_agent. Returns { filePath, fileName, fileSize, mimeType }.
   * filePath is e.g. "file:/C:/path/to/temp/file.pdf" for use as context.file_path in executeSkill.
   */
  async uploadFile(file) {
    const base = this.getBaseUrl ? this.getBaseUrl() : this.baseUrl;
    if (this.backend !== 'opencode_agent') {
      throw new Error('uploadFile is only supported for opencode_agent backend');
    }
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${base}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    return await response.json();
  }

  // ✅ 新增：获取 Session 文件列表
  async getSessionFiles(sessionId) {
    if (this.backend !== 'opencode_agent') {
      throw new Error('getSessionFiles is only supported for opencode_agent backend');
    }
    const base = this.getBaseUrl ? this.getBaseUrl() : this.baseUrl;
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${base}/sessions/${sessionId}/files`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get session files: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  // ✅ 新增：批量上传文件到 Session
  async uploadSessionFiles(sessionId, files) {
    const base = this.getBaseUrl ? this.getBaseUrl() : this.baseUrl;
    if (this.backend !== 'opencode_agent') {
      throw new Error('uploadSessionFiles is only supported for opencode_agent backend');
    }
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${base}/sessions/${sessionId}/files`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  // ✅ 新增：删除 Session 文件
  async deleteSessionFile(sessionId, fileId) {
    const base = this.getBaseUrl ? this.getBaseUrl() : this.baseUrl;
    if (this.backend !== 'opencode_agent') {
      throw new Error('deleteSessionFile is only supported for opencode_agent backend');
    }
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${base}/sessions/${sessionId}/files/${fileId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }


  // === Utility Methods ===

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }
}

// Export singleton instances
export const dataPlatformClient = new APIClient('data_platform');
export const opencodeAgentClient = new APIClient('opencode_agent');

// Export APIClient class to global scope for x-init usage
window.APIClient = APIClient;
