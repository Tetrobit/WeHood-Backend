import dotenv from 'dotenv';

dotenv.config();

export const config = {
    YANDEX_GEOCODER: process.env.YANDEX_GEOCODER || '',
    YANDEX_LOCATOR: process.env.YANDEX_LOCATOR || '',
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
};
