[file: config.js]
/**
 * AI Chat 应用的默认配置
 * 存放 API 相关的预设值
 */

const defaultApiConfig = {
    // 默认选中的预设
    defaultPreset: 'OpenAI',

    // 预设列表
    presets: {
        "OpenAI": {
            apiKey: "", // 用户需要自己填写
            apiUrl: "https://api.openai.com/v1/chat/completions",
            model: "gpt-3.5-turbo"
        },
        "Groq": {
            apiKey: "",
            apiUrl: "https://api.groq.com/openai/v1/chat/completions",
            model: "llama3-8b-8192"
        },
        "Custom": {
            apiKey: "",
            apiUrl: "", // 例如 http://localhost:1234/v1/chat/completions
            model: ""
        }
    }
};