
import { Agent } from "https";
import { GigaChat } from "langchain-gigachat"

const httpsAgent = new Agent({
    rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

export const llm = new GigaChat({
    credentials: process.env.GIGACHAT_API_KEY,
    model: 'GigaChat-2',
    httpsAgent,
});
