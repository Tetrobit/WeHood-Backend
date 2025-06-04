import prompts from 'prompts';
import { generateGuaranteedImage } from "../src/agents/generate_image";

async function main() {
    const { prompt } = await prompts({
        type: 'text',
        name: 'prompt',
        message: 'Введите prompt',
    });

    const uuid = await generateGuaranteedImage(prompt);
    console.log(uuid);
}

main();