import prompts from "prompts";
import { summarizeComments } from "../src/agents/summ_comments";

async function main() {
    // const { comment } = await prompts({
    //     type: "text",
    //     message: "Введите запрос на генерацию: ",
    //     name: "comment",
    // });

    const comment: string[] = [
        "Отличная работа!",
        "Спасибо за полезную информацию.",
        "Очень интересный подход.",
        "Можно подробнее о третьем пункте?",
        "Пригодится в моём проекте.",
        "Есть вопросы по реализации.",
        "Жду продолжения!",
        "Лучшее объяснение из всех, что я видел."
    ];

    console.log(await summarizeComments(comment));
}

main();