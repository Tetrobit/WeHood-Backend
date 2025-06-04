import Gigachat, { detectImage } from 'gigachat'
import { Agent } from 'https';
import fs from 'fs';

export async function generateImage(prompt: string) {
    try {
        const gigachat = new Gigachat({
            credentials: process.env.GIGACHAT_API_KEY,
            httpsAgent: new Agent({
                rejectUnauthorized: false,
                timeout: 100000,
            }),
            model: 'GigaChat-2',
            timeout: 100000,
        });
        console.log(await gigachat.balance());
        const response = await gigachat.chat({
            messages: [
                {
                    role: 'system',
                    content: 'Сгенерируй одну картинку. Не генерируй много картинок. Не генерируй текст, только одну картинку.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            function_call: 'auto',
            n: 1,
            profanity_check: false
        });
        console.dir(response, { depth: null });

        const detectedImage = detectImage(response.choices[0]?.message.content ?? '');
        const image = await gigachat.getImage(detectedImage!.uuid!);

        fs.writeFileSync(`uploads/${detectedImage!.uuid!}.jpg`, image.content, 'binary');
        return detectedImage!.uuid!;
    } catch (error) {
        console.log(error);
        return null;
    }
}
