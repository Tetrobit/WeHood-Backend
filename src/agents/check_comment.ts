import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
  toxicity_score: z.number({ description: "Toxicity score of the comment from 0 to 1" }),
}));

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const systemMessage = new SystemMessage(`
      You are a helpful assistant that checks if a comment is bad.
      You will be given a comment and you will need to check if it is bad.
      If it is bad, you will return ok false and reason.
      If it is not bad, you will return ok true and reason.
      Reason should be a short description of why the comment is bad.
      Also write reason in russian.
      Don't add any other text to your response and fields in json.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);

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
    ok: boolean,
    reason?: string,
    toxicity_score: number,
  }>({
    reducer: (_prev, curr) => ({
      ok: curr.ok,
      reason: curr.reason,
      toxicity_score: curr.toxicity_score,
    }),
  }),
});

const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function checkComment(comment: string): Promise<{
  ok: boolean;
  reason?: string;
  toxicity_score: number;
}> {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });

  return finalState.verdict;
}
