// config.js

/**
 * 默认 API 配置
 * 当 localStorage 中没有找到用户自定义设置时，将使用此处的配置。
 */
const DEFAULT_API_CONFIG = {
    // 当前激活的 API 服务商, 'openai' 或 'gemini'
    provider: 'openai',

    // OpenAI 兼容 API 的设置
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
    },

    // Google Gemini API 的设置
    gemini: {
        // Gemini 的 Base URL 通常是固定的，但保留以便自定义
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
        apiKey: '',
        model: 'gemini-pro:generateContent', // 这是 Gemini Pro 的模型端点
        stream: false // Gemini API 的流式处理方式不同，此处暂时禁用
    }
};
