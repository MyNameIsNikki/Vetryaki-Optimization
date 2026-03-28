import Navbar from "@components/NavBar";
import { useState, useEffect } from "react";
import HistoryCard from "@components/HistoryCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WeatherResponse } from "./Weather";
import { TurbinePathResponse } from "./Router";

export interface MissionEntry {
  mission: string;
  weather: WeatherResponse;
  route: TurbinePathResponse;
}

const HISTORY_KEY = "missionHistory";
const MAX_HISTORY = 4;

export const saveDataToHistory = () => {
  const currentMissionStr = localStorage.getItem("missions");
  const currentWeatherStr = localStorage.getItem("weatherData");
  const currentDroneRouteStr = localStorage.getItem("drone_route");

  if (!currentMissionStr) {
    toast.warning("No mission data found. Please create a mission before saving.", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  
  if (!currentWeatherStr || !currentDroneRouteStr) {
    console.warn("Missing data for mission save");
    toast.warning("Incomplete data. Weather or route data is missing. Cannot save mission.", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  let currentMission: string;
  let currentWeather: WeatherResponse;
  let currentDroneRoute: TurbinePathResponse;
  try {
    currentMission = JSON.parse(currentMissionStr);
    currentWeather = JSON.parse(currentWeatherStr);
    currentDroneRoute = JSON.parse(currentDroneRouteStr);
  } catch (error) {
    console.error("Error parsing mission data:", error);
    toast.error("Error saving mission. Could not parse mission data. Please try again.", {
      position: "top-right",
      autoClose: 4000,
    });
    return;
  }

  const newEntry: MissionEntry = {
    mission: currentMission,
    weather: currentWeather,
    route: currentDroneRoute,
  };

  let history: MissionEntry[] = [];
  const historyStr = localStorage.getItem(HISTORY_KEY);
  if (historyStr) {
    try {
      history = JSON.parse(historyStr);
    } catch (error) {
      console.error("Error parsing history:", error);
    }
  }

  // Добавляем новую запись в начало массива
  history.unshift(newEntry);

  if (history.length > MAX_HISTORY) {
    history.pop(); // Удаляем последний элемент вместо первого
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  toast.success("Mission saved successfully!", {
    position: "top-right",
    autoClose: 1500,
  });
};

const History = () => {
  const [missions, setMissions] = useState<MissionEntry[]>([]);

  const loadHistory = () => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    if (historyStr) {
      try {
        const history: MissionEntry[] = JSON.parse(historyStr);
        setMissions(history);
        toast.info("History loaded. Previous missions have been loaded successfully.", {
          position: "top-right",
          autoClose: 1500,
        });
      } catch (error) {
        console.error("Error loading history:", error);
        toast.error("Error loading history. Something went wrong while reading history data.", {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } else {
      toast.info("No saved missions yet. You can save missions using 'Save to localStorage' in the app.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

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
      <main className="relative min-h-screen w-full bg-[#a2c8df] flex flex-col items-center justify-start pt-[109px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <HistoryCard missions={missions} />
      </main>
    </>
  );
};

export default History;
