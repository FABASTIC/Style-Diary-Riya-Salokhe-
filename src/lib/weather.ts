export interface WeatherData {
  temp: number;
  condition: string;
  locationName: string;
}

export const getLocalWeather = async (): Promise<WeatherData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Fetch location name
        const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const locData = await locRes.json();
        const locationName = locData.address.city || locData.address.town || locData.address.state || locData.address.country || 'Unknown Location';

        // Fetch weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
        const weatherData = await weatherRes.json();
        const temp = Math.round(weatherData.current.temperature_2m);
        const code = weatherData.current.weather_code;

        let condition = 'Clear';
        if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
        if (code >= 45 && code <= 48) condition = 'Foggy';
        if (code >= 51 && code <= 67) condition = 'Rainy';
        if (code >= 71 && code <= 77) condition = 'Snowy';
        if (code >= 95) condition = 'Stormy';

        resolve({ temp, condition, locationName });
      } catch (e) {
        reject(e);
      }
    }, (error) => {
      reject(error);
    });
  });
};
