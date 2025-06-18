import prompts from "prompts";
import { search } from "../src/agents/search";

async function main() {
    // start("Что это за фигня, никогда больше таким не занимайтесь!")
    // start("Это было так красиво, что у меня пошли мурашки по коже")
    const { text } = await prompts({
        type: "text",
        message: "Введите запрос: ",
        name: "text",
    });

    console.log(await search([], text, undefined, {
        geolocation: '',
        name: '',
        theme: '',
        weather: '',
    }));
}

main();