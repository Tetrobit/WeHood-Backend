import Gigachat, { detectImage } from 'gigachat'
import { Agent } from 'https';
import fs from 'fs';
import { uploadFile } from '../services/upload.service';

import { KandinskyAPI, AspectRatio } from "@brojs/kandinsky";
import { v4 as uuidv4 } from 'uuid';

const api = new KandinskyAPI({
    apiKey: process.env.API_KEY_FUSION_BRAIN,
    secretKey: process.env.SECRET_KEY_FUSION_BRAIN,
});
export async function generateImage(prompt: string) {
    const imageName = uuidv4();
    const params = {
        query: prompt,
        width: 256,
        height: 256,
    };

    try {
        const images = await api.generate(params);
        
        // Сохраняем изображение в файл
        if (images && images.length > 0) {
          const imageData = images[0].replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(imageData, 'base64');
          fs.writeFileSync(`uploads/${imageName}.jpg`, buffer);
        //   console.log(`Изображение сохранено в файл ${imageName}.jpg`);
          return imageName;
        }
      } catch (error) {
        console.error('Ошибка при генерации:', error);
        return null;
      }
}

// export async function generateImage(prompt: string) {
//     try {
//         const gigachat = new Gigachat({
//             credentials: process.env.GIGACHAT_API_KEY,
//             httpsAgent: new Agent({
//                 rejectUnauthorized: false,
//                 timeout: 30000,
//             }),
//             model: 'GigaChat-2',
//             timeout: 30,
//         });

//         const response = await gigachat.chat({
//             messages: [
//                 {
//                     role: 'system',
//                     content: 'Ты - Кандинский. Сгенерируй одну картинку по промпту пользователя.',
//                 },
//                 {
//                     role: 'user',
//                     content: prompt,
//                 },
//             ],
//             function_call: 'auto',
//             n: 1
//         });

//         const detectedImage = detectImage(response.choices[0]?.message.content ?? '');
//         const image = await gigachat.getImage(detectedImage!.uuid!);

//         fs.writeFileSync(`uploads/${detectedImage!.uuid!}.jpg`, image.content, 'binary');
//         return detectedImage!.uuid!;
//     } catch (error) {
//         return null;
//     }
// }

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
