// config.js

/**
 * 默认 API 配置
 * 当 localStorage 中没有找到用户自定义设置时，将使用此处的配置。
 */
const DEFAULT_API_CONFIG = {
    // 当前使用的 API 服务商, 'openai' 或 'groq' 等
    provider: 'openai',

    // OpenAI 兼容 API 的设置
    openai: {
        // API 请求的基地址。
        // 用户可以修改这里以使用代理或任何兼容 OpenAI API 的服务。
        baseUrl: 'https://api.openai.com/v1',

        // API Key。这需要用户自己填写。
        apiKey: '',

        // 用于聊天补全的模型。
        model: 'gpt-3.5-turbo',

        // 控制输出的随机性。值越高，输出越随机。范围 0 到 2。
        temperature: 0.7,

        // 生成文本的最大 token 数量。
        max_tokens: 2048,
        
        // 是否使用流式传输。流式响应可以带来更好的用户体验。
        stream: true
    },

    // 未来可以为其他 API 服务商添加配置
    // groq: {
    //     baseUrl: 'https://api.groq.com/openai/v1',
    //     apiKey: '',
    //     model: 'llama3-8b-8192',
    //     temperature: 0.7,
    //     max_tokens: 2048,
    //     stream: true
    // }
};
