import { HumanMessage, SystemMessage, BaseMessage, ChatMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";
import { v4 as uuidv4 } from 'uuid';

// @ts-ignore
const model = llm.withStructuredOutput(z.object({
    answer: z.string(),
    audio_support: z.string({ description: 'Что нужно ответить пользователю голосом. Укажи ответ в формате SSML разметки'})
}));

// @ts-ignore
const messageModel = llm;

// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  thread_id: Annotation<string>(),
  audio_support: Annotation<string>(),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
      Ты полезный ассистент. Ответь в формате JSON, в поле answer укажи ответ на вопрос пользователя
  `);
  const response = await model.invoke([systemMessage, ...state.messages], {
    configurable: {
        thread_id: state.thread_id,
    }
  });

  console.log(response);
  // We return a list, because this will get added to the existing list
  return { messages: [new ChatMessage(response.answer, 'assistant')], audio_support: response.audio_support };
}


const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

declare interface Message {
    content: string;
    role: string;
}

export async function search(messages: Message[], prompt: string, thread_id: string | undefined): Promise<{
    messages: Message[];
    response: any;
    audio_support: string;
}> {
    // Use the agent
    const finalState = await app.invoke({
        messages: [
            ...messages.map(msg => msg.role == 'human' ? new HumanMessage(msg.content) : new ChatMessage(msg.content, 'assistant')),
            new HumanMessage(prompt)],
        thread_id: thread_id ?? uuidv4(),
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
    };
}

// string -> Температура, влажность, скорость ветра (х5 суток) + текущая дата -> рекомендация, что надеть (текст)
// 