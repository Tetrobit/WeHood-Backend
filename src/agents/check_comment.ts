import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { Agent } from 'node:https';
import { GigaChat } from "langchain-gigachat"

const httpsAgent = new Agent({
    rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

const llm = new GigaChat({
    credentials: process.env.GIGACHAT_API_KEY,
    model: 'GigaChat-2',
    httpsAgent,
});

// Define the tools for the agent to use
const tools: any[] = [];
const toolNode = new ToolNode(tools);
const model = llm.withStructuredOutput(z.object({
  is_bad: z.boolean(),
  reason: z.string().optional(),
}));

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const systemMessage = new SystemMessage(`
      You are a helpful assistant that checks if a comment is bad.
      You will be given a comment and you will need to check if it is bad.
      If it is bad, you will return is_bad true and reason.
      If it is not bad, you will return is_bad false and reason.
      Reason should be a short description of why the comment is bad.
      Also write reason in russian.
      Don't add any other text to your response and fields in json.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);
  // Хороший рецепт приготовления. Мне понравилось :)
  console.log(response);
  // We return a list, because this will get added to the existing list
  return { messages: [], verdict: response };
}

// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  verdict: Annotation<{
    is_bad: boolean,
    reason?: string,
  }>({
    reducer: (_prev, curr) => ({
      is_bad: curr.is_bad,
      reason: curr.reason,
    }),
  }),
});

const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function checkComment(comment: string): Promise<{
  is_bad: boolean;
  reason?: string;
}> {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });
  console.log(finalState);
  return finalState.verdict;
}
