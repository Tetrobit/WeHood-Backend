import axios from 'axios';
import { config } from '../config';

export interface WeatherForecast {
    dt: number;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
    }>;
    clouds: {
        all: number;
    };
    wind: {
        speed: number;
        deg: number;
        gust: number;
    };
    visibility: number;
    pop: number;
    dt_txt: string;
}

export interface WeatherResponse {
    cod: string;
    message: number;
    cnt: number;
    list: WeatherForecast[];
    city: {
        id: number;
        name: string;
        coord: {
            lat: number;
            lon: number;
        };
        country: string;
        population: number;
        timezone: number;
        sunrise: number;
        sunset: number;
    };
}

export class WeatherService {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor() {
        this.apiKey = config.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://pro.openweathermap.org/data/2.5';
    }

    async getForecast(lat: number, lon: number): Promise<WeatherResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat,
                    lon,
                    appid: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch weather data');
        }
    }
} 