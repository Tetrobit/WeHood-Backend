import GigaChat from "gigachat";
import { Agent } from 'node:https';
// import { GigaChat } from "langchain-gigachat";

const httpsAgent = new Agent ({
    rejectUnauthorized: false,
});

const gigachat = new GigaChat({
    model: 'GigaChat-2',
    credentials: process.env.GIGA_AUTH,
    httpsAgent,
})

export default gigachat;
export { httpsAgent };
