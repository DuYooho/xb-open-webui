import axios from 'axios';
import {ElLoading, ElMessage} from 'element-plus';
import {useUserStore} from '@/stores/user';
import {isDev} from '@/utils/env';
import {useRouter} from 'vue-router';
import { apiConfig } from '@/config';

// 移除顶层的 store 和 router 实例化
const axiosInstance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: apiConfig.headers
});

// 请求计数器
let requestCount = 0;
let loadingInstance = null;

// 启动 loading
const startLoading = () => {
    if (requestCount === 0) {
        loadingInstance = ElLoading.service({
            background: 'rgba(0, 0, 0, 0.7)',
            text: '加载中...',
        });
    }
    requestCount++;
};

// 结束 loading
const endLoading = () => {
    requestCount--;
    if (requestCount === 0 && loadingInstance) {
        loadingInstance.close();
    }
};

// 请求日志
const logRequest = (config) => {
    if (isDev()) {
        console.group('🚀 请求日志');
        console.log('请求地址:', config.url);
        console.log('请求方法:', config.method);
        console.log('请求参数:', config.params || config.data);
        console.groupEnd();
    }
};

// 响应日志
const logResponse = (response) => {
    if (isDev()) {
        console.group('🎉 响应日志');
        console.log('响应数据:', response);
        console.groupEnd();
    }
};

// 请求拦截器
axiosInstance.interceptors.request.use(
    (config) => {
        // 在拦截器内部获取 store
        const userStore = useUserStore();
        const token = userStore?.token;
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        config.headers['timestamp'] = Date.now();
        startLoading();
        logRequest(config);
        return config;
    },
    (error) => {
        endLoading();
        console.error('请求拦截器错误:', error);
        ElMessage.error('请求失败，请稍后再试');
        return Promise.reject(error);
    }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
    (response) => {
        logResponse(response);
        endLoading();
        if (response.status === 200 && response.data && response.data.success) {
            return response.data.data;
        } else {
            ElMessage.error(response.data?.message || '请求失败');
            return Promise.reject(response.data?.message || '请求失败');
        }
    },
    (error) => {
        const router = useRouter();
        endLoading();
        
        // 处理 401 未授权错误
        if (error.response?.status === 401) {
            ElMessage.error('未授权，请重新登录');
            router.push('/login');
        }
        
        return Promise.reject(error);
    }
);

// 取消重复请求
const pendingRequests = new Map();

const CancelToken = axios.CancelToken;
const cancelRequest = (config) => {
    const {url, method, headers} = config;
    const timestamp = headers['timestamp'];
    const key = `${url}_${method}_${timestamp}`;

    if (pendingRequests.has(key)) {
        pendingRequests.get(key).cancel('重复请求被取消');
        pendingRequests.delete(key);
    }

    const cancel = axios.CancelToken.source();
    pendingRequests.set(key, {cancel});

    return cancel.token;
};

// 请求重试机制
const retryCount = 3; // 最大重试次数
const retryDelay = 1000; // 重试间隔时间（毫秒）

const retry = (config, error) => {
    const {status} = error.response || {};
    const retryCountKey = `retryCount_${config.url}`;

    if (status === 500 && config[retryCountKey] < retryCount) {
        config[retryCountKey] = config[retryCountKey] + 1 || 1;
        ElMessage.warning(`正在重试第 ${config[retryCountKey]} 次...`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(request(config));
            }, retryDelay);
        });
    }

    return Promise.reject(error);
};

// 导出 http 工具对象
export const http = {
    get: (url, params = {}, config = {}) => {
        return axiosInstance.get(url, {
            params, 
            ...config, 
            cancelToken: cancelRequest({url, method: 'get', params})
        });
    },
    post: (url, data = {}, config = {}) => {
        return axiosInstance.post(url, data, {
            ...config, 
            cancelToken: cancelRequest({url, method: 'post', data})
        });
    },
    put: (url, data = {}, config = {}) => {
        return axiosInstance.put(url, data, {
            ...config, 
            cancelToken: cancelRequest({url, method: 'put', data})
        });
    },
    delete: (url, config = {}) => {
        return axiosInstance.delete(url, {
            ...config, 
            cancelToken: cancelRequest({url, method: 'delete'})
        });
    },
    upload: (url, data, config = {}) => {
        const loading = ElLoading.service({background: 'rgba(0, 0, 0, 0.7)'});
        return axiosInstance.post(url, data, {
            ...config,
            headers: {'Content-Type': 'multipart/form-data'},
        }).finally(() => {
            loading.close();
        });
    },
    download: (url, params = {}, config = {}) => {
        return axiosInstance.get(url, {
            params, 
            responseType: 'blob', 
            ...config
        });
    }
};

// 导出 axios 实例
export const request = axiosInstance;