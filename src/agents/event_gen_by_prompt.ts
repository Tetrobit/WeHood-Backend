import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";

import { z } from "zod";
import { llm } from "./gigachat";

const model = llm.withStructuredOutput(z.object({
    name: z.string({ description: "Краткое название мероприятия. Не более 30 символов. Используйте только РУССКИЕ буквы. Пример: \"Премьера фильма\"."}),
    description_name: z.string({ description: "Описание мероприятия на русском языке. Не более 500 символов. Используйте только латинские буквы."}),
    img_prompt: z.string({ description: "Prompt for generation image for ${name} event. On English language" }),
  }));

// Define a new graph
const MyAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, curr) => [...prev, ...curr],
    default: () => [],
  }),
  verdict: Annotation<{
    name: string,
    description_name: string,
    img_prompt: string,
  }>({
    reducer: (_prev, curr) => ({
      name: curr.name,
      description_name: curr.description_name,
      img_prompt: curr.img_prompt,
    }),
  }),
});

// Define the function that calls the model
async function callModel(state: typeof MyAnnotation.State) {
  const systemMessage = new SystemMessage(`
      Ты помощник по созданию событийного контента. Ты принимаешь идею пользователя и преобразуешь её в структурированное событие. Задача состоит в том, чтобы доработать предложенную идею, сделав её логичной, конкретной и лаконичной.

    ### Роль модели
    Ты помогаешь пользователям создавать привлекательные и интересные события путем переработки их идей в хорошо оформленный контент.

    ### Инструкция
    1. Получив идею пользователя, проанализируй её на предмет полноты и ясности.
    2. При необходимости доработай идею, добавив недостающую информацию или улучшив формулировку.
    3. Создай краткое и запоминающееся название события длиной до 30 символов, используя только латинские буквы.
    4. Напиши емкое описание события объемом до 500 символов, также используя только латинский алфавит.
    5. Подготовь текстовый запрос для генерации изображения события, который будет использоваться для визуализации мероприятия.

    ### Формат ответа
    \`\`\`
    name: [Название события, на русском языке]
    description_name: [Описание события, на русском языке]
    img_prompt: [Текст запроса для генерации изображения, на английском языке]
    \`\`\`

    ### Примеры
    *Пример 1:*
    Идея пользователя: "Открытие нового ресторана итальянской кухни"
    Ответ:
    \`\`\`
    name: Открытие итальянской кухни
    description_name: Почувствуйте истинный вкус Италии! Торжественное открытие ресторана итальянской кухни, в котором подают аутентичные блюда от Сицилии до Тосканы. Лучший шеф-повар Италии готовит пасту ручной работы, пиццу на дровах и тирамису по оригинальным рецептам. Живая музыка, дегустация вин и скидки для первых посетителей!
    img_prompt: Elegant restaurant opening event at night. Warm lighting, rustic Italian decor with olive branches and Chianti bottles. Chef presenting steaming handmade pasta to smiling guests. Red-white-green color scheme. Photorealistic style, bokeh background.
    \`\`\`

    ### Примечания
    - Имя события должно быть легко произносимым и запоминающимся.
    - Описание должно привлекать внимание и вызывать интерес у потенциальных посетителей.
    - Текст запроса для изображения должен быть детальным, но коротким, чтобы облегчить создание визуала.

    ## Критерии качества
    - Четкость и точность названий и описаний.
    - Использование только латинского алфавита во всех полях.
    - Соблюдение лимитов по длине текста.
    - Конкретный и детализированный запрос для генерации изображений.
    - Привлекательность и оригинальность созданного контента.
  `);
  const response = await model.invoke([systemMessage, ...state.messages]);


  return { messages: [], verdict: response };
}

const workflow = new StateGraph(MyAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

const app = workflow.compile();

export async function eventGenByPrompt(comment: string): Promise<undefined | {
  name: string;
  description_name: string;
  img_prompt: string;
}> {
  const finalState = await app.invoke({
    messages: [new HumanMessage(comment)],
  });

  return finalState.verdict;
}

// Агент для генерации события по промпту. 
// Вход: string - промпт для генерации события
// Выход: название, описание, картинка (промпт для генерации)