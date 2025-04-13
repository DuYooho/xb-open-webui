// API 配置
export const apiConfig = {
  // 使用 import.meta.env 替代 process.env
  baseURL: import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_BASE_URL,
  
  timeout: 100000,
  
  headers: {
    'Content-Type': 'application/json'
  },

  // 响应码配置
  responseCode: {
    success: 200,           // 成功
    unauthorized: 401,      // 未授权
    forbidden: 403,        // 禁止访问
    notFound: 404,         // 未找到
    serverError: 500       // 服务器错误
  },

  // 错误消息
  errorMessages: {
    timeout: '请求超时',
    networkError: '网络错误',
    default: '请求失败'
  }
};

// API 路径配置
export const apiUrls = {
  user: {
    login: '/user/login',
    info: '/user/info',
    logout: '/user/logout'
  },
  medical: {
    errorCheck: '/medical-record/error-check',
    suggestions: '/medical-record/suggestions'
  },
  other: {
    list: '/other/list',
    create: '/other/create',
    update: '/other/update',
    delete: '/other/delete'
  }
};