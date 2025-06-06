import prompts from "prompts";
import { eventGenByPrompt } from "../src/agents/event_gen_by_prompt";

async function main() {
    const { comment } = await prompts({
        type: "text",
        message: "Введите идею для создания события: ",
        name: "comment",
    });

    console.log(await eventGenByPrompt(comment));
}

main();