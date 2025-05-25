import axios from 'axios';
import { config } from '../config';

export class GeocodingService {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://geocode-maps.yandex.ru/1.x/';

    constructor() {
        this.apiKey = config.YANDEX_GEOCODER;
    }

    async forwardGeocode(address: string) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    apikey: this.apiKey,
                    geocode: address,
                    format: 'json'
                }
            });

            const featureMember = response.data.response.GeoObjectCollection.featureMember;
            if (featureMember.length === 0) {
                throw new Error('Адрес не найден');
            }

            const geoObject = featureMember[0].GeoObject;
            const [longitude, latitude] = geoObject.Point.pos.split(' ');

            return {
                address: geoObject.metaDataProperty.GeocoderMetaData.text,
                coordinates: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                }
            };
        } catch (error) {
            throw new Error('Ошибка при геокодировании адреса');
        }
    }

    async reverseGeocode(latitude: number, longitude: number) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    apikey: this.apiKey,
                    geocode: `${longitude},${latitude}`,
                    format: 'json'
                }
            });

            const featureMember = response.data.response.GeoObjectCollection.featureMember;
            if (featureMember.length === 0) {
                throw new Error('Координаты не найдены');
            }

            const geoObject = featureMember[0].GeoObject;
            return { data: response.data };
            return {
                address: geoObject.metaDataProperty.GeocoderMetaData.text,
                coordinates: {
                    latitude,
                    longitude
                }
            };
        } catch (error) {
            throw new Error('Ошибка при обратном геокодировании');
        }
    }
} 