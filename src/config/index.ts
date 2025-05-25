import dotenv from 'dotenv';

dotenv.config();

export const config = {
    YANDEX_GEOCODER: process.env.YANDEX_GEOCODER || '',
    // ... другие конфигурационные параметры
}; 