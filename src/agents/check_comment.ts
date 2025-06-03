import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

import { z } from "zod";
import { Agent } from 'node:https';
import { GigaChat } from "langchain-gigachat"

const httpsAgent = new Agent({
    rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

const llm = new GigaChat({
    credentials: process.env.GIGACHAT_API_KEY,
    model: 'GigaChat-2',
    httpsAgent
})

// Define the tools for the agent to use
const tools: any[] = [];
const toolNode = new ToolNode(tools);

const agent = createReactAgent({
  llm,
  tools,
  responseFormat: {
    prompt: `
      You are a helpful assistant that checks if a comment is bad.
      You will be given a comment and you will need to check if it is bad.
      If it is bad, you will return is_bad true and reason.
      If it is not bad, you will return is_bad false and reason.
      Reason should be a short description of why the comment is bad.
      Also write reason in russian.
      Don't add any other text to your response and fields in json.
    `,
    schema: z.object({
      is_bad: z.boolean(),
      reason: z.string(),
    }),
    type: "json_object",
  },
})

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
  const response = await agent.invoke({
    messages: [...state.messages],
  });

  console.log(response.messages[response.messages.length - 1]);
  console.log("Structured response: ", response.structuredResponse);
  // We return a list, because this will get added to the existing list
  return { messages: response.messages };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function checkComment(comment: string) {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });
  return finalState.messages[finalState.messages.length - 1].content;
}
