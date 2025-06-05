import prompts from "prompts";
import { WeatherRec } from "../src/agents/weather_recomendation";

async function main() {
    // const { comment } = await prompts({
    //     type: "text",
    //     message: "Введите погоду в формате json: ",
    //     name: "comment",
    // });

    const comment = `{
    "cod": "200",
    "message": 0,
    "cnt": 40,
    "list": [
        {
            "dt": 1748984400,
            "main": {
                "temp": 288.19,
                "feels_like": 287.79,
                "temp_min": 287.6,
                "temp_max": 288.19,
                "pressure": 1008,
                "sea_level": 1008,
                "grnd_level": 996,
                "humidity": 78,
                "temp_kf": 0.59
            },
            "weather": [
                {
                    "id": 802,
                    "main": "Clouds",
                    "description": "scattered clouds",
                    "icon": "03n"
                }
            ],
            "clouds": {
                "all": 50
            },
            "wind": {
                "speed": 2.13,
                "deg": 258,
                "gust": 2.97
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2025-06-03 21:00:00"
        },
        {
            "dt": 1748995200,
            "main": {
                "temp": 288.12,
                "feels_like": 287.68,
                "temp_min": 287.93,
                "temp_max": 288.12,
                "pressure": 1008,
                "sea_level": 1008,
                "grnd_level": 995,
                "humidity": 77,
                "temp_kf": 0.19
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds",
                    "icon": "04n"
                }
            ],
            "clouds": {
                "all": 71
            },
            "wind": {
                "speed": 2.13,
                "deg": 239,
                "gust": 3.87
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "n"
            },
            "dt_txt": "2025-06-04 00:00:00"
        },
        {
            "dt": 1749006000,
            "main": {
                "temp": 289.48,
                "feels_like": 289.13,
                "temp_min": 289.48,
                "temp_max": 289.48,
                "pressure": 1008,
                "sea_level": 1008,
                "grnd_level": 994,
                "humidity": 75,
                "temp_kf": 0
            },
            "weather": [
                {
                    "id": 804,
                    "main": "Clouds",
                    "description": "overcast clouds",
                    "icon": "04d"
                }
            ],
            "clouds": {
                "all": 88
            },
            "wind": {
                "speed": 2.12,
                "deg": 248,
                "gust": 3.61
            },
            "visibility": 10000,
            "pop": 0,
            "sys": {
                "pod": "d"
            },
            "dt_txt": "2025-06-04 03:00:00"
        }
    ],
    "city": {
        "id": 551487,
        "name": "Kazan’",
        "coord": {
            "lat": 55.7887,
            "lon": 49.1221
        },
        "country": "RU",
        "population": 1104738,
        "timezone": 10800,
        "sunrise": 1748909108,
        "sunset": 1748971111
    }
}
`

    console.log(await WeatherRec(comment));
}

main();