import Gigachat, { detectImage } from 'gigachat'
import { Agent } from 'https';
import fs from 'fs';

export async function generateImage(prompt: string) {
    try {
        const gigachat = new Gigachat({
            credentials: process.env.GIGACHAT_API_KEY,
            httpsAgent: new Agent({
                rejectUnauthorized: false,
                timeout: 20000,
            }),
            model: 'GigaChat-2',
            timeout: 20,
        });

        const response = await gigachat.chat({
            messages: [
                {
                    role: 'system',
                    content: 'Сгенерируй одну картинку.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            function_call: 'auto',
            n: 1
        });

        const detectedImage = detectImage(response.choices[0]?.message.content ?? '');
        const image = await gigachat.getImage(detectedImage!.uuid!);

        fs.writeFileSync(`uploads/${detectedImage!.uuid!}.jpg`, image.content, 'binary');
        return detectedImage!.uuid!;
    } catch (error) {
        return null;
    }
}

export async function generateGuaranteedImage(prompt: string) {
    for (let i = 0; i < 3; i++) {
        try {
            const uuid = await generateImage(prompt);
            if (uuid) {
                return uuid;
            }
        } catch (error) {
            // ignore
        }
    }

    return null;
}
