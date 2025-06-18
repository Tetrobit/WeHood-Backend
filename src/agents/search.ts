import { HumanMessage, SystemMessage, BaseMessage, AIMessage, FunctionMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";
import { v4 as uuidv4 } from 'uuid';
import { tool } from "@langchain/core/tools";

// const modelSchema = z.object({
//     answer: z.string(),
//     audio_support: z.string({ description: 'Что нужно ответить пользователю голосом. Укажи ответ в формате SSML разметки'})
// });

// <<< Tool theme get
const themeGetSchema = z.object({});

const calculatorTool = tool(({} : z.infer<typeof themeGetSchema>) => {
    
}, {
    name: 'theme_get',
    description: 'Получает тему приложения (цветовую схему)',
    schema: themeGetSchema,
});
// >>> Tool theme get

// <<< Tool theme set
const themeSetSchema = z.object({
    theme: z.enum(['light', 'dark']).describe('light - светлая, dark - тёмная темы'),
});

const themeTool = tool(({} : z.infer<typeof themeSetSchema>) => {

}, {
    name: 'theme_set',
    description: 'Может изменять тему приложения (цветовую схему)',
    schema: themeSetSchema,
});
// >>> Tool theme set

const baseModel = llm.bindTools([calculatorTool, themeTool]);

// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  thread_id: Annotation<string>(),
  audio_support: Annotation<string>(),
  commands: Annotation<object[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  user_context: Annotation<UserContext>(),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
      Ты полезный ассистент. Отвечай только на последний запрос пользователя.
      Предыдущие сообщения нужны лишь для поддержки контекста, вдруг что вспомнитью
       Анализируй запрос пользователя, придумай ответ и сделай, что он хочет из тех инструментов, которые у тебя есть.
  `);
  const response = await baseModel.invoke([systemMessage, ...state.messages]);
  return { messages: [response], audio_support: 'Привет!' };
}

async function shouldContinue(state: typeof MyAnnotation.State) {
    const aiResponse: AIMessage = state.messages.at(-1)!;

    if (!aiResponse.tool_calls || !aiResponse.tool_calls.length) {
        return "audio";
    }
    
    return "tool";
}

async function callTool(state: typeof MyAnnotation.State) {
    const aiResponse: AIMessage = state.messages.at(-1)!;
    const tool_call = aiResponse.tool_calls![0];

    if (tool_call.name == 'theme_get') {
        return { messages: [new FunctionMessage(`У пользователя установлена тема ${state.user_context.theme}`, "theme_get")] };
    }
    else if (tool_call.name == 'theme_set') {
        return {
            messages: [new FunctionMessage("Тема успешно обновлена!", "theme_set")],
            commands: [{ name: 'theme_set', theme: tool_call.args.theme }]
        };
    }

    return {};
}

async function audioRespond(state: typeof MyAnnotation.State) {
    const systemMessage = new SystemMessage(
        `Ответь пользователю на его последний запрос как будто ты человек, которому его задали.
        Если ты что-то сделал, то сообщи об этом, чтобы пользователь понимал, что произошло или происходит`
    )
    const response = await llm.invoke([systemMessage, ...state.messages]);
    console.log(response);
    return { audio_support: response.content };
}

const workflow = new StateGraph(MyAnnotation)
    .addNode("agent", callModel)
    .addNode("tool", callTool)
    .addNode("audio", audioRespond)
    .addEdge("__start__", "agent")
    .addConditionalEdges('agent', shouldContinue, {
        "tool": "tool",
        "audio": "audio",
    })
    .addEdge("tool", "agent")
    .addEdge("audio", "__end__");

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

declare interface Message {
    content: string;
    role: string;
}

export declare interface UserContext {
    weather: string;
    geolocation: string;
    theme: string;
    name: string;
}

export async function search(messages: Message[], prompt: string, thread_id: string | undefined, context: UserContext): Promise<{
    messages: Message[];
    response: any;
    audio_support: string;
    commands: object[];
}> {
    // Use the agent
    const finalState = await app.invoke({
        messages: [
            ...messages.map(msg => msg.role == 'human' ? new HumanMessage(msg.content) : new AIMessage(msg.content)),
            new HumanMessage(prompt)],
        thread_id: thread_id ?? uuidv4(),
        user_context: context,
    });

    return {
        messages: finalState.messages.map(msg => ({
            content: msg.content as string,
            role: msg instanceof HumanMessage ? 'human' : 'assistent'
        })),
        response: {
            content: finalState.messages[finalState.messages.length - 1].content
        },
        audio_support: finalState.audio_support,
        commands: finalState.commands
    };
}

// string -> Температура, влажность, скорость ветра (х5 суток) + текущая дата -> рекомендация, что надеть (текст)
// 