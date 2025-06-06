import prompts from "prompts";
import { commentToPoll } from "../src/agents/comment_to_poll";

async function main() {
    const comments = [
        "Давно говорю, что нужно убрать эту балку с дороги",
        "Эта балка всем мешает, особенно пешеходам",
        "Этот пешеходный переход не работает, потому что тут стоит балка",
    ];

    console.log(await commentToPoll(comments));
}

main();