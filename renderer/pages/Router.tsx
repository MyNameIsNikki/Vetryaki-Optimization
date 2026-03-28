import Navbar from "@components/NavBar";
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom Leaflet icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// TypeScript interfaces based on Pydantic models
export interface Turbine {
  id: number;
  lat: number;
  lon: number;
  z: number;
}

export interface PathPoint {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface TurbinePathResponse {
  turbines: Turbine[];
  path: PathPoint[];
  path_length_meters: number;
}

interface RouteRequest {
  kml_file: File | null;
  height: number;
  optimizer: string;
  start: number;
  num_ants?: number;
  max_iter: number;
  alpha: number;
  beta: number;
  rho?: number;
  q?: number;
  mutation_rate?: number;
  crossover_rate?: number;
  pop_size?: number;
  max_gen?: number;
  theta_max: number;
}

// Интерфейс для данных из БД
interface DBRouteRequest {
  mission_id: string;
  height: number;
  optimizer: string;
  start: number;
  num_ants?: number;
  max_iter: number;
  alpha: number;
  beta: number;
  rho?: number;
  q?: number;
  mutation_rate?: number;
  crossover_rate?: number;
  pop_size?: number;
  max_gen?: number;
  theta_max: number;
}

// Интерфейс для миссии из БД
interface Mission {
  mission_id: string;
  mission_type: string;
  drone_altitude: number;
  max_duration_min: number;
  wind_speed_max: number;
  precipitation_max: number;
  temperature_min: number;
  temperature_max: number;
  uav_model_id: string;
  mission_date: string;
  status: string;
}

// Интерфейс для турбины из БД
interface DBTurbine {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  hub_height: number;
  rotor_diameter: number;
  capacity_kw: number;
  manufacturer: string;
  priority: number;
  safe_distance_m: number;
  condition_status: string;
}

const Router = () => {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [formData, setFormData] = useState<RouteRequest>({
    kml_file: null,
    height: 90,
    optimizer: "aco",
    start: 0,
    num_ants: 50,
    max_iter: 200,
    alpha: 1.0,
    beta: 2.0,
    rho: 0.1,
    q: 100,
    mutation_rate: 0.1,
    crossover_rate: 0.8,
    pop_size: 50,
    max_gen: 200,
    theta_max: 180,
  });
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<TurbinePathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mission, setMission] = useState<string[] | null>(null);
  const [useDatabase, setUseDatabase] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);

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

  // Загрузка списка миссий из БД
  useEffect(() => {
    if (useDatabase) {
      fetchMissions();
    }
  }, [useDatabase]);

  const fetchMissions = async () => {
  setLoadingMissions(true);
  try {
    console.log("Fetching missions from http://127.0.0.1:8000/api/missions/list");
    const response = await fetch("http://127.0.0.1:8000/api/missions/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Missions data:", data);
    setAvailableMissions(data);
    
    if (data.length === 0) {
      toast.info(t("No missions found in database"));
    } else {
      toast.success(t(`Loaded ${data.length} missions`));
    }
  } catch (error) {
    console.error("Error fetching missions:", error);
    toast.error(t("Error fetching missions from database: ") + error.message);
    setAvailableMissions([]);
  } finally {
    setLoadingMissions(false);
  }
};

  const fetchTurbines = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/turbines");
      if (response.ok) {
        const data = await response.json();
        console.log("Turbines from DB:", data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching turbines:", error);
    }
    return [];
  };

  const hasValidMission = mission && mission.length > 0 && mission[0] !== "[]";

  // Load routeData from localStorage on mount
  useEffect(() => {
    const savedRoute = localStorage.getItem("drone_route");
    if (savedRoute) {
      try {
        const parsedRoute: TurbinePathResponse = JSON.parse(savedRoute);
        console.log("Loaded route from localStorage:", parsedRoute);
        setRouteData(parsedRoute);
        toast.success(t("Route loaded from localStorage"));
      } catch (err) {
        console.error("Error parsing localStorage route:", err);
        toast.error(t("Error parsing localStorage route"));
      }
    }
  }, []);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith(".kml")) {
      setError("Файл должен быть в формате .kml");
      setFormData({ ...formData, kml_file: null });
      toast.error(t("File must be in .kml format"));
      return;
    }
    setFormData({ ...formData, kml_file: file });
    setError(null);
    toast.success(t("KML file selected successfully"));
  };

  // Handle show settings
  const handleSettingsShow = () => {
    if (showSettings === false) {
      setShowSettings(true);
      toast.info(t("Settings opened"));
    } else {
      setShowSettings(false);
      toast.info(t("Settings closed"));
    }
  };

  const handleOptimizerSettings = useCallback(() => {
    setFormData((prev) => {
      const newFormData = { ...prev };
      if (prev.optimizer === "aco") {
        newFormData.num_ants = prev.num_ants ?? 50;
        newFormData.rho = prev.rho ?? 0.1;
        newFormData.q = prev.q ?? 100;
        delete newFormData.mutation_rate;
        delete newFormData.crossover_rate;
        delete newFormData.pop_size;
        delete newFormData.max_gen;
      } else if (prev.optimizer === "ga") {
        newFormData.mutation_rate = prev.mutation_rate ?? 0.1;
        newFormData.crossover_rate = prev.crossover_rate ?? 0.8;
        newFormData.pop_size = prev.pop_size ?? 50;
        newFormData.max_gen = prev.max_gen ?? 200;
        delete newFormData.num_ants;
        delete newFormData.rho;
        delete newFormData.q;
      }
      return newFormData;
    });
  }, [formData.optimizer]);

  useEffect(() => handleOptimizerSettings, [formData.optimizer]);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData({ ...formData, height: value });
  }, [formData]);

  const handleOptimizerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, optimizer: e.target.value });
    toast.info(t("Optimizer changed to") + ` ${e.target.value}`);
  }, [formData]);

  const updateForm = useCallback(<K extends keyof RouteRequest>(key: K, value: RouteRequest[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle form submission with database
  const handleSubmitWithDB = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with DB:", selectedMissionId);

    if (!selectedMissionId) {
      setError("Please select a mission.");
      toast.error(t("Please select a mission"));
      return;
    }

    setLoading(true);
    setError(null);
    setRouteData(null);
    toast.info(t("Starting route configuration from database"));

    try {
      const requestData: DBRouteRequest = {
        mission_id: selectedMissionId,
        height: parseInt(formData.height.toString(), 10),
        optimizer: formData.optimizer,
        start: parseInt(formData.start.toString(), 10),
        max_iter: parseInt(formData.max_iter.toString(), 10),
        alpha: parseFloat(formData.alpha.toString()),
        beta: parseFloat(formData.beta.toString()),
        theta_max: parseInt(formData.theta_max.toString(), 10),
      };

      if (formData.optimizer === "aco") {
        requestData.num_ants = parseInt(formData.num_ants!.toString(), 10);
        requestData.rho = parseFloat(formData.rho!.toString());
        requestData.q = parseInt(formData.q!.toString(), 10);
      } else if (formData.optimizer === "ga") {
        requestData.mutation_rate = parseFloat(formData.mutation_rate!.toString());
        requestData.crossover_rate = parseFloat(formData.crossover_rate!.toString());
        requestData.pop_size = parseInt(formData.pop_size!.toString(), 10);
        requestData.max_gen = parseInt(formData.max_gen!.toString(), 10);
      }

      // Создаем URL с параметрами запроса
      const params = new URLSearchParams();
      Object.entries(requestData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const endpoint = `http://127.0.0.1:8000/api/dronepath_from_mission?${params.toString()}`;
      console.log(`Sending request to ${endpoint}...`);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Response error text:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: TurbinePathResponse = await response.json();
      console.log("API Response:", data);
      setRouteData(data);
      toast.success(t("Route configured successfully from database"));
    } catch (err) {
      console.error("Error in sendRouteRequest:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please try again.");
      toast.error(t("Error configuring route: ") + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission with KML
  const handleSubmitWithKML = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with KML:", formData);

    if (!formData.kml_file) {
      setError("Please upload a valid KML file.");
      toast.error(t("Please upload a valid KML file"));
      return;
    }

    setLoading(true);
    setError(null);
    setRouteData(null);
    toast.info(t("Starting route configuration"));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.kml_file);

      console.log("Uploading file to http://127.0.0.1:8000/api/upload...");
      const uploadResponse = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`File upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      const filePath = uploadResult.file_path;
      console.log("File uploaded, path:", filePath);
      toast.success(t("KML file uploaded successfully"));

      const formDataToSend: any = {
        kml_file: filePath,
        height: parseInt(formData.height.toString(), 10),
        optimizer: formData.optimizer,
        start: parseInt(formData.start.toString(), 10),
        max_iter: parseInt(formData.max_iter.toString(), 10),
        alpha: parseFloat(formData.alpha.toString()),
        beta: parseFloat(formData.beta.toString()),
        theta_max: parseInt(formData.theta_max.toString(), 10),
      };

      if (formData.optimizer === "aco") {
        formDataToSend.num_ants = parseInt(formData.num_ants!.toString(), 10);
        formDataToSend.rho = parseFloat(formData.rho!.toString());
        formDataToSend.q = parseInt(formData.q!.toString(), 10);
      } else if (formData.optimizer === "ga") {
        formDataToSend.mutation_rate = parseFloat(formData.mutation_rate!.toString());
        formDataToSend.crossover_rate = parseFloat(formData.crossover_rate!.toString());
        formDataToSend.pop_size = parseInt(formData.pop_size!.toString(), 10);
        formDataToSend.max_gen = parseInt(formData.max_gen!.toString(), 10);
      }

      const endpoint = formData.optimizer === "aco" ? "http://127.0.0.1:8000/api/dronepath_aco" : "http://127.0.0.1:8000/api/dronepath_ga";
      console.log(`Sending request to ${endpoint}...`, formDataToSend);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSend),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Response error text:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: TurbinePathResponse = await response.json();
      console.log("API Response:", data);
      setRouteData(data);
      toast.success(t("Route configured successfully"));
    } catch (err) {
      console.error("Error in sendRouteRequest:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please try again.");
      toast.error(t("Error configuring route: ") + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    if (useDatabase) {
      handleSubmitWithDB(e);
    } else {
      handleSubmitWithKML(e);
    }
  }, [useDatabase, selectedMissionId, formData]);

  // Export routeData to JSON
  const handleExportJson = () => {
    if (!routeData) return;
    const jsonString = JSON.stringify(routeData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drone_route.json";
    a.click();
    URL.revokeObjectURL(url);
    console.log("Exported route to JSON");
    toast.success(t("Route exported to JSON"));
  };

  // Save routeData to localStorage
  const handleSaveToLocalStorage = () => {
    if (!routeData) return;
    localStorage.setItem("drone_route", JSON.stringify(routeData));
    console.log("Saved route to localStorage:", routeData);
    toast.success(t("Route saved to localStorage"));
  };

  // Clear form and map and stop optimizer
  const handleClear = () => {
    setFormData({ kml_file: null, height: 90, optimizer: "aco", start: 0, num_ants: 50, max_iter: 500, alpha: 1.0, beta: 2.0, rho: 0.1, q: 100, theta_max: 180 });
    setRouteData(null);
    setError(null);
    setSelectedMissionId("");
    localStorage.removeItem("drone_route");
    console.log("Cleared form");
    toast.info(t("Form and map cleared"));
  };

  // Calculate map center from turbines
  const getMapCenter = (): [number, number] => {
    if (!routeData?.turbines?.length) {
      console.log("No turbine data, using default center: [48.21, 40.31]");
      return [48.21, 40.31];
    }
    const lats = routeData.turbines.map((t) => t.lat);
    const lons = routeData.turbines.map((t) => t.lon);
    const center: [number, number] = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lons) + Math.max(...lons)) / 2];
    console.log("Calculated map center:", center);
    return center;
  };

  // Map path coordinates to lat/lon (using turbines as fallback for UTM x/y)
  const pathPositions = routeData?.turbines
    ? routeData.path.map((p) => {
        const turbine = routeData.turbines.find((t) => t.id === p.id);
        if (!turbine) {
          console.warn(`No turbine found for path point ID: ${p.id}`);
          return null;
        }
        return [turbine.lat, turbine.lon] as [number, number];
      }).filter((pos): pos is [number, number] => pos !== null)
    : [];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <Navbar />
      <main className="relative min-h-screen w-full bg-[#a2c8df] flex items-center justify-center pt-[100px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        <div className="text-white z-10 w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl flex">
          {/* Left: Form */}
          <div className="w-1/2 pr-4 flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">{t("Drone Route Configuration")}</h2>
            
            {/* Toggle between KML and Database */}
            <div className="flex mb-6 bg-white bg-opacity-20 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setUseDatabase(false)}
                className={`flex-1 py-2 rounded-lg transition-all duration-300 ${!useDatabase ? 'bg-blue-600 text-white' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
              >
                {t("Upload KML")}
              </button>
              <button
                type="button"
                onClick={() => setUseDatabase(true)}
                className={`flex-1 py-2 rounded-lg transition-all duration-300 ${useDatabase ? 'bg-blue-600 text-white' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
              >
                {t("From Database")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-8 flex-grow">
              {!useDatabase ? (
                // KML Upload Section
                <div className="flex flex-col">
                  <label htmlFor="kml_file" className="text-sm font-medium text-white mb-3">
                    {t("Upload KML File")}
                  </label>
                  <div className="relative">
                    <input
                      id="kml_file"
                      type="file"
                      accept=".kml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="kml_file"
                      className="flex items-center justify-between w-full p-4 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-40 cursor-pointer hover:bg-opacity-30 transition-all duration-300 shadow-sm"
                    >
                      <span className="text-white font-medium truncate max-w-[70%]">
                        {formData.kml_file ? formData.kml_file.name : t("Choose a KML file")}
                      </span>
                      <span className="text-white bg-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                        {t("Browse")}
                      </span>
                    </label>
                  </div>
                  <a
                    href="https://earth.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center w-full p-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-md"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012-2v-1a2 2 0 012-2h2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("Create KML in Google Earth")}
                  </a>
                </div>
              ) : (
                // Database Section
                <div className="flex flex-col space-y-4">
                  <label className="text-sm font-medium text-white mb-2">
                    {t("Select Mission")}
                  </label>
                  <select
                    value={selectedMissionId}
                    onChange={(e) => setSelectedMissionId(e.target.value)}
                    className="w-full p-4 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-40 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingMissions}
                  >
                    <option value="" className="bg-gray-800">-- {t("Select a mission")} --</option>
                    {availableMissions.map((mission) => (
                      <option key={mission.mission_id} value={mission.mission_id} className="bg-gray-800">
                        {mission.mission_id} - {mission.mission_type} ({mission.mission_date})
                      </option>
                    ))}
                  </select>
                  
                  {loadingMissions && (
                    <div className="text-center text-white">
                      {t("Loading missions...")}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={fetchMissions}
                    className="w-full p-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-all duration-300"
                  >
                    {t("Refresh Missions")}
                  </button>
                  
                  {selectedMissionId && (
                    <div className="mt-2 p-3 bg-white bg-opacity-10 rounded-xl">
                      <p className="text-sm text-white">
                        {t("Selected mission")}: <strong>{selectedMissionId}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleSettingsShow}
                className="w-full p-4 rounded-xl font-medium transition-all duration-300 shadow-md bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-md"
              >
                {t("Settings")}
              </button>

              {showSettings && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                  <div className="bg-gray-600 text-white rounded-2xl p-6 w-[550px] max-h-[90vh] overflow-y-auto shadow-xl border border-white border-opacity-20">
                    <h2 className="flex justify-center text-xl font-semibold mb-6">{t("Optimizer Settings")}</h2>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Common Fields */}
                      <div className="flex flex-col">
                        <label htmlFor="height" className="text-sm mb-2">{t("Flight Height (m)")}</label>
                        <input
                          id="height"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.height}
                          onChange={handleHeightChange}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-40 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter height"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="optimizer" className="text-sm mb-2">{t("Optimizer")}</label>
                        <select
                          id="optimizer"
                          value={formData.optimizer}
                          onChange={handleOptimizerChange}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-40 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="aco" className="bg-gray-800">ACO</option>
                          <option value="ga" className="bg-gray-800">Genetic</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm mb-2">{t("Max Iterations")}</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.max_iter}
                          onChange={(e) => updateForm("max_iter", parseInt(e.target.value))}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm mb-2">{t("Alpha")} (Float)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.alpha}
                          onChange={(e) => updateForm("alpha", parseFloat(e.target.value))}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm mb-2">{t("Beta")} (Float)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.beta}
                          onChange={(e) => updateForm("beta", parseFloat(e.target.value))}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm mb-2">{t("Theta Max (degree)")}</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData.theta_max}
                          onChange={(e) => updateForm("theta_max", parseInt(e.target.value))}
                          className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                        />
                      </div>

                      {/* ACO-Specific Fields */}
                      {formData.optimizer === "aco" && (
                        <>
                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Num Ants")}</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.num_ants}
                              onChange={(e) => updateForm("num_ants", parseInt(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Rho")} (Float)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.rho}
                              onChange={(e) => updateForm("rho", parseFloat(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Q")}</label>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={formData.q}
                              onChange={(e) => updateForm("q", parseInt(e.target.value))}
                              className="w-[500px] p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* GA-Specific Fields */}
                      {formData.optimizer === "ga" && (
                        <>
                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Mutation Rate")} (Float)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.mutation_rate}
                              onChange={(e) => updateForm("mutation_rate", parseFloat(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Crossover Rate")} (Float)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.crossover_rate}
                              onChange={(e) => updateForm("crossover_rate", parseFloat(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Population Size")}</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.pop_size}
                              onChange={(e) => updateForm("pop_size", parseInt(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm mb-2">{t("Max Generations")}</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.max_gen}
                              onChange={(e) => updateForm("max_gen", parseInt(e.target.value))}
                              className="p-3 bg-white bg-opacity-20 rounded-xl border text-white"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end mt-6 space-x-4">
                      <button
                        onClick={handleSettingsShow}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                      >
                        {t("Save")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between space-x-4">
                <button
                  type="submit"
                  disabled={loading || (useDatabase && !selectedMissionId) || (!useDatabase && !formData.kml_file)}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Configure Route")}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClear}
                  className="w-full p-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 shadow-md"
                >
                  {t("Clear")}
                </button>
              </div>

              {/* Export and Save Buttons */}
              <div className="flex flex-col space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    nav("/3dsetup");
                    toast.info(t("Navigating to 3D simulation"));
                  }}
                  className="w-full p-4 rounded-xl font-medium transition-all duration-300 shadow-md bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {t("Trajectory correction using 3D simulation")}
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={!routeData}
                  className={`w-full p-4 rounded-xl font-medium transition-all duration-300 shadow-md ${
                    routeData
                      ? "bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      : "bg-gray-600 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {t("Export JSON")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveToLocalStorage}
                  disabled={!routeData || !hasValidMission}
                  className={`w-full p-4 rounded-xl font-medium transition-all duration-300 shadow-md ${
                    routeData && hasValidMission
                      ? "bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      : "bg-gray-600 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {t("Save to LocalStorage")}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Map or Loading/Error/Placeholder */}
          <div className="w-1/2 pl-4 flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">{t("Drone Route Map")}</h2>

            <div className="flex-grow">
              {loading && (
                <div className="flex flex-col items-center justify-center h-[575px] bg-white bg-opacity-20 rounded-xl shadow-sm">
                  <svg
                    className="w-16 h-16 animate-spin text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6z"
                      fill="currentColor"
                    />
                  </svg>
                  <p className="mt-4 text-white text-lg font-medium text-center">
                    {t("Building route...")}
                  </p>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-center p-4 bg-white bg-opacity-20 rounded-xl shadow-sm h-[580px] flex items-center justify-center">
                  {error}
                </div>
              )}

              {!loading && !error && !routeData && (
                <div className="h-[575px] rounded-xl overflow-hidden shadow-md bg-white bg-opacity-10">
                  <img
                    src="./images/router/map-placeholder.png"
                    alt="Map placeholder"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {routeData && !loading && !error && (
                <div className="h-[575px] rounded-xl overflow-hidden shadow-md bg-white bg-opacity-10">
                  <MapContainer
                    center={getMapCenter()}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                    />
                    {routeData.turbines.map((turbine) => (
                      <Marker key={turbine.id} position={[turbine.lat, turbine.lon]} icon={customIcon}>
                        <Popup>
                          <div className="text-sm">
                            <p><strong>Turbine ID:</strong> {turbine.id}</p>
                            <p><strong>Latitude:</strong> {turbine.lat.toFixed(6)}</p>
                            <p><strong>Longitude:</strong> {turbine.lon.toFixed(6)}</p>
                            <p><strong>Height:</strong> {turbine.z} m</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {pathPositions.length > 0 && (
                      <Polyline
                        positions={pathPositions}
                        color="#2563eb"
                        weight={4}
                        opacity={0.8}
                        dashArray="10, 10"
                      >
                        <Tooltip permanent>
                          Path Length: {routeData.path_length_meters.toFixed(2)} meters
                        </Tooltip>
                      </Polyline>
                    )}
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Router;