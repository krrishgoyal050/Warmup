import fetch from 'node-fetch';
import { config } from '../config';
import { WeatherAlert } from '../types';

export interface DailyWeatherForecast {
  date: string;
  tempDay: number; // in Celsius
  tempNight: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm';
  description: string;
  humidity: number;
  windSpeed: number;
}

export const weatherService = {
  // Fetch weather forecast for a destination for N days
  async getForecast(destination: string, days: number = 7): Promise<DailyWeatherForecast[]> {
    if (config.weather.isMock) {
      console.log(`[WEATHER SERVICE MOCK] Generating a ${days}-day forecast for ${destination}`);
      
      const conditions: DailyWeatherForecast['condition'][] = ['clear', 'clouds', 'rain', 'clear', 'clouds', 'clear', 'clear'];
      const descriptions = {
        clear: 'Sunny and clear skies, perfect for outdoor activities.',
        clouds: 'Partly cloudy. Comfortable temperature.',
        rain: 'Heavy rainfall and scatter showers expected throughout the day.',
        snow: 'Light snow showers, chilly winds.',
        thunderstorm: 'Heavy thunderstorms and high winds warning.',
      };

      const forecast: DailyWeatherForecast[] = [];
      const startDate = new Date();

      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Let's seed rain on day 2 or 3 to show off our dynamic weather replanning!
        const condition = i === 1 || i === 4 ? 'rain' : conditions[i % conditions.length];
        const description = descriptions[condition];

        forecast.push({
          date: currentDate.toISOString().split('T')[0],
          tempDay: condition === 'rain' ? 18 : 23 + (i % 3) - (i === 1 ? 4 : 0),
          tempNight: 12 + (i % 2),
          condition,
          description,
          humidity: condition === 'rain' ? 88 : 55,
          windSpeed: condition === 'rain' ? 8.5 : 3.2,
        });
      }

      return forecast;
    }

    try {
      // Free OpenWeatherMap 16-day or 5-day daily forecast API
      const url = `https://api.openweathermap.org/data/2.5/forecast/daily?q=${encodeURIComponent(destination)}&cnt=${days}&units=metric&appid=${config.weather.apiKey}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.cod !== '200' || !data.list) {
        throw new Error(data.message || 'Failed to fetch OpenWeatherMap daily forecast');
      }

      return data.list.map((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        let condition: DailyWeatherForecast['condition'] = 'clear';
        const main = item.weather[0].main.toLowerCase();

        if (main.includes('rain') || main.includes('drizzle')) condition = 'rain';
        else if (main.includes('snow')) condition = 'snow';
        else if (main.includes('cloud')) condition = 'clouds';
        else if (main.includes('thunder')) condition = 'thunderstorm';

        return {
          date,
          tempDay: Math.round(item.temp.day),
          tempNight: Math.round(item.temp.night),
          condition,
          description: item.weather[0].description,
          humidity: item.humidity,
          windSpeed: item.speed,
        };
      });
    } catch (error) {
      console.error('[WEATHER SERVICE ERROR] Weather API query failed, using mocks:', error);
      // Fallback
      return this.getForecast(destination, days);
    }
  },

  // Analyze weather forecasts and generate real-time alerts
  generateWeatherAlerts(forecast: DailyWeatherForecast[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    forecast.forEach((day) => {
      if (day.condition === 'rain') {
        alerts.push({
          date: day.date,
          condition: 'rain',
          warning: `Heavy rain is forecasted on ${day.date} (${day.tempDay}°C). We recommend scheduling indoor events like museum tours, shopping sessions, or galleries for this day.`,
        });
      } else if (day.condition === 'thunderstorm') {
        alerts.push({
          date: day.date,
          condition: 'thunderstorm',
          warning: `Thunderstorm warning on ${day.date}. High wind speeds and storm conditions expected. Cancel outdoor trekking and beach visits immediately.`,
        });
      } else if (day.tempDay > 38) {
        alerts.push({
          date: day.date,
          condition: 'clear',
          warning: `Extreme high temperature warning on ${day.date} (${day.tempDay}°C). Extreme UV index. Avoid outdoor exposures between 11:00 AM and 3:00 PM. Drink plenty of water.`,
        });
      }
    });

    return alerts;
  }
};
