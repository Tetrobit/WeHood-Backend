import prompts from 'prompts';
import { generateImageAndUpload } from "../src/agents/generate_image";
import { uploadFile } from '../src/services/upload.service';
import fs from 'fs';

async function main() {
    const { prompt } = await prompts({
        type: 'text',
        name: 'prompt',
        message: 'Введите prompt',
    });

    const uri = await generateImageAndUpload(prompt);
    console.log(process.env.MEDIA_SERVER + '/files/' + uri!.fileId);
}

main();