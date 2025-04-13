export const getMedicalServiceUrl = () => {
    // 获取当前域名/IP
    const hostname = window.location.hostname;
    // 获取协议(http/https)
    const protocol = window.location.protocol;
    // 医疗服务固定端口
    const MEDICAL_PORT = '12139';
    
    return `${protocol}//${hostname}:${MEDICAL_PORT}`;
};

// 导出具体的路由路径
export const MEDICAL_ROUTES = {
    RECORD_CONTROL: '/medical-record',
    RECORD_GENERATOR: '/pre-consultation'
} as const;