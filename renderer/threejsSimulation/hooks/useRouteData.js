import { useState, useEffect } from 'react';

export function useRouteData() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRouteData = async () => {
      try {
        const savedData = localStorage.getItem('drone_route');
        if (savedData) {
          setRouteData(JSON.parse(savedData));
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

  return { routeData, loading, error };
}