
import { Agent } from "https";
import { GigaChat } from "langchain-gigachat"
const { GigaChat: GigaChatClient } = require('gigachat');

const httpsAgent = new Agent({
    rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

export const llm = new GigaChat({
    credentials: process.env.GIGACHAT_API_KEY,
    model: 'GigaChat-2',
    httpsAgent,
});

export const gigachat = new GigaChatClient({
    scope: 'GIGACHAT_API_PERS',
    credentials: process.env.GIGA_AUTH,
    httpsAgent,
    model: 'GigaChat-2-Max',
})
