import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { FaFolder, FaCloud, FaPlay, FaTimes, FaSave } from 'react-icons/fa';
import { WeatherResponse } from "../../pages/Weather";
import { TurbinePathResponse } from "../../pages/Router";
import { useTranslation } from "react-i18next";



const Menu = () => {

  const { t } = useTranslation();

  const nav = useNavigate();
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  // Проверяем наличие данных в localStorage при загрузке
  useEffect(() => {
    const savedRoutes = localStorage.getItem('drone_route');
    const savedWeather = localStorage.getItem('weatherData');
    
    if (savedRoutes) setRoutesLoaded(true);
    if (savedWeather) setWeatherLoaded(true);
  }, []);

  const handleRouteFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event, "1");
  };

  const handleWeatherFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event, "2");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, option: string) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Файл должен быть в формате JSON');
      }

      setLoading(true);
    
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });

      const jsonData = JSON.parse(fileContent);

      switch(option) {
        case "1":
          if (!isValidRouteData(jsonData)) {
            throw new Error('Неверный формат файла маршрута');
          }
          const JsonRouteData: TurbinePathResponse = jsonData;
          localStorage.setItem("drone_route", JSON.stringify(JsonRouteData));
          setRoutesLoaded(true);
          break;  
        case "2":
          if (!isValidWeatherData(jsonData)) {
            throw new Error('Неверный формат файла погоды');
          }
          const JsonWeatherData: WeatherResponse = jsonData;
          localStorage.setItem("weatherData", JSON.stringify(JsonWeatherData));
          setWeatherLoaded(true);
          break; 
        default:
          console.log("default: incorrect option");
      }
    }
    catch(err) {
      setError(err);
    }
    finally {
      setLoading(false);
    }
  }

  // Проверка структуры маршрута
  const isValidRouteData = (data: any): data is TurbinePathResponse => {
    return (
      typeof data === 'object' &&
      data !== null &&
      Array.isArray(data.turbines) &&
      Array.isArray(data.path) &&
      typeof data.path_length_meters === 'number' &&
      
      // Проверка структуры турбин
      data.turbines.every((turbine: any) => 
        typeof turbine.id === 'number' &&
        typeof turbine.lat === 'number' &&
        typeof turbine.lon === 'number' &&
        typeof turbine.z === 'number'
      ) &&
      
      // Проверка структуры точек пути
      data.path.every((point: any) => 
        typeof point.id === 'number' &&
        typeof point.x === 'number' &&
        typeof point.y === 'number' &&
        typeof point.z === 'number'
      )
    );
  }

  // Проверка структуры погоды
  const isValidWeatherData = (data: any): data is WeatherResponse => {
    return (
      typeof data === 'object' &&
      data !== null &&
      
      // Проверка location
      typeof data.location === 'object' &&
      typeof data.location.name === 'string' &&
      typeof data.location.latitude === 'number' &&
      typeof data.location.longitude === 'number' &&
      
      // Проверка current_weather
      typeof data.current_weather === 'object' &&
      typeof data.current_weather.time === 'string' &&
      typeof data.current_weather.temperature === 'number' &&
      typeof data.current_weather.wind_speed === 'number' &&
      typeof data.current_weather.wind_direction === 'number' &&
      typeof data.current_weather.weather_code === 'number' &&
      
      // Проверка forecast
      Array.isArray(data.forecast) &&
      data.forecast.every((item: any) => 
        typeof item.time === 'string' &&
        typeof item.temperature === 'number' &&
        typeof item.precipitation === 'number' &&
        typeof item.precipitation_probability === 'number' &&
        typeof item.wind_speed === 'object' &&
        typeof item.wind_speed['10m'] === 'number' &&
        typeof item.wind_speed['80m'] === 'number' &&
        typeof item.wind_speed['120m'] === 'number' &&
        typeof item.wind_speed['180m'] === 'number' &&
        typeof item.wind_direction === 'object' &&
        typeof item.wind_direction['10m'] === 'number' &&
        typeof item.wind_direction['80m'] === 'number' &&
        typeof item.wind_direction['120m'] === 'number' &&
        typeof item.wind_direction['180m'] === 'number' &&
        typeof item.humidity === 'number' &&
        typeof item.pressure === 'number' &&
        typeof item.cloudcover === 'number' &&
        typeof item.wind_gusts === 'number'
      )
    );
  }

  const handleStartSimulation = () => {
    if (routesLoaded && weatherLoaded) {
      nav("/simulation");
    } else {
      alert('Пожалуйста, загрузите маршрут и данные погоды перед началом симуляции!');
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('drone_route');
    localStorage.removeItem('weatherData');
    setRoutesLoaded(false);
    setWeatherLoaded(false);
    alert('Все данные очищены!');
  };

  const handleBackToRouter = () => {
    console.log('Navigating to /router');
    nav("/router");
  };

  return (
    <div className="min-h-screen bg-[#a2c8df] relative overflow-hidden" style={{ fontFamily: 'Segoe UI Emoji, sans-serif' }}>
      {/* Фоновое изображение */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Кнопка назад в правом верхнем углу */}
      <button 
        onClick={handleBackToRouter}
        className="absolute top-4 right-4 z-50 text-gray-300 font-bold py-2 px-4"
        style={{ zIndex: 1000 }}
      >
        {t("Router")}
      </button>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center py-8 px-4">
        
        {/* Дрон сверху - уменьшенный */}
        <div className="flex justify-center mb-6">
          <img 
            src="./images/3d/drone.png" 
            alt="drone" 
            className="w-[120px] transform hover:scale-105 transition-transform duration-500" 
          />
        </div>

        {/* Статус загрузки данных */}
        <div className="mb-8 flex gap-6">
          <div className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${
            routesLoaded ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}>
            {t("Route")} {routesLoaded ? '✓' : '✗'}
          </div>
          <div className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${
            weatherLoaded ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}>
            {t("Weather")} {weatherLoaded ? '✓' : '✗'}
          </div>
          <button 
            onClick={() => nav("/")}
            className="text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg"
          >
              {t("Flight Prediction")}
          </button>
        </div>

        {/* Основной контейнер с блюром */}
        <div className="bg-black bg-opacity-30 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-4xl border border-white border-opacity-20">
          {/* Кнопки управления */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Загрузка маршрута */}
            <div className="space-y-3">
              <label className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                <span className="text-lg">{loading ? '...' : <FaFolder />}</span>
                <span>{t("Upload route JSON")}</span>
                <input 
                  type="file"
                  accept=".json"
                  onChange={handleRouteFileSelect}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Загрузка погоды */}
            <div className="space-y-3">
              <label className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                <span className="text-lg">{loading ? '...' : <FaCloud />}</span>
                <span>{t("Upload weather JSON")}</span>
                <input 
                  type="file"
                  accept=".json"
                  onChange={handleWeatherFileSelect}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Управляющие кнопки */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleClearData}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="text-lg"><FaTimes /></span>
              <span>{t("Clear")}</span>
            </button>
            
            <button
              onClick={handleStartSimulation}
              disabled={!routesLoaded || !weatherLoaded || loading}
              className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg ${
                routesLoaded && weatherLoaded && !loading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-lg"><FaPlay /></span>
              <span>{loading ? 'Loading...' : t('Start simulation')}</span>
            </button>
          </div>

          {/* Информационная панель */}
          <div className="text-white bg-opacity-40 backdrop-blur-md p-4 rounded-2xl border border-white border-opacity-10">
            <h3 className="text-lg font-bold mb-3 text-center">{t("Информация о симуляции")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("Статус маршрута:")}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${routesLoaded ? 'bg-green-500' : 'bg-red-500'}`}>
                    {routesLoaded ? t('Загружен') : t('Не загружен')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("Статус погоды:")}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${weatherLoaded ? 'bg-green-500' : 'bg-red-500'}`}>
                    {weatherLoaded ? t('Загружен') : t('Не загружен')}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("Локальные данные:")}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    localStorage.getItem('droneRoutes') || localStorage.getItem('weatherData') 
                      ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {localStorage.getItem('droneRoutes') || localStorage.getItem('weatherData') ? t('Найдены') : t('Отсутствуют')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("Готовность:")}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-blue-500 to-purple-500">
                    {routesLoaded && weatherLoaded ? '100%' : routesLoaded || weatherLoaded ? '50%' : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50]">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 font-semibold">{t("Загрузка данных...")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;