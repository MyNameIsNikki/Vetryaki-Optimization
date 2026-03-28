import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import SceneInit from '../hooks/useSceneInit';
import { useRouteData } from '../hooks/useRouteData';
import { useModelLoad } from '../hooks/useModelLoad';
import { useWeatherData } from '../hooks/useWeatherData';
import { ToastContainer, toast } from "react-toastify";
import { div } from 'three/src/nodes/TSL.js';
import { useNavigate } from "react-router";
import { saveDataToHistory } from "../../pages/History";


// Вспомогательная функция для преобразования кода погоды в описание
const getWeatherDescription = (code) => {
  switch (code) {
    case 0: return 'Ясное небо';
    case 1: return 'В основном ясно';
    case 2: return 'Переменная облачность';
    case 3: return 'Пасмурно';
    case 45: return 'Туман';
    case 48: return 'Изморозь';
    case 51: return 'Легкий моросящий дождь';
    case 53: return 'Умеренный моросящий дождь';
    case 55: return 'Сильный моросящий дождь';
    case 56: return 'Ледяной моросящий дождь';
    case 57: return 'Сильный ледяной моросящий дождь';
    case 61: return 'Легкий дождь';
    case 63: return 'Умеренный дождь';
    case 65: return 'Сильный дождь';
    case 66: return 'Легкий ледяной дождь';
    case 67: return 'Сильный ледяной дождь';
    case 71: return 'Легкий снегопад';
    case 73: return 'Умеренный снегопад';
    case 75: return 'Сильный снегопад';
    case 77: return 'Снежные зерна';
    case 80: return 'Легкие ливневые дожди';
    case 81: return 'Умеренные ливневые дожди';
    case 82: return 'Сильные ливневые дожди';
    case 85: return 'Легкий ливневый снегопад';
    case 86: return 'Сильный ливневый снегопад';
    case 95: return 'Гроза';
    case 96: return 'Гроза с градом';
    case 99: return 'Сильная гроза с градом';
    default: return 'Неизвестно';
  }
};

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.597A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.006a1 1 0 10-.997 1.408 5.002 5.002 0 0013.003 1.513 1 1 0 101.408-.997 7.002 7.002 0 01-11.601-2.566z" clipRule="evenodd" />
  </svg>
);

const DroneCameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path d="M7 3a1 1 0 00-1 1v1a1 1 0 002 0V4a1 1 0 00-1-1zM9 4a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1zM11 4a1 1 0 00-1 1v1a1 1 0 002 0V5a1 1 0 00-1-1zM13 3a1 1 0 00-1 1v1a1 1 0 002 0V4a1 1 0 00-1-1z" />
    <path fillRule="evenodd" d="M9.9 2.152A1.996 1.996 0 008 4.091v2.113L7.75 6.75A.75.75 0 007 7.5v1.25c0 .414.336.75.75.75h1.75a.75.75 0 00.75-.75V7.5c0-.414-.336-.75-.75-.75L9 6.204V4.091c0-.445.408-.813.9-.785a.996 0 011.09.785v2.113l.25.546c.414.191.688.604.688 1.055v1.25a.75.75 0 01-.75.75h-1.75a.75.75 0 01-.75-.75V8.5c0-.414-.336-.75-.75-.75L8 7.204V4.091c0-.445.408-.813.9-.785zm-.008 1.831a.25.25 0 00-.242.242v1.403l.242.111a.25.25 0 00.242-.242V4.225a.25.25 0 00-.242-.242zM10.75 9c0-.414-.336-.75-.75-.75h-1.75a.75.75 0 00-.75.75v1.25c0 .414.336.75.75.75h1.75c.414 0 .75-.336.75-.75V9z" clipRule="evenodd" />
    <path d="M12.5 10.75a.75.75 0 00-.75-.75h-1.75a.75.75 0 00-.75.75v1.25c0 .414.336.75.75.75h1.75c.414 0 .75-.336.75-.75V10.75z" />
  </svg>
);

const FreeCameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586A2 2 0 0111.121 3.586L9.707 2.293A1 1 0 008.995 2H4zm8 11v-1a1 1 0 011-1h2V7h-4a1 1 0 00-1 1v4a1 1 0 011 1h2a1 1 0 011 1z" clipRule="evenodd" />
  </svg>
);

const FinishIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ height: '1.25rem', width: '1.25rem' }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const Simulation = () => {

  const nav = useNavigate();

  const { routeData, loading: routeLoading, error: routeError } = useRouteData();
  const { model: turbineModel, loading: modelLoading, error: modelError } = useModelLoad('/threejsSimulation/assets/wind_turbine/scene.gltf');
  const { model: droneModel, loading: droneModelLoading, error: droneModelError } = useModelLoad('/threejsSimulation/assets/drone/scene.gltf');

  const sceneRef = useRef(null);

  const [isSimulationReady, setIsSimulationReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCameraFollowing, setIsCameraFollowing] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  const [modalFinishMission, setModalFinisMission] = useState(false);
  const [missionNameInput, setMissionNameInput] = useState(''); 
  const [selectedMission, setSelectedMission] = useState(null);

  const showModalsave = () => {
    setModalFinisMission(!modalFinishMission);
  }

  useEffect(() => {
    try {
      const storedWeatherData = localStorage.getItem('weatherData');
      if (storedWeatherData) {
        setWeatherData(JSON.parse(storedWeatherData));
      }

      // Load selectedMission from localStorage on component mount
      const storedSelectedMission = localStorage.getItem('selectedMission');
      if (storedSelectedMission) {
        setSelectedMission(storedSelectedMission);
        // If there's an active mission, pre-fill the input if it's visible, or just display it.
        setMissionNameInput(storedSelectedMission); 
      }
    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (!sceneRef.current) {
      const mainScene = new SceneInit('threeJScanvas');
      mainScene.initialize();
      sceneRef.current = mainScene;

      const animate = () => {
        requestAnimationFrame(animate);
        if (sceneRef.current) {
          if (sceneRef.current.controls.enabled) {
            sceneRef.current.controls.update(); 
          }
          sceneRef.current.updateDronePosition();
          sceneRef.current.render();
        }
      };
      animate();
    }

    if (!routeLoading && !modelLoading && !droneModelLoading && routeData && turbineModel && droneModel) {
      if (!isSimulationReady) { 
        console.log("All data and models loaded. Initializing scene objects.");
        sceneRef.current.setSceneOrigin(routeData.turbines, routeData.path);
        sceneRef.current.addTurbinesWithOffset(routeData.turbines, turbineModel);
        sceneRef.current.addDrone(droneModel, routeData.path, routeData.turbines);
        
        setIsSimulationReady(true);
        setIsCameraFollowing(sceneRef.current.followDroneCamera);
      }
    }

    if (routeError) {
      console.error('Failed to load route data:', routeError);
      alert('Failed to load route data: ' + routeError.message);
    }
    if (modelError) {
      console.error('Failed to load turbine model:', modelError);
      alert('Failed to load turbine model: ' + modelError.message);
    }
    if (droneModelError) {
      console.error('Failed to load drone model:', droneModelError);
      alert('Failed to load drone model: ' + droneModelError.message);
    }

  }, [routeData, turbineModel, droneModel, routeLoading, modelLoading, droneModelLoading, routeError, modelError, droneModelError, isSimulationReady]);

  const handleStart = useCallback(() => {
    if (sceneRef.current && isSimulationReady) {
      sceneRef.current.startAnimation();
      setIsPlaying(true);
    }
  }, [isSimulationReady]);

  const handlePause = useCallback(() => {
    if (sceneRef.current && isSimulationReady) {
      sceneRef.current.pauseAnimation();
      setIsPlaying(false);
    }
  }, [isSimulationReady]);

  const handleReset = useCallback(() => {
    if (sceneRef.current && isSimulationReady) {
      sceneRef.current.resetDronePosition();
      setIsPlaying(false);
    }
  }, [isSimulationReady]);

  const handleToggleCamera = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.toggleCameraMode();
      setIsCameraFollowing(sceneRef.current.followDroneCamera);
    }
  }, []);

  const handleFinishTask = useCallback(() => {
    showModalsave();
  }, []);

  const totalPathLengthKm = routeData ? (routeData.path_length_meters / 1000).toFixed(2) : 'N/A';
  const numberOfTurbines = routeData ? routeData.turbines.length : 'N/A';
  const weatherDescription = weatherData?.current_weather ? getWeatherDescription(weatherData.current_weather.weather_code) : 'Загрузка...';


  const handleSaveAndClearMission = useCallback(() => {
    let missionNameToSave;

    // Determine mission name based on whether there's an active mission
    if (selectedMission) {
      missionNameToSave = selectedMission; // Use the active mission name
    } else {
      missionNameToSave = missionNameInput.trim(); // Use the user-entered name
    }

    if (!missionNameToSave) {
      toast.error("Пожалуйста, введите название миссии.", { position: "top-right", autoClose: 2000 });
      return;
    }

    const historyData = {
      missionName: missionNameToSave,
      date: new Date().toLocaleString(),
      pathLength: totalPathLengthKm,
      turbinesCount: numberOfTurbines,
      weather: weatherData ? {
        temperature: weatherData.current_weather.temperature,
        windSpeed: weatherData.current_weather.wind_speed,
        windDirection: weatherData.current_weather.wind_direction,
        description: weatherDescription,
        location: weatherData.location.name
      } : null,
      routeData: routeData 
    };

    saveDataToHistory(historyData); 

    localStorage.removeItem("weatherData");
    localStorage.removeItem("drone_route");
    localStorage.removeItem("missions")
    localStorage.removeItem("selectedMission"); // Always clear selectedMission after it's finished
    setSelectedMission(null); // Update state as well

    toast.success(`Миссия "${missionNameToSave}" завершена и сохранена!`, {
      position: "top-right",
      autoClose: 2000,
    });

    nav("/");
  }, [missionNameInput, selectedMission, routeData, weatherData, totalPathLengthKm, numberOfTurbines, weatherDescription, nav]);

  const handleExitWithoutSaving = useCallback(() => {
    setSelectedMission(null); // Update state
    toast.info("Миссия завершена без сохранения.", {
      position: "top-right",
      autoClose: 2000,
    });
    nav("/");
  }, [nav]);


  return (
    <>
      <canvas id="threeJScanvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}></canvas>

      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(26, 32, 44, 0.7)',
        backdropFilter: 'blur(8px)',
        padding: '16px', // p-4
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
        color: '#E2E8F0',
        borderTop: '1px solid rgba(75, 85, 99, 0.5)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          
          {/* Панель управления симуляцией */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(75, 85, 99, 0.4)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#CBD5E0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Симуляция</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleStart} 
                disabled={!isSimulationReady || isPlaying}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#4A5568',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease-in-out',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#64748B')} // hover:bg-gray-600
                onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4A5568')}
                disabledStyle={{ backgroundColor: '#1F2937', color: '#6B7280', cursor: 'not-allowed' }} // disabled:bg-gray-800 disabled:text-gray-500
              >
                <PlayIcon />
                <span style={{ marginLeft: '4px' }}>Старт</span>
              </button>
              <button 
                onClick={handlePause} 
                disabled={!isSimulationReady || !isPlaying}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#4A5568',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease-in-out',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#64748B')}
                onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4A5568')}
                disabledStyle={{ backgroundColor: '#1F2937', color: '#6B7280', cursor: 'not-allowed' }}
              >
                <PauseIcon />
                <span style={{ marginLeft: '4px' }}>Пауза</span>
              </button>
            </div>
              <button 
                onClick={handleReset} 
                disabled={!isSimulationReady}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 65px',
                  backgroundColor: '#4A5568',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease-in-out',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  'marginTop': '10px' // Use camelCase for inline style properties
                }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#64748B')}
                onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4A5568')}
                disabledStyle={{ backgroundColor: '#1F2937', color: '#6B7280', cursor: 'not-allowed' }}
              >
                <ResetIcon />
                <span style={{ marginLeft: '4px' }}>Сброс</span>
              </button>
          </div>

          {/* Настройки камеры */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(75, 85, 99, 0.4)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#CBD5E0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Камера</h3>
            <button 
              onClick={handleToggleCamera} 
              disabled={!isSimulationReady}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                backgroundColor: '#4A5568',
                color: 'white',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease-in-out',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#64748B')}
              onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4A5568')}
              disabledStyle={{ backgroundColor: '#1F2937', color: '#6B7280', cursor: 'not-allowed' }}
            >
              {isCameraFollowing ? (
                <>
                  <FreeCameraIcon />
                  <span style={{ marginLeft: '4px' }}>Свободная камера</span>
                </>
              ) : (
                <>
                  <DroneCameraIcon />
                  <span style={{ marginLeft: '4px' }}>Камера дрона</span>
                </>
              )}
            </button>
          </div>

          {/* Информация о маршруте */}
          {routeData && (
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(75, 85, 99, 0.4)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#CBD5E0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Маршрут</h3>
              <p style={{ fontSize: '0.75rem', color: '#CBD5E0' }}>Длина: <span style={{ fontWeight: '500', color: 'white' }}>{totalPathLengthKm} км</span></p>
              <p style={{ fontSize: '0.75rem', color: '#CBD5E0' }}>Турбин: <span style={{ fontWeight: '500', color: 'white' }}>{numberOfTurbines}</span></p>
            </div>
          )}

          {/* Информация о погоде */}
          {weatherData && weatherData.current_weather && (
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(75, 85, 99, 0.4)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#CBD5E0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Погода ({weatherData.location.name})</h3>
              <p style={{ fontSize: '0.75rem', color: '#CBD5E0' }}>Температура: <span style={{ fontWeight: '500', color: 'white' }}>{weatherData.current_weather.temperature}°C</span></p>
              <p style={{ fontSize: '0.75rem', color: '#CBD5E0' }}>Ветер: <span style={{ fontWeight: '500', color: 'white' }}>{weatherData.current_weather.wind_speed} м/с, {weatherData.current_weather.wind_direction}°</span></p>
              <p style={{ fontSize: '0.75rem', color: '#CBD5E0' }}>Условия: <span style={{ fontWeight: '500', color: 'white' }}>{weatherDescription}</span></p>
            </div>
          )}

          {/* Кнопка завершения задания */}
          <div style={{ paddingTop: '4px' }}>
            <button 
              onClick={handleFinishTask} 
              disabled={!isSimulationReady}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                backgroundColor: '#ff2727ff', // Например, синяя кнопка для "Завершить"
                color: 'white',
                fontWeight: '500',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease-in-out',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                height: '110px'
              }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#ca3838ff')}
              onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#e54646ff')}
              disabledStyle={{ backgroundColor: '#1F2937', color: '#6B7280', cursor: 'not-allowed' }}
            >
              <FinishIcon />
              <span style={{ marginLeft: '8px' }}>Завершить задание</span>
            </button>
          </div>

          {modalFinishMission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(75, 85, 99, 0.5)] backdrop-blur-sm">
              <div className="bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                
                <div className="mb-4">
                  {selectedMission ? (
                    <>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Завершение активной миссии:
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 font-semibold">
                        {selectedMission}
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor="missionName" className="block text-sm font-medium text-gray-200 mb-2">
                        Введите название новой миссии для сохранения результата:
                      </label>
                      <input
                        type="text"
                        name='missionName'
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Название миссии..."
                        id="missionName"
                        value={missionNameInput}
                        onChange={(e) => setMissionNameInput(e.target.value)}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    onClick={() => showModalsave()}
                  >
                    Отмена
                  </button>
                  
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-[#4A5568] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={handleSaveAndClearMission}
                  >
                    Сохранить результат
                  </button>
                  
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={handleExitWithoutSaving}
                  >
                    Выйти без сохранения
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Загрузочный оверлей */}
          {(routeLoading || modelLoading || droneModelLoading || !isSimulationReady) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(26, 32, 44, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Загрузка симуляции...
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Simulation;