import { http } from '@/utils/request';

// 用户相关接口
export const userApi = {
  login: (data) => http.post('/user/login', data),
  getUserInfo: () => http.get('/user/info')
};

// 病历质控相关接口
export const medicalRecordApi = {
  errorCheck: (data) => http.post('/medical-record/error-check', data),
  getSuggestions: (data) => http.post('/medical-record/suggestions', data)
};

// 其他模块接口
export const otherApi = {
  getList: (params) => http.get('/other/list', params),
  create: (data) => http.post('/other/create', data)
};
