import Gigachat, { detectImage } from 'gigachat'
import { Agent } from 'https';
import fs from 'fs';
import { uploadFile } from '../services/upload.service';

export async function generateImage(prompt: string) {
    try {
        const gigachat = new Gigachat({
            credentials: process.env.GIGACHAT_API_KEY,
            httpsAgent: new Agent({
                rejectUnauthorized: false,
                timeout: 30000,
            }),
            model: 'GigaChat-2',
            timeout: 30,
        });

        const response = await gigachat.chat({
            messages: [
                {
                    role: 'system',
                    content: 'Ты - Кандинский. Сгенерируй одну картинку по промпту пользователя.',
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

export async function generateImageAndUpload(prompt: string) {
    const uuid = await generateGuaranteedImage(prompt);
    if (!uuid) {
        return null;
    }

    const uri = await uploadFile(`uploads/${uuid}.jpg`);
    return uri;
}
