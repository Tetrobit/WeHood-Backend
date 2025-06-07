import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
  shouldCreatePoll: z.boolean({ description: "Следует ли создать опрос" }),
  poll: z.object({
    title: z.string({ description: "Заголовок опроса, короткий, не более 20 символов" }),
    description: z.string({ description: "Описание опроса, не более 200 символов" }),
    options: z.array(z.string({ description: "Варианты ответа, не менее 2 вариантов и не более 10, и каждый не более 50 символов" })),
    image: z.string({ description: "Какая иллюстрация подходит к опросу? Опиши её в не более 200 символов" }),
  }),
}));



// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  shouldCreatePoll: Annotation<boolean>({
    reducer: (_prev, curr) => curr,
  }),
  poll: Annotation<{
    title: string,
    description: string,
    options: string[],
    image: string,
  }>({
    reducer: (_prev, curr) => curr,
  }),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
    Ты вежливый и доброжелательный агент, который создаёт опросы из комментариев.
    Есть ли у пользователей какая-то проблема, которую можно решить с помощью опроса?
    Если да, то создай опрос.
    Если нет, то не создавай опрос.
    Опрос должен быть создан на основе комментариев.
    Если комментариев мало, то не создавай опрос.
    Если комментариев много, то создай опрос.
    Вариантов ответа должно быть не менее 2 и не более 10.
    Опрос должен быть создан на основе комментариев.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);

  return { messages: [], shouldCreatePoll: response.shouldCreatePoll, poll: response.poll };
}


const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function commentToPoll(comments: string[]): Promise<undefined | {
  shouldCreatePoll?: boolean;
  poll?: {
    title: string;
    description: string;
    options: string[];
    image: string;
  };
}> {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comments.join("\n\n"))],
  });

  return {
    shouldCreatePoll: finalState.shouldCreatePoll,
    poll: finalState.poll,
  };
}
