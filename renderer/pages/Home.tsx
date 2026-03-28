import { useState, useEffect } from "react";
import { saveDataToHistory } from "./History";
import { useTranslation } from "react-i18next";
import Dropdown from "@components/Dropdown";
import Navbar from "@components/NavBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Function to fetch and set prediction data
const getDataPredict = (
  setRouteDatastr: React.Dispatch<React.SetStateAction<JSON | null>>,
  setWeatherDatastr: React.Dispatch<React.SetStateAction<JSON | null>>,
  setDataPredictLoad: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const routeData = JSON.parse(localStorage.getItem("drone_route") || "null");
  const weatherData = JSON.parse(localStorage.getItem("weatherData") || "null");
  setRouteDatastr(routeData);
  setWeatherDatastr(weatherData);
  setDataPredictLoad(true);
};

// Prediction logic to determine flight feasibility and battery needs
const calculatePrediction = (routeData: any, weatherData: any) => {
  if (!routeData || !weatherData) {
    return {
      canFly: false,
      message: "Missing route or weather data",
      batteryEstimate: null,
      distance: null,
      windSpeed: null,
      precipitation: null,
    };
  }

  // Extract relevant data
  const distanceKm = (routeData.path_length_meters || 0) / 1000; // Convert meters to km
  const windSpeed = weatherData.forecast?.[0]?.wind_speed?.["80m"] || weatherData.current_weather?.wind_speed || 0; // Wind speed at 80m in m/s
  const precipitation = weatherData.forecast?.[0]?.precipitation || 0; // Precipitation in mm

  // Define thresholds
  const maxWindSpeed = 15; // Max safe wind speed in m/s at 80m
  const maxPrecipitation = 2; // Max safe precipitation in mm
  const batteryPerKm = 4; // 4% battery per km
  const baseBatteryUsage = 10; // Base battery usage for takeoff/landing

  // Check flight feasibility
  if (windSpeed > maxWindSpeed) {
    return {
      canFly: false,
      message: "Cannot fly: Wind speed too high",
      batteryEstimate: null,
      distance: `${distanceKm.toFixed(2)} km`,
      windSpeed: `${windSpeed.toFixed(1)} m/s`,
      precipitation: `${precipitation.toFixed(1)} mm`,
    };
  }
  if (precipitation > maxPrecipitation) {
    return {
      canFly: false,
      message: "Cannot fly: Heavy precipitation",
      batteryEstimate: null,
      distance: `${distanceKm.toFixed(2)} km`,
      windSpeed: `${windSpeed.toFixed(1)} m/s`,
      precipitation: `${precipitation.toFixed(1)} mm`,
    };
  }
  if (distanceKm <= 0) {
    return {
      canFly: false,
      message: "Cannot fly: Invalid route distance",
      batteryEstimate: null,
      distance: "0 km",
      windSpeed: `${windSpeed.toFixed(1)} m/s`,
      precipitation: `${precipitation.toFixed(1)} mm`,
    };
  }

  // Calculate battery estimate
  const batteryEstimate = Math.min(100, Math.round(baseBatteryUsage + distanceKm * batteryPerKm));

  return {
    canFly: true,
    message: "Flight is feasible",
    batteryEstimate: `${batteryEstimate}%`,
    distance: `${distanceKm.toFixed(2)} km`,
    windSpeed: `${windSpeed.toFixed(1)} m/s`,
    precipitation: `${precipitation.toFixed(1)} mm`,
  };
};

