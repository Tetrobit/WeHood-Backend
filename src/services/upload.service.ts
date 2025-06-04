import axios from 'axios';
import fs from 'fs';
import mime from 'mime';

export async function uploadFile(uri: string): Promise<null | {
    fileId: string;
    originalName: string;
    size: number;
    mimeType: string;
}> {
    const formData = new FormData();
    console.log(uri);
    const bytes = fs.readFileSync(uri);
    const mimeType = mime.lookup(uri);
    const blob = new Blob([bytes], { type: mimeType });
    formData.append('file', blob, uri.split('/').pop()!);
    const request_config = {
        method: "post",
        url: process.env.MEDIA_SERVER! + '/upload',
        headers: {
            "Content-Type": "multipart/form-data"
        },
        data: formData
    };

    try {
        const res = (await axios(request_config)).data;
        return res;
    } catch (error) {
        return null;
    }
}