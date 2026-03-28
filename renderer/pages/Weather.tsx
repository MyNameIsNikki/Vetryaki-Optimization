import { useState, ChangeEvent, useEffect } from "react";
import Navbar from "@components/NavBar";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DataLocation {
  location_name: string;
  forecast_hours: number;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  weather_code: number | null;
}

export interface Forecast {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  precipitation_probability: number | null;
  wind_speed: { [key: string]: number };
  wind_direction: { [key: string]: number };
  humidity: number | null;
  pressure: number | null;
  cloudcover: number | null;
  wind_gusts: number | null;
}

export interface WeatherResponse {
  location: Location;
  current_weather: CurrentWeather;
  forecast: Forecast[];
}

const Weather = () => {
  const { t } = useTranslation();

  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState<Location>({ name: "", latitude: 0, longitude: 0 });
  const [datalocation, setDatalocation] = useState<DataLocation>({ location_name: "", forecast_hours: 0 });
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>({
    time: "",
    temperature: null,
    wind_speed: null,
    wind_direction: null,
    weather_code: null,
  });
  const [forecast, setForecast] = useState<Forecast[]>([]);

  const handleWeatherRequest = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === "forecast_hours") {
      const parsedValue = parseInt(value, 10);
      setDatalocation({
        ...datalocation,
        [name]: isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue,
      });
    } else {
      setDatalocation({
        ...datalocation,
        [name]: value,
      });
    }
  };

  const [mission, setMission] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const missionData = localStorage.getItem("missions");
      console.log("Mission data from localStorage:", missionData);
      
      if (missionData && missionData !== "[]") {
        const parsedMission = JSON.parse(missionData);
        console.log("Parsed mission:", parsedMission);
        
        if (Array.isArray(parsedMission) && parsedMission.length > 0 && parsedMission[0] !== "[]") {
          setMission(parsedMission);
          toast.success(t("Mission loaded successfully"));
        } else {
          console.log("Invalid mission structure");
          setMission(null);
          toast.error(t("Invalid mission structure"));
        }
      } else {
        console.log("No valid mission found");
        setMission(null);
        toast.info(t("No valid mission found"));
      }
    } catch (error) {
      console.error("Ошибка при загрузке миссии:", error);
      setMission(null);
      toast.error(t("Error loading mission"));
    }
  }, []);

  const hasValidMission = mission && mission.length > 0 && mission[0] !== "[]";

  const saveToLocalStorage = () => {
    if (!location || !currentWeather || !forecast) {
      console.error("Cannot save to localStorage: incomplete weather data");
      setError(new Error("Incomplete weather data"));
      toast.error(t("Cannot save: incomplete weather data"));
      return;
    }
    const weatherData: WeatherResponse = {
      location,
      current_weather: currentWeather,
      forecast,
    };
    localStorage.setItem("weatherData", JSON.stringify(weatherData));
    console.log("Saved to localStorage:", weatherData);
    toast.success(t("Weather data saved to localStorage"));
  };

  useEffect(() => {
    const savedWeather = localStorage.getItem("weatherData");
    if (savedWeather) {
      try {
        const parsedWeather: WeatherResponse = JSON.parse(savedWeather);
        console.log("Loaded weather from localStorage: ", parsedWeather);

        if (
          parsedWeather.location &&
          parsedWeather.current_weather &&
          Array.isArray(parsedWeather.forecast)
        ) {
          setLocation(parsedWeather.location);
          setCurrentWeather(parsedWeather.current_weather);
          setForecast(parsedWeather.forecast);
          toast.success(t("Weather data loaded from localStorage"));
        } else {
          console.error("Invalid weather data structure in localStorage", parsedWeather);
          setError(new Error("Invalid weather data structure in localStorage"));
          toast.error(t("Invalid weather data structure in localStorage"));
          localStorage.removeItem("weatherData");
        }
      } catch (err) {
        console.error("Error parsing weather data from localStorage:", err);
        setError(new Error("Failed to load weather data from localStorage"));
        toast.error(t("Failed to load weather data from localStorage"));
        localStorage.removeItem("weatherData");
      }
    }
  }, []);

  const exportToJson = () => {
    if (!location || !currentWeather || !forecast) {
      console.error("Cannot export to JSON: incomplete weather data");
      setError(new Error("Incomplete weather data"));
      toast.error(t("Cannot export: incomplete weather data"));
      return;
    }
    const weatherData: WeatherResponse = {
      location,
      current_weather: currentWeather,
      forecast,
    };
    const json = JSON.stringify(weatherData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "weather_data.json";
    link.click();
    URL.revokeObjectURL(url);
    console.log("Exported to JSON:", weatherData);
    toast.success(t("Weather data exported to JSON"));
  };

  const clearData = () => {
    setLocation({ name: "", latitude: 0, longitude: 0 });
    setCurrentWeather({
      time: "",
      temperature: null,
      wind_speed: null,
      wind_direction: null,
      weather_code: null,
    });
    setForecast([]);
    setError(null);
    localStorage.removeItem("weatherData");
    console.log("Cleared all weather data");
    toast.info(t("Weather data cleared"));
  };

  const sendWeatherRequest = async () => {
    try {
      console.log("Sending request with body:", JSON.stringify(datalocation));
      const response = await fetch("http://127.0.0.1:8000/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datalocation),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Response error text:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: WeatherResponse = await response.json();
      console.log("API Response:", data);

      setLocation({
        name: data.location.name,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });

      setCurrentWeather({
        time: data.current_weather.time,
        temperature: data.current_weather.temperature,
        wind_speed: data.current_weather.wind_speed,
        wind_direction: data.current_weather.wind_direction,
        weather_code: data.current_weather.weather_code,
      });

      setForecast(data.forecast);
      toast.success(t("Weather data retrieved successfully"));
    } catch (error) {
      console.error("Error in sendWeatherRequest:", error);
      setError(error instanceof Error ? error : new Error("An unknown error occurred"));
      toast.error(t("Error retrieving weather data: ") + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const isDataLoaded = currentWeather.time !== "" &&
                      (currentWeather.temperature !== null ||
                       currentWeather.wind_speed !== null ||
                       currentWeather.wind_direction !== null ||
                       currentWeather.weather_code !== null ||
                       forecast.length > 0);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <Navbar />
      <main className="relative min-h-screen w-full bg-[#a2c8df] flex flex-col items-center justify-start pt-[150px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        <div className="text-white z-10 mb-[50px] w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
          {error && (
            <div className="text-red-400 text-center p-4 bg-white bg-opacity-20 rounded-xl shadow-sm mb-4">
              {error.message}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendWeatherRequest();
            }}
            className="flex justify-center gap-2"
          >
            <input
              onChange={handleWeatherRequest}
              name="location_name"
              value={datalocation.location_name}
              className="text-center w-full max-w-[600px] bg-transparent placeholder:text-white placeholder:text-center text-white text-sm border border-white rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              type="text"
              placeholder={t("CITY/TOWN")}
              required
            />
            <input
              onChange={handleWeatherRequest}
              name="forecast_hours"
              value={datalocation.forecast_hours || ""}
              className="text-center w-full max-w-[200px] bg-transparent placeholder:text-white placeholder:text-center text-white text-sm border border-white rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
              type="number"
              placeholder={t("forecast hours")}
              min="0"
              required
            />
            <button
              className="px-6 py-2 bg-[#648596] text-white rounded-lg hover:bg-[#547485] transition duration-300 shadow-md"
              type="submit"
            >
              {t("Submit")}
            </button>
          </form>
        </div>

        <div className="z-10 w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
          <div className="flex justify-center gap-2 mb-12">
            <button
              onClick={saveToLocalStorage}
              disabled={!isDataLoaded || !hasValidMission}
              className={`px-6 py-2 rounded-lg text-white transition duration-300 shadow-md ${
                isDataLoaded && hasValidMission
                  ? "bg-[#648596] hover:bg-[#547485]"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {t("Save to LocalStorage")}
            </button>
            <button
              onClick={exportToJson}
              className={`px-6 py-2 rounded-lg text-white transition duration-300 shadow-md ${
                isDataLoaded
                  ? "bg-[#648596] hover:bg-[#547485]"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {t("Export JSON")}
            </button>
            <button
              onClick={clearData}
              className="px-6 py-2 bg-[#963333] text-white rounded-lg hover:bg-[#7a2a2a] transition duration-300 shadow-md"
            >
              {t("Clear")}
            </button>
          </div>

          <section className={`grid ${isDataLoaded ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 justify-center'} gap-8 px-6 max-w-7xl mx-auto z-10`}>
            {currentWeather ? (
              <div className={`relative bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/40 ${isDataLoaded ? '' : 'max-w-lg'}`}>
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#648596] text-white rounded-full w-auto px-4 py-2 flex items-center justify-center font-bold text-sm shadow-md">
                  {t("Weather")} {currentWeather.time || t("N/A")}
                </div>
                <p className="mt-1 text-white text-base leading-relaxed">{t("Location")}: {location.name || t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Latitude")}: {location.latitude || t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Longitude")}: {location.longitude || t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Time")}: {currentWeather.time || t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Temperature")}: {currentWeather.temperature ?? t("N/A")}°C</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")}: {currentWeather.wind_speed ?? t("N/A")} m/s</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")}: {currentWeather.wind_direction ?? t("N/A")}°</p>
                <p className="text-white text-base leading-relaxed">{t("Weather Code")}: {currentWeather.weather_code ?? t("N/A")}</p>
              </div>
            ) : (
              <div className="relative bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/40 max-w-lg">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#648596] text-white rounded-full w-auto px-4 py-2 flex items-center justify-center font-bold text-sm shadow-md">
                  {t("Current Weather N/A")}
                </div>
                <p className="mt-1 text-white text-base leading-relaxed">{t("Location")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Latitude")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Longitude")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Time")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Temperature")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Weather Code")}: {t("N/A")}</p>
              </div>
            )}

            {forecast.length > 0 ? (
              forecast.map((forecastItem, index) => (
                <div
                  key={index}
                  className="relative bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/40"
                >
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#648596] text-white rounded-full w-auto px-4 py-2 flex items-center justify-center font-bold text-sm shadow-md">
                    {t("Forecast")} {forecastItem.time || t("N/A")}
                  </div>
                  <p className="mt-1 text-white text-base leading-relaxed">{t("Time")}: {forecastItem.time || t("N/A")}</p>
                  <p className="text-white text-base leading-relaxed">{t("Temperature")}: {forecastItem.temperature ?? t("N/A")}°C</p>
                  <p className="text-white text-base leading-relaxed">{t("Precipitation")}: {forecastItem.precipitation ?? t("N/A")} mm</p>
                  <p className="text-white text-base leading-relaxed">{t("Precipitation Probability")}: {forecastItem.precipitation_probability ?? t("N/A")}%</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (10m): {forecastItem.wind_speed["10m"] ?? t("N/A")} m/s</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (80m): {forecastItem.wind_speed["80m"] ?? t("N/A")} m/s</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (120m): {forecastItem.wind_speed["120m"] ?? t("N/A")} m/s</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (180m): {forecastItem.wind_speed["180m"] ?? t("N/A")} m/s</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (10m): {forecastItem.wind_direction["10m"] ?? t("N/A")}°</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (80m): {forecastItem.wind_direction["80m"] ?? t("N/A")}°</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (120m): {forecastItem.wind_direction["120m"] ?? t("N/A")}°</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (180m): {forecastItem.wind_direction["180m"] ?? t("N/A")}°</p>
                  <p className="text-white text-base leading-relaxed">{t("Humidity")}: {forecastItem.humidity ?? t("N/A")}%</p>
                  <p className="text-white text-base leading-relaxed">{t("Pressure")}: {forecastItem.pressure ?? t("N/A")} hPa</p>
                  <p className="text-white text-base leading-relaxed">{t("Cloud Cover")}: {forecastItem.cloudcover ?? t("N/A")}%</p>
                  <p className="text-white text-base leading-relaxed">{t("Wind Gusts")}: {forecastItem.wind_gusts ?? t("N/A")} m/s</p>
                </div>
              ))
            ) : (
              <div className="relative bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/40 max-w-lg">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#648596] text-white rounded-full w-auto px-4 py-2 flex items-center justify-center font-bold text-sm shadow-md">
                  {t("Forecast N/A")}
                </div>
                <p className="mt-1 text-white text-base leading-relaxed">{t("Time")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Temperature")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Precipitation")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Precipitation Probability")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (10m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (80m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (120m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Speed")} (180m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (10m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (80m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (120m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Direction")} (180m): {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Humidity")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Pressure")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Cloud Cover")}: {t("N/A")}</p>
                <p className="text-white text-base leading-relaxed">{t("Wind Gusts")}: {t("N/A")}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default Weather;