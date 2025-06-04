import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { llm } from "./gigachat";

// Модель для суммаризации
const model = llm;

// Аннотация состояния
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  summary: Annotation<{
    summary: string,
  }>({
    reducer: (_prev, curr) => ({
      summary: curr.summary,
    }),
  }),
});

// Внутренняя функция, вызывающая LLM
async function callSummarizer(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
    Ты — помощник, который суммирует отзывы или комментарии пользователей.
    На вход ты получаешь массив строк (каждая строка — отдельный комментарий).
    Твоя задача — сделать краткую, информативную суммаризацию всех комментариев.
    Ответь на русском языке. Не добавляй ничего лишнего: не добавляй комментарии, оставь только итоговую суммаризацию.
    Объём возвращаемого текста не должен превышать 100 символов. В идеале - 30-60 символов.
  `);
  // Объединяем комментарии из сообщений
  const comments = state.messages
    .filter((msg) => msg instanceof HumanMessage)
    .map((msg) => (msg as HumanMessage).content as string);
  const joinedComments = comments.map((c, i) => `${i + 1}) ${c}`).join("\n");
  const humanMessage = new HumanMessage(`Вот комментарии:\n${joinedComments}`);
  const response = await model.invoke([systemMessage, humanMessage]);
  let summary = "";
  if (typeof response === "string") summary = response;
  else if (response && typeof response.content === "string") summary = response.content;
  else summary = String(response);
  return { messages: [], summary: { summary } };
}

const workflow = new StateGraph(MyAnnotation)
  .addNode("summarizer", callSummarizer)
  .addEdge("__start__", "summarizer")
  .addEdge("summarizer", "__end__");

const app = workflow.compile();

export async function summarizeComments(comments: string[]): Promise<string> {
  // Каждый комментарий — отдельное сообщение
  const messages = comments.map((c) => new HumanMessage(c));
  const finalState = await app.invoke({ messages });
  return finalState.summary.summary;
} 