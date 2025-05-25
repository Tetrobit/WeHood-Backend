import axios from 'axios';
import { config } from '../config';

export class GeocodingService {
    private readonly geocoderKey: string;
    private readonly locatorKey: string;
    private readonly geocoderUrl = 'https://geocode-maps.yandex.ru/1.x/';
    private readonly locatorUrl = 'https://locator.api.maps.yandex.ru/v1/locate';

    constructor() {
        this.geocoderKey = config.YANDEX_GEOCODER;
        this.locatorKey = config.YANDEX_LOCATOR;
    }

    async forwardGeocode(address: string) {
        try {
            const response = await axios.get(this.geocoderUrl, {
                params: {
                    apikey: this.geocoderKey,
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
            const response = await axios.get(this.geocoderUrl, {
                params: {
                    apikey: this.geocoderKey,
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

    async getLocationByIp(ip: string) {
        try {
            const response = await axios.post(`${this.locatorUrl}?apikey=${this.locatorKey}`, {
                "ip": [
                    {
                        "address": ip
                    }
                ]
            });

            if (!response.data || !response.data.location) {
                throw new Error('Местоположение не найдено');
            }

            const { point } = response.data.location;
            return {
                latitude: point.lat,
                longitude: point.lon
            };
        } catch (error) {
            console.log(error);
            throw new Error('Ошибка при определении местоположения по IP');
        }
    }
} 