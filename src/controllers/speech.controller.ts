import { Request, Response } from 'express';
import { Agent } from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import { lookup } from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
// @ts-ignore
import FileReader from 'filereader';
import { uploadFile } from '@/services/upload.service';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const httpsAgent = new Agent({
    rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

async function getToken(): Promise<string> {
    // Получение токена
    const response = await axios('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
        method: 'post',
        headers: {
            'RqUID': '6f0b1291-c7f3-43c6-bb2e-9f3efb2dc98e',
            'Content-Type': 'application/x-www-form-urlencoded', 
            'Accept': 'application/json',
            'Authorization': 'Bearer ZTMyOGE2YzUtYzZlOS00ZGQ0LTk1ZWItOTEwMWY4OTlhODRiOmIzMTYzMmNjLWJiMzMtNDQ5Yi1iMDJhLWNjYjU3NDk5ODMyZQ=='
        },
        data: {
            scope: 'SALUTE_SPEECH_PERS'
        },
        httpsAgent
    })
    return response.data.access_token;
}

function convertToMpeg(uri: string): Promise<string> {
    const path = `uploads/${uuidv4()}.m2a`;
    return new Promise((resolve, reject) => {
        try {
            // @ts-ignore
            new ffmpeg({ source: uri, nolog: true })
                .saveToFile(path)
                .on('end', function() {
                    resolve(path);
                })
        }
        catch (e) {
            reject(e);
        }
    })
}

async function textToSpeech(text: string): Promise<string> {
    const token = await getToken();

    let config: AxiosRequestConfig<string> = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://smartspeech.sber.ru/rest/v1/text:synthesize',
        headers: { 
            'Content-Type': 'application/text', 
            'Accept': 'audio/x-wav', 
            'Authorization': `Bearer ${token}`
        },
        data: text,
        httpsAgent,
        responseType: 'arraybuffer'
    };

    const response = await axios.request(config);
    const path = `uploads/${uuidv4()}.wav`;
    await fs.promises.writeFile(path, Buffer.from(response.data));
    
    const uploadResponse = await uploadFile(path);;
    return uploadResponse!.fileId;
}

export class SpeechController {
    async recognize(req: Request, res: Response) {
        try {
            const token = await getToken();

            const path = await convertToMpeg(req.file?.path!)

            const bytes = fs.readFileSync(path);
            const mimeType = lookup(path) || 'audio/mpeg';
            const blob = new Blob([bytes], { type: mimeType });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://smartspeech.sber.ru/rest/v1/speech:recognize',
                headers: { 
                    'Content-Type': 'audio/mpeg', 
                    'Accept': 'application/json', 
                    'Authorization': `Bearer ${token}`
                },
                data: blob,
                httpsAgent,
            };

            const response = await axios.request(config);
            console.log(response.data);
            
            return res.status(200).json(response.data);
        } catch (error) {
            console.error('Ошибка при распознавании', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }

    async synthesize(req: Request, res: Response) {
        try {
            const uuid = await textToSpeech(req.body.text);
            const result = {
                uuid,
            };

            return res.status(200).json(result);
        } catch (error) {
            console.error('Ошибка при синтезе речи', error);
            return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
} 