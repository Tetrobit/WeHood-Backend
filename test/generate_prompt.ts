import prompts from 'prompts'
import { generatePrompt4Img } from "../src/agents/generate_prompt"

async function main() {
    const { prompt } = await prompts({
        type: 'text',
        name: 'prompt',
        message: 'Введите что-нибудь для получения промпта',
    });

    console.log(await generatePrompt4Img(prompt));
}

main();