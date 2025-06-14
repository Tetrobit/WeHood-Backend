import axios from 'axios';
import fs from 'fs';
import { lookup } from 'mime-types';

export async function uploadFile(uri: string): Promise<null | {
    fileId: string;
    originalName: string;
    size: number;
    mimeType: string;
}> {
    const formData = new FormData();
    const bytes = fs.readFileSync(uri);
    const mimeType = lookup(uri) || 'application/octet-stream';
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

export function getFileUrl(fileId: string): string {
    return process.env.MEDIA_SERVER! + '/files/' + fileId;
}
