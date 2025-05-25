import dotenv from 'dotenv';

dotenv.config();

export const config = {
    YANDEX_GEOCODER: process.env.YANDEX_GEOCODER || '',
    YANDEX_LOCATOR: process.env.YANDEX_LOCATOR || '',
    // ... другие конфигурационные параметры
}; 