const Home = () => {
  // Move state declarations inside the component
  const [dataPredictLoad, setDataPredictLoad] = useState<boolean>(false);
  const [routeDatastr, setRouteDatastr] = useState<JSON | null>(null);
  const [weatherDatastr, setWeatherDatastr] = useState<JSON | null>(null);

  const [lang, setLang] = useState("EN");
  const { t, i18n } = useTranslation();

  const changeLang = (lng: string) => {
    const langCode = lng.toLowerCase();
    i18n
      .changeLanguage(langCode)
      .then(() => {
        localStorage.setItem("language", langCode);
        setLang(lng);
        toast.info(`Language changed to ${lng}`, {
          position: "top-right",
          autoClose: 2000,
        });
      })
      .catch((err) => console.error("Error changing language:", err));
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    i18n.changeLanguage(savedLang);
    setLang(savedLang.toUpperCase());

    const handleLanguageChanged = (lng: string) => {
      setLang(lng.toUpperCase());
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  // Initialize missions from localStorage
  const [missions, setMissions] = useState<string[]>(() => {
    const savedMissions = localStorage.getItem("missions");
    return savedMissions ? JSON.parse(savedMissions) : [];
  });
  const [newMission, setNewMission] = useState("");
  const [selectedMission, setSelectedMission] = useState<string | null>(() => {
    return localStorage.getItem("selectedMission");
  });
  const [warning, setWarning] = useState<string | null>(null);

  // Sync with localStorage changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMissions = localStorage.getItem("missions");
      const savedSelectedMission = localStorage.getItem("selectedMission");
      setMissions(savedMissions ? JSON.parse(savedMissions) : []);
      setSelectedMission(savedSelectedMission);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Update localStorage when missions or selectedMission changes
  useEffect(() => {
    localStorage.setItem("missions", JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem("selectedMission", selectedMission || "");
  }, [selectedMission]);

  // Clear warning when user types in the input
  useEffect(() => {
    if (warning && newMission) {
      const timer = setTimeout(() => setWarning(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newMission, warning]);

  // Load prediction data on component mount
  useEffect(() => {
    getDataPredict(setRouteDatastr, setWeatherDatastr, setDataPredictLoad);
  }, []);

  const steps = [
    t("Read the documentation (Docs)."),
    t("Add a mission (Home)."),
    t("Upload weather data (Weather)."),
    t("Build a flight route (Router)."),
    t("Adjust the flight in 3D simulation (Router)."),
    t("Complete the mission from the main menu or after flying in the 3D simulation."),
  ];

  const handleMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missions.length >= 1) {
      setWarning(
        t("Only one mission can be created at a time. Remove the current mission to add a new one.")
      );
      toast.warning(t("Only one mission can be created at a time."), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (newMission.trim() && !missions.includes(newMission.trim())) {
      setMissions([...missions, newMission.trim()]);
      setNewMission("");
      setSelectedMission(newMission.trim());
      toast.success(t("Mission added successfully!"), {
        position: "top-right",
        autoClose: 2000,
      });
      window.location.reload(); // Reload page to update Navbar
    }
  };

  const handleRemoveMission = () => {
    if (selectedMission) {
      setMissions(missions.filter((m) => m !== selectedMission));
      setSelectedMission(null);
      setWarning(null);
      saveDataToHistory();
      localStorage.removeItem("missions");
      localStorage.removeItem("weatherData");
      localStorage.removeItem("drone_route");
      toast.info(t("Mission completed and data cleared."), {
        position: "top-right",
        autoClose: 2000,
      });
      window.location.reload(); // Reload page to update Navbar
    }
  };

  // Calculate prediction
  const prediction = calculatePrediction(routeDatastr, weatherDatastr);

  return (
    <>
      <Navbar />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      <main className="relative min-h-screen w-full bg-[#a2c8df] flex flex-col items-center justify-start pt-[150px] overflow-hidden">
        {/* Background Image with Refined Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Create mission */}
        <section className="text-white z-10 mb-[50px] w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
          {warning && (
            <p className="text-red-500 text-center pb-[20px] font-medium">{warning}</p>
          )}
          {selectedMission && (
            <p className="text-lg text-white text-center pb-[20px] font-medium">
              {t("Current Mission")}: <span className="font-bold">{selectedMission}</span>
            </p>
          )}

          <form onSubmit={handleMissionSubmit} className="flex justify-center sm:flex-row gap-2">
            <Dropdown lang={lang} onChange={changeLang} />
            <input
              type="text"
              placeholder={t("Mission name")}
              value={newMission}
              onChange={(e) => setNewMission(e.target.value)}
              className="w-full max-w-[600px] px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-[#648596] shadow-sm"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#69a7ce] text-white rounded-lg hover:bg-[#547485] transition duration-300 shadow-md"
            >
              {t("Add Mission")}
            </button>
            <button
              type="button"
              onClick={handleRemoveMission}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!selectedMission}
            >
              {t("Complete the mission")}
            </button>
          </form>
        </section>

        {/* Prediction Section */}
        {dataPredictLoad && (
          <section className="text-white z-10 mb-[50px] w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
            <h2 className="flex justify-center text-xl font-semibold text-white mb-4">{t("Flight Prediction")}</h2>
            <div className="flex justify-center gap-[500px]">
              <div>
                <p className="font-medium">
                  {t("Status")}:{" "}
                  <span className={prediction.canFly ? "text-green-400" : "text-red-500"}>
                    {t(prediction.message)}
                  </span>
                </p>
                <p>{t("Route Distance")}: {prediction.distance || "N/A"}</p>
                <p>{t("Wind Speed (80m)")}: {prediction.windSpeed || "N/A"}</p>
              </div>
              <div>
                <p>{t("Precipitation")}: {prediction.precipitation || "N/A"}</p>
                <p>{t("Battery Estimate")}: {prediction.batteryEstimate || "N/A"}</p>
              </div>
            </div>
          </section>
        )}

        {/* Steps Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 max-w-7xl mx-auto z-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-black bg-opacity-20 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#648596] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-md">
                {index + 1}
              </div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">
                {t("Step")} {index + 1}
              </h2>
              <p className="text-white text-base leading-relaxed">{step}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
};

export default Home;