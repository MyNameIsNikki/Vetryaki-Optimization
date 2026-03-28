import { MissionEntry } from "../pages/History";
import { useTranslation } from "react-i18next";


interface HistoryCardProps {
  missions: MissionEntry[];
}

const HistoryCard = ({ missions }: HistoryCardProps) => {

  const { t } = useTranslation();
  
  const formatWeather = (weather: any) => {
    if (!weather) return "No weather data";
    
    return `
      Location: ${weather.location?.name || 'Unknown'}, 
      Temp: ${weather.current?.temp_c || 'N/A'}°C, 
      Condition: ${weather.current?.condition?.text || 'N/A'}
    `;
  };

  const formatRoute = (route: any) => {
    if (!route || !route.path) return "No route data";
    
    return `
      Turbines: ${route.turbines?.length || 0}, 
      Path points: ${route.path?.length || 0}
    `;
  };

  // Функция для скачивания JSON файла
  const downloadJSON = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Функция для скачивания погодных данных
  const downloadWeatherJSON = (weather: any, index: number) => {
    if (!weather) return;
    downloadJSON(weather, `weather_data_mission_${index + 1}`);
  };

  // Функция для скачивания данных маршрута
  const downloadRouteJSON = (route: any, index: number) => {
    if (!route) return;
    downloadJSON(route, `route_data_mission_${index + 1}`);
  };

  return (
    <div className="text-white z-10 mb-[50px] w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
      {missions.length > 0 ? (
        <ul className="space-y-6">
          {missions.map((item, index) => (
            <li key={index} className="p-6 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
              {/* Заголовок миссии */}
              <div className="mb-6 pb-4 border-b border-white border-opacity-20">
                <strong className="text-lg text-blue-300">{t("Mission")}:</strong> 
                <span className="ml-2 text-white">{item.mission || "Unnamed mission"}</span>
              </div>
              
              {/* Секция погоды */}
              <div className="mb-6 pb-4 border-b border-white border-opacity-20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                    <strong className="text-lg">{t("Weather Data")}</strong>
                  </div>
                  <button
                    onClick={() => downloadWeatherJSON(item.weather, index)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors flex items-center"
                    disabled={!item.weather}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t("Download JSON")}
                  </button>
                </div>
                <div className="pl-5">
                  <p className="text-gray-200">{formatWeather(item.weather)}</p>
                </div>
              </div>
              
              {/* Секция маршрута */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                    <strong className="text-lg">{t("Route Data")}</strong>
                  </div>
                  <button
                    onClick={() => downloadRouteJSON(item.route, index)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors flex items-center"
                    disabled={!item.route}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t("Download JSON")}
                  </button>
                </div>
                <div className="pl-5">
                  <p className="text-gray-200">{formatRoute(item.route)}</p>
                </div>
              </div>

              {/* Разделитель между миссиями */}
              {index < missions.length - 1 && (
                <div className="mt-6 pt-4 border-t border-white border-opacity-10"></div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-lg">No missions available</p>
      )}
    </div>
  );
};

export default HistoryCard;