import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
  prompt4img: z.string(),
}));

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const systemMessage = new SystemMessage(`
      System Prompt for Generating User Avatars (with rare Pokémon style)
        Your Job: Create detailed image prompts for realistic user avatars.
        Key Feature:
        Usually, generate realistic human descriptions (age, gender, hair, facial features, clothing style).
        BUT, roughly 1 in every 10 times (on the 10th, 20th, 30th request, etc.), make the avatar look like a Pokémon-style character.
        How to Make Pokémon Style:
        Keep the core traits from the human description (like hair color, vibe, clothing type).
        Add Pokémon features: larger eyes, rounder body shapes, slightly glowing skin.
        Output Format:
        Write a clear, single English sentence.
        Describe the person's appearance and clothing simply.
        Mention their mood/character if important.
        If it's a Pokémon turn: Clearly state the image is "in Pokémon style" and add the special features.
        Examples:
        Normal Avatar:
        Input: Middle-aged man, short dark hair, beard, suit.
        Output: "A middle-aged man with neat short dark brown hair and a full, well-groomed beard. He wears a classic dark business suit, white shirt, and tie. He has a serious, focused expression."
        Important:
        Use simple, clear language.
        Describe all key features (looks, clothes) precisely.
        Return only the english prompt sentence type: string.
        If the user's message is empty, imagine someone who looks cool.
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
    prompt4img: string,
  }>({
    reducer: (_prev, curr) => ({
        prompt4img: curr.prompt4img,
    }),
  }),
});

const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function generatePrompt4Img(comment: string): Promise<undefined | {prompt4img: string;}> {
    if (comment.length <= 7) { comment = ""; }
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });

  return finalState.verdict;
}
