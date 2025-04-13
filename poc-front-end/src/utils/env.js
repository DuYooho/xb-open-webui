// 获取当前环境变量
const isDev = () => {
    return import.meta.env.MODE === 'development';
};

const isProd = () => {
    return import.meta.env.MODE === 'production';
};

export { isDev, isProd };