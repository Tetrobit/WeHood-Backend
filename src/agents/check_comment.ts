import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
  toxicity_score: z.number({ description: "Toxicity score of the comment from 0 to 1" }),
  rewrite_message: z.string().optional(),
}));

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
    rewrite_message?: string,
  }>({
    reducer: (_prev, curr) => ({
      ok: curr.ok,
      reason: curr.reason,
      toxicity_score: curr.toxicity_score,
      rewrite_message: curr.rewrite_message,
    }),
  }),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
      You are a helpful assistant that checks if a comment is bad.
      You will be given a comment and you will need to check if it is bad.
      If it is bad, you will return ok false, reason and rewrite_message.
      If it is not bad, you will return ok true and reason.
      Reason should be a short description of why the comment is bad.
      Rewrite_message should be a rewrite of the comment with toxic score less than 0.2.
      Also write reason in russian.
      Also write rewrite_message in russian.
      Don't add any other text to your response and fields in json.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);

  // We return a list, because this will get added to the existing list
  return { messages: [], verdict: response };
}

const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)

  .addEdge(START, "agent")
  .addEdge("agent", END)

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function checkComment(comment: string): Promise<undefined | {
  ok?: boolean;
  reason?: string;
  toxicity_score?: number;
}> {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });

  return finalState.verdict;
}
