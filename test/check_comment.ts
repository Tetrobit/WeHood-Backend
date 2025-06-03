import prompts from "prompts";
import { checkComment } from "../src/agents/check_comment";

async function main() {
    // start("Что это за фигня, никогда больше таким не занимайтесь!")
    // start("Это было так красиво, что у меня пошли мурашки по коже")
    const { comment } = await prompts({
        type: "text",
        message: "Введите комментарий: ",
        name: "comment",
    });

    console.log(await checkComment(comment));
}

main();