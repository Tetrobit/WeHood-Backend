import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
  recomendation: z.string(),
}));

// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  verdict: Annotation<{
    recomendation: string,
  }>({
    reducer: (_prev, curr) => ({
      recomendation: curr.recomendation,
    }),
  }),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
      You are a helpful assistant that help with choosing clothes in the weather.
      You will be provided with text in string format, and you will need to determine what is worth taking with you or wearing.
      The temperature is transmitted in kelvins, use Celsius when making recommendations.
      Return only the text with the recommendation of what you should take with you or wear.
      Напиши, что надеть, что не надеть, что взять с собой, что не брать с собой.
      Если указан город, напиши в таком то городе надо надеть ... и не надеть ... чтобы пользователь чувствовал себя комфортно.
      Не указывай температуру, влажность, скорость ветра, пользователь это уже знает.
      The returned text must be in Russian.
      Don't add any other text to your response and fields in json.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);
  // console.log(response)                // Возвращает действие, совершённое первой моделью (model == агент в определённой сфере)
  // console.log(`Это состояине:`, state) 

  // We return a list, because this will get added to the existing list
  return { messages: [], verdict: response };
}


const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

export async function WeatherRec(comment: string): Promise<{
  recomendation: string;
}> {
  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });

  return finalState.verdict;
}

// string -> Температура, влажность, скорость ветра (х5 суток) + текущая дата -> рекомендация, что надеть (текст)
// 