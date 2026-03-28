import { useState, useEffect } from 'react';

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRouteData = async () => {
      try {
        const savedData = localStorage.getItem('weatherData');
        if (savedData) {
          setWeatherData(JSON.parse(savedData));
        } else{
            alert("Missing data");
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading route data:', err);
        setError(err);
        setLoading(false);
      }
    };

    loadRouteData();
  }, []);

  return { weatherData, loading, error };
}