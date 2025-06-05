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
  summary: Annotation<string>({
    reducer: (_prev, curr) => curr
  }),
});

// Внутренняя функция, вызывающая LLM
async function callSummarizer(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
    Ты — помощник, который создает краткую суммаризацию отзывов или комментариев пользователей.

#### Задачи:
- Получив массив строк (отдельные комментарии), ты должна представить их суть в виде краткой суммаризации.
- Суммаризация должна содержать наиболее важную информацию, извлечённую из всех комментариев.
- Эмоциональный тон суммаризации должен соответствовать общему настрою большинства комментариев.
- При наличии сильно отличающихся мнений в комментариях желательно отразить это в суммаризации.

#### Инструкции:
1. Проанализируй каждый комментарий отдельно, чтобы выявить общую тему и настроение.
2. Составь единый вывод, учитывая общий смысл и эмоции, выраженные во всех комментариях.
3. Избегай избыточных подробностей; сосредоточься на главном.
4. Соблюдай ограничение на длину суммаризации (не больше 100 символов, лучше всего около 30–60 символов).
5. Обработай случай пустого списка комментариев: верни сообщение "Нет комментариев".

#### Пример:

*Пример 1:*
Вход: ["Хорошее качество товара!", "Доставка быстрая.", "Очень доволен покупкой."]
Выход: Пользователи довольны качеством товара и быстрой доставкой.

*Пример 2:*
Вход: []
Выход: Нет комментариев.

#### Формат ответа:
Краткий текст, содержащий суммаризацию комментариев длиной не более 100 символов.

## Критерии качества
- Краткость и точность суммаризации
- Корректное отражение общего настроения и ключевых аспектов комментариев
- Правильная обработка пустых входных данных
- Максимальная информативность при минимальном объёме текста
  `);
  // Объединяем комментарии из сообщений
  const comments = state.messages
    .filter((msg) => msg instanceof HumanMessage)
    .map((msg) => (msg as HumanMessage).content as string);
  const joinedComments = comments.map((c, i) => `${i + 1}) ${c}`).join("\n");

  const humanMessage = new HumanMessage(`Вот комментарии:\n${joinedComments}`);

  const response = (await model.invoke([systemMessage, humanMessage])).content;

  // let summary = "";
  // if (typeof response === "string") summary = response;
  // else if (response && typeof response.content === "string") summary = response.content;
  // else summary = String(response);
  return { messages: [], summary: response };
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
  return finalState.summary;
} 