import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class SceneInit {
  constructor(canvasId) {
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.controls = undefined;

    this.fov = 45;
    this.nearPlane = 1;
    this.farPlane = 50000;

    this.canvasId = canvasId;

    this.clock = new THREE.Clock();
    this.ambientLight = undefined;
    this.directionalLight = undefined;

    this.droneMixer = undefined;
    this.droneModel = undefined;
    this.dronePath = [];
    this.currentPathPointIndex = 0;
    this.animationSpeed = 80;
    this.isPaused = true;

    this.droneState = 'FOLLOW_PATH';
    this.orbitingTurbine = null;
    this.orbitPath = [];
    this.currentOrbitPointIndex = 0;
    this.orbitRadius = 40;

    this.orbitHeightOffset = -10;

    this.orbitSpeed = 60;
    this.approachOrbitSpeed = 50;

    this.sceneOffsetX = 0; // Глобальный X-координат первой точки пути
    this.sceneOffsetY = 0; // Глобальный Y-координат первой точки пути (THREE.js Z)
    this.sceneOffsetZ = 0; // Глобальный Z-координат первой точки пути (THREE.js Y, высота)

    this.turbinesGroup = new THREE.Group();

    this.droneIsLoaded = false;
    this.turbinesAreLoaded = false;

    this.allTurbinesPositions = [];
    this.modelTurbineBaseHeight = 0;
    this.modelTurbineOverallHeight = 0;

    this.followDroneCamera = true;
    this.droneCameraControls = undefined;

    this.turbineLabels = [];
    this.turbineOrbitOrderMap = new Map();

    this.lastOrbitedTurbineId = null;

    // --- Добавляем для визуализации пути и орбиты (для отладки) ---
/*     this.pathLine = undefined;
    this.orbitPathLine = undefined; */
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      this.nearPlane,
      this.farPlane
    );
    this.camera.position.set(0, 300, 800);

    const canvas = document.getElementById(this.canvasId);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 10000;
    this.controls.enabled = !this.followDroneCamera;

    this.droneCameraControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.droneCameraControls.enableDamping = true;
    this.droneCameraControls.dampingFactor = 0.05;
    this.droneCameraControls.minDistance = 1;
    this.droneCameraControls.maxDistance = 500;
    this.droneCameraControls.enabled = this.followDroneCamera;

    // --- Lighting ---
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.directionalLight.position.set(500, 1000, 500);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 4096;
    this.directionalLight.shadow.mapSize.height = 4096;
    this.directionalLight.shadow.camera.near = 1;
    this.directionalLight.shadow.camera.far = 4000;
    this.directionalLight.shadow.camera.left = -2500;
    this.directionalLight.shadow.camera.right = 2500;
    this.directionalLight.shadow.camera.top = 2500;
    this.directionalLight.shadow.camera.bottom = -2500;
    this.scene.add(this.directionalLight);

    // --- Ground ---
    const groundGeometry = new THREE.PlaneGeometry(30000, 30000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8F9460 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // --- Sky ---
    this.scene.background = new THREE.Color(0x87CEEB);

    this.scene.add(this.turbinesGroup);

    window.addEventListener('resize', () => this.onWindowResize());

    window.addEventListener('keydown', (event) => {
      if (event.key === 'c' || event.key === 'C') {
        this.toggleCameraMode();
      }
    });
    
/*     this.pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00ff00 }));
    this.scene.add(this.pathLine);

    this.orbitPathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff0000 }));
    this.orbitPathLine.visible = false; // По умолчанию скрыта
    this.scene.add(this.orbitPathLine); */
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  toggleCameraMode() {
    this.followDroneCamera = !this.followDroneCamera;
    this.controls.enabled = !this.followDroneCamera;
    this.droneCameraControls.enabled = this.followDroneCamera;

    if (!this.followDroneCamera) {
      if (this.droneModel) {
        this.camera.position.set(
          this.droneModel.position.x + 150,
          this.droneModel.position.y + 150,
          this.droneModel.position.z + 150
        );
        this.controls.target.copy(this.droneModel.position);
      }
      this.controls.update();
    } else {
      if (this.droneModel) {
        this.droneCameraControls.target.copy(this.droneModel.position);
        const offset = new THREE.Vector3(-30, 15, -30);
        offset.applyQuaternion(this.droneModel.quaternion);
        this.camera.position.copy(this.droneModel.position).add(offset);
        this.camera.lookAt(this.droneModel.position);
      } else {
        this.droneCameraControls.target.set(0, 0, 0);
      }
      this.droneCameraControls.update();
    }
    console.log(`[SceneInit] Camera mode toggled. followDroneCamera: ${this.followDroneCamera}`);
  }

  _latLonToMeters(lat, lon, originLat, originLon) {
    const R = 6378137; // Радиус Земли в метрах
    const x = R * (lon - originLon) * Math.PI / 180 * Math.cos(originLat * Math.PI / 180);
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) - R * Math.log(Math.tan(Math.PI / 4 + (originLat * Math.PI / 180) / 2));
    return { x: x, y: y };
  }

  setSceneOrigin(turbinesData, pathData) {
    if (!pathData || pathData.length === 0 || !turbinesData || turbinesData.length === 0) {
      console.warn("[SceneInit] Missing path or turbine data to set scene origin.");
      return;
    }

    // Используем первую точку пути как основной GLOBAL REFERENCE для всей сцены.
    // Это будет (0,0,0) в нашей THREE.js системе координат.
    this.sceneOffsetX = pathData[0].x; // Глобальный X (метры)
    this.sceneOffsetY = pathData[0].y; // Глобальный Y (метры, будет Z в THREE.js)
    this.sceneOffsetZ = pathData[0].z; // Глобальный Z (высота, будет Y в THREE.js)

    console.log(`[SceneInit] Scene origin (global reference, pathData[0]): X=${this.sceneOffsetX}, Y=${this.sceneOffsetY}, Z=${this.sceneOffsetZ}`);
    console.log(`[SceneInit] THREE.js origin will be at (0,0,0) relative to these global values.`);
  }

  addTurbinesWithOffset(turbinesData, turbineModel) {
    if (!turbinesData || !turbineModel) {
      console.warn("[SceneInit] Missing turbine data or model, cannot add turbines.");
      return;
    }

    this.turbinesGroup.clear();
    this.allTurbinesPositions = [];
    this.turbineLabels.forEach(label => this.scene.remove(label));
    this.turbineLabels = [];
    this.turbineOrbitOrderMap.clear();
    const boundingBox = new THREE.Box3();

    let turbineBBox = new THREE.Box3().setFromObject(turbineModel.scene);
    let turbineSize = new THREE.Vector3();
    turbineBBox.getSize(turbineSize);
    this.modelTurbineOverallHeight = turbineSize.y;
    this.modelTurbineBaseHeight = turbineBBox.min.y;

    console.log(`[SceneInit] Raw Turbine Model Dimensions (scale 1): Height=${this.modelTurbineOverallHeight.toFixed(2)}, Base Y=${this.modelTurbineBaseHeight.toFixed(2)}`);

    const originLatForTurbines = turbinesData[0].lat;
    const originLonForTurbines = turbinesData[0].lon;

    const turbine0Meters = this._latLonToMeters(turbinesData[0].lat, turbinesData[0].lon, originLatForTurbines, originLonForTurbines);
    const path0LocalX = 0; // pathData[0].x - this.sceneOffsetX; это 0
    const path0LocalZ = 0; // pathData[0].y - this.sceneOffsetY; это 0

    turbinesData.forEach((turbine) => {
      const turbineMeters = this._latLonToMeters(turbine.lat, turbine.lon, originLatForTurbines, originLonForTurbines);

      // XZ координаты в THREE.js, смещенные относительно нашей сцены (0,0,0)
      const turbineThreeX = (turbineMeters.x - turbine0Meters.x) + path0LocalX;
      const turbineThreeZ = (turbineMeters.y - turbine0Meters.y) + path0LocalZ;

      const turbineY = 0; // Основание турбины на уровне земли (THREE.js Y = 0)

      const turbineInstance = turbineModel.scene.clone();
      turbineInstance.position.set(turbineThreeX, turbineY, turbineThreeZ);
      turbineInstance.scale.set(3, 3, 3);

      turbineInstance.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.turbinesGroup.add(turbineInstance);
      boundingBox.expandByPoint(turbineInstance.position);
      this.allTurbinesPositions.push({
        id: turbine.id,
        position: turbineInstance.position.clone(),
        originalData: turbine,
        scaledHeight: this.modelTurbineOverallHeight * turbineInstance.scale.y
      });
      console.log(`[SceneInit] Added turbine ${turbine.id} at Three.js position: (${turbineThreeX.toFixed(2)}, ${turbineY.toFixed(2)}, ${turbineThreeZ.toFixed(2)}). Original Z data: ${turbine.z}. Actual scaled height: ${(this.modelTurbineOverallHeight * turbineInstance.scale.y).toFixed(2)}`);
    });

    this.scene.add(this.turbinesGroup);
    this.turbinesAreLoaded = true;
    this.fitCameraToBoundingBox(boundingBox);
    console.log("[SceneInit] Turbines loaded and positioned.");
  }

  addTurbineLabels() {
      this.turbineLabels.forEach(label => this.scene.remove(label));
      this.turbineLabels = [];

      this.allTurbinesPositions.forEach((turbineInfo) => {
          const orbitNumber = this.turbineOrbitOrderMap.get(turbineInfo.id);

          if (orbitNumber !== undefined) {
              const labelText = `${orbitNumber}`;

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              const fontSize = 64; // Размер шрифта для canvas
              context.font = `bold ${fontSize}px Arial`;
              context.fillStyle = 'white'; // Белый цвет текста
              context.textAlign = 'center';
              context.textBaseline = 'middle';

              const textMetrics = context.measureText(labelText);
              const textWidth = textMetrics.width;
              const textHeight = fontSize;

              canvas.width = textWidth + fontSize;
              canvas.height = textHeight + fontSize / 2;

              context.font = `bold ${fontSize}px Arial`;
              context.fillStyle = 'white';
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.clearRect(0, 0, canvas.width, canvas.height);
              context.fillText(labelText, canvas.width / 2, canvas.height / 2);

              const texture = new THREE.CanvasTexture(canvas);
              texture.needsUpdate = true;
              const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
              const sprite = new THREE.Sprite(material);

              const turbineTopHeight = turbineInfo.position.y + turbineInfo.scaledHeight;
              sprite.position.copy(turbineInfo.position);
              sprite.position.y = turbineTopHeight + 50; // Чуть выше верхушки турбины

              const spriteHeight = 50;
              const aspectRatio = canvas.width / canvas.height;
              sprite.scale.set(spriteHeight * aspectRatio, spriteHeight, 1);

              this.scene.add(sprite);
              this.turbineLabels.push(sprite);
          }
      });
      console.log(`[SceneInit] Added ${this.turbineLabels.length} turbine labels based on orbit order.`);
  }


  // В SceneInit.js, метод addDrone
  addDrone(droneModel, pathData, turbinesData) {
    if (!droneModel || !pathData || pathData.length === 0) return;

    this.droneModel = droneModel.scene;
    this.droneModel.scale.set(3, 3, 3);
    this.droneModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    const DRONE_FLIGHT_HEIGHT = 50;

    // Смещаем preStartPoint еще дальше от первой точки пути,
    // чтобы дрон не был слишком близко к первой турбине при старте
    const firstPathPointLocal = new THREE.Vector3(
        pathData[0].x - this.sceneOffsetX,
        pathData[0].z - this.sceneOffsetZ + DRONE_FLIGHT_HEIGHT,
        pathData[0].y - this.sceneOffsetY
    );
    const startOffset = new THREE.Vector3(-200, 100, -200); // Увеличиваем отступ
    const preStartPoint = firstPathPointLocal.clone().add(startOffset);

    this.dronePath = [{
        point: preStartPoint,
        targetTurbineId: null // Начальная точка - это просто точка для старта
    }];

    let orbitOrderCounter = 1;

    pathData.forEach(pointData => {
        const transformedPoint = new THREE.Vector3(
            pointData.x - this.sceneOffsetX,
            pointData.z - this.sceneOffsetZ + DRONE_FLIGHT_HEIGHT,
            pointData.y - this.sceneOffsetY
        );

        const targetTurbine = this.allTurbinesPositions.find(t => t.id === pointData.id);

        if (targetTurbine) { // Только если есть связанная турбина
            // Добавляем точку пути, связанную с турбиной, только если это не престартовая точка
            if (this.dronePath.length > 0 && this.dronePath[0].targetTurbineId === null && pointData.id === pathData[0].id) {
                 // Если первая точка пути - это уже турбина, и мы добавили preStartPoint,
                 // то эта точка pathData[0] будет первой реальной целью после preStartPoint
                 // Но нам важно, чтобы currentPathPointIndex указывал на нее после preStartPoint
            }
            if (!this.turbineOrbitOrderMap.has(targetTurbine.id)) {
                this.turbineOrbitOrderMap.set(targetTurbine.id, orbitOrderCounter++);
                console.log(`[SceneInit] Turbine ${targetTurbine.id} assigned orbit order: ${this.turbineOrbitOrderMap.get(targetTurbine.id)}`);
            }
        }
        
        this.dronePath.push({
            point: transformedPoint,
            targetTurbineId: targetTurbine ? targetTurbine.id : null
        });
    });

    if (this.dronePath.length > 0) {
      this.droneModel.position.copy(this.dronePath[0].point);
    }
    this.scene.add(this.droneModel);

    if (droneModel.animations && droneModel.animations.length > 0) {
      this.droneMixer = new THREE.AnimationMixer(this.droneModel);
      const action = this.droneMixer.clipAction(droneModel.animations[0]);
      action.play();
    }

    // --- Обновляем визуализацию пути ---
    const pathPointsForLine = this.dronePath.map(p => p.point);
/*     this.pathLine.geometry.setFromPoints(pathPointsForLine);
    this.pathLine.visible = true; */


    this.droneIsLoaded = true;
    this.resetDronePosition();
    this.addTurbineLabels(); // Добавляем метки после того, как определен порядок облета
    console.log("[SceneInit] Drone loaded and path transformed.");
  }

  fitCameraToBoundingBox(boundingBox) {
    // ... (без изменений, эта логика работает)
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = (this.fov * Math.PI) / 180;
    const distance = maxDim / (2 * Math.tan(fovRad / 2)) * 2;

    this.camera.position.set(center.x, center.y + distance / 2, center.z + distance);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
    console.log(`[SceneInit] Camera fitted to bounding box. Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}), Distance: ${distance.toFixed(2)}`);
  }

  updateDronePosition() {
      if (this.isPaused || !this.droneModel || this.dronePath.length === 0) return;

      const delta = this.clock.getDelta();

      if (this.droneMixer) {
          this.droneMixer.update(delta);
      }

      if (this.droneState === 'ORBITING') {
          this.performOrbit(delta);
      } else if (this.droneState === 'APPROACHING_ORBIT') {
          this.approachOrbit(delta);
      } else { // FOLLOW_PATH
          if (this.currentPathPointIndex >= this.dronePath.length - 1) {
              console.log("[SceneInit] Drone reached end of path.");
              this.currentPathPointIndex = this.dronePath.length - 1;
              this.pauseAnimation();
              return;
          }

          const currentPathPointData = this.dronePath[this.currentPathPointIndex];
          const nextPathPointData = this.dronePath[this.currentPathPointIndex + 1];

          const targetPosition = nextPathPointData.point;
          const distanceToTarget = this.droneModel.position.distanceTo(targetPosition);
          const moveDistance = this.animationSpeed * delta;

          // --- ЛОГИКА ТРИГГЕРА ОБЛЕТА ---
          // Если следующая точка пути связана с турбиной И это еще не облетеная турбина
          if (nextPathPointData.targetTurbineId !== null && this.lastOrbitedTurbineId !== nextPathPointData.targetTurbineId) {
              const turbineToOrbit = this.allTurbinesPositions.find(t => t.id === nextPathPointData.targetTurbineId);
              if (turbineToOrbit) {
                  // Если дрон достаточно близко к точке, чтобы начать подход к орбите
                  // Можно использовать distanceToTarget или расстояние до самой турбины.
                  // Давайте попробуем расстояние до турбины.
                  const dronePosXZ = new THREE.Vector2(this.droneModel.position.x, this.droneModel.position.z);
                  const turbinePosXZ = new THREE.Vector2(turbineToOrbit.position.x, turbineToOrbit.position.z);
                  const distanceToTurbineCenterXZ = dronePosXZ.distanceTo(turbinePosXZ);

                  // Если дрон в пределах 1.5 * radius от центра турбины (по XZ)
                  // ИЛИ если он уже прошел следующую точку пути, но не начал облет (чтобы не проскочить)
                  if (distanceToTurbineCenterXZ < (this.orbitRadius * 1.5) || distanceToTarget < moveDistance) {
                      console.log(`[SceneInit] Approaching path point for turbine ${turbineToOrbit.id}, starting approach to orbit.`);
                      this.startApproachToOrbit(turbineToOrbit);
                      return; // Важно: не продолжаем движение по пути, переходим в режим облета
                  }
              }
          }

          // Если не начали облет, двигаемся по пути
          if (distanceToTarget > moveDistance) {
              const direction = targetPosition.clone().sub(this.droneModel.position).normalize();
              this.droneModel.position.add(direction.multiplyScalar(moveDistance));
          } else {
              // Достигли следующей точки на пути
              this.droneModel.position.copy(targetPosition);
              this.currentPathPointIndex++; // Переходим к следующей точке

              // Если только что достигнутая точка пути была связана с турбиной,
              // но облет не был запущен (например, из-за lastOrbitedTurbineId),
              // то теперь мы должны убедиться, что currentPathPointIndex указывает на следующую *действительную* точку.
              // ЭТО ОЧЕНЬ ВАЖНЫЙ МОМЕНТ, если после облета мы попадаем сюда.
              // Но в идеале, после облета, currentPathPointIndex уже будет скорректирован в performOrbit.
              // Поэтому, эту часть логики лучше не усложнять здесь, а доверять performOrbit.

              if (this.currentPathPointIndex >= this.dronePath.length) {
                  console.log("[SceneInit] Drone reached end of path.");
                  this.currentPathPointIndex = this.dronePath.length - 1;
                  this.pauseAnimation();
                  return;
              }
          }

          // Поворачиваем дрон в сторону следующей точки
          const lookAtTarget = targetPosition.clone();
          lookAtTarget.y = this.droneModel.position.y;
          this.droneModel.lookAt(lookAtTarget);
      }

      this.updateCamera();
  }

  startApproachToOrbit(turbineInfo) {
      this.droneState = 'APPROACHING_ORBIT';
      this.orbitingTurbine = turbineInfo;
      this.currentOrbitPointIndex = 0;

      // Правильная высота облета: высота турбины + offset
      const turbineTopHeight = turbineInfo.position.y + turbineInfo.scaledHeight + this.orbitHeightOffset;
      const orbitCenter = turbineInfo.position.clone();
      orbitCenter.y = turbineTopHeight; // Центр орбиты по Y - это желаемая высота облета

      const dronePosXZ = new THREE.Vector2(this.droneModel.position.x, this.droneModel.position.z);
      const turbinePosXZ = new THREE.Vector2(orbitCenter.x, orbitCenter.z);
      const directionToDrone = dronePosXZ.sub(turbinePosXZ).normalize();

      const firstOrbitPoint = new THREE.Vector3(
          orbitCenter.x + directionToDrone.x * this.orbitRadius,
          turbineTopHeight, // Дрон сразу поднимается/опускается на высоту орбиты
          orbitCenter.z + directionToDrone.y * this.orbitRadius
      );

      this.orbitPath = [];
      const numSegments = 60;
      let startAngle = Math.atan2(firstOrbitPoint.z - orbitCenter.z, firstOrbitPoint.x - orbitCenter.x);

      for (let i = 0; i <= numSegments; i++) {
          const angle = startAngle + (Math.PI * 2 / numSegments) * i;
          const x = orbitCenter.x + this.orbitRadius * Math.cos(angle);
          const z = orbitCenter.z + this.orbitRadius * Math.sin(angle);
          this.orbitPath.push(new THREE.Vector3(x, turbineTopHeight, z));
      }

/*       // --- Обновляем визуализацию орбиты ---
      this.orbitPathLine.geometry.setFromPoints(this.orbitPath);
      this.orbitPathLine.visible = true; */

      console.log(`[SceneInit] Preparing to approach orbit for turbine ${turbineInfo.id} at height ${turbineTopHeight.toFixed(2)}. First orbit point: (${firstOrbitPoint.x.toFixed(2)}, ${firstOrbitPoint.y.toFixed(2)}, ${firstOrbitPoint.z.toFixed(2)})`);
  }

  approachOrbit(delta) {
      if (!this.orbitingTurbine || this.orbitPath.length === 0) {
          this.transitionToFollowPath();
          console.warn("[SceneInit] Orbit path is empty during approach, returning to FOLLOW_PATH.");
          return;
      }

      const targetPoint = this.orbitPath[0];
      const distanceToTarget = this.droneModel.position.distanceTo(targetPoint);
      const moveDistance = this.approachOrbitSpeed * delta;

      if (distanceToTarget > moveDistance) {
          const direction = targetPoint.clone().sub(this.droneModel.position).normalize();
          this.droneModel.position.add(direction.multiplyScalar(moveDistance));
          this.droneModel.lookAt(targetPoint);
      } else {
          this.droneModel.position.copy(targetPoint);
          this.droneState = 'ORBITING';
          this.currentOrbitPointIndex = 0;
          console.log(`[SceneInit] Drone reached orbit start for turbine ${this.orbitingTurbine.id}, now orbiting.`);
      }

      this.updateCamera();
  }

  performOrbit(delta) {
      if (!this.orbitingTurbine || this.orbitPath.length === 0) {
          console.warn("[SceneInit] Orbit path is empty during orbit, returning to FOLLOW_PATH.");
          this.transitionToFollowPath();
          return;
      }

      let nextOrbitPointIndex = this.currentOrbitPointIndex + 1;
      let nextOrbitPoint;

      if (nextOrbitPointIndex < this.orbitPath.length) {
          nextOrbitPoint = this.orbitPath[nextOrbitPointIndex];
      } else {
          // Завершили полный круг облёта
          console.log(`[SceneInit] Drone finished orbiting turbine ${this.orbitingTurbine.id}. Resuming path.`);
          this.lastOrbitedTurbineId = this.orbitingTurbine.id; // Запоминаем ID облетеной турбины

          // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
          // Ищем следующую точку в dronePath, которая не является текущей облетаемой турбиной
          // Это гарантирует, что мы не вернемся к "точке входа" в облет
          let nextMainPathPointFound = false;
          for (let i = this.currentPathPointIndex; i < this.dronePath.length; i++) {
              if (this.dronePath[i].targetTurbineId !== this.orbitingTurbine.id) {
                  this.currentPathPointIndex = i;
                  nextMainPathPointFound = true;
                  break;
              }
          }
          if (!nextMainPathPointFound) {
              // Если вдруг не нашли, значит, это была последняя турбина, или что-то пошло не так
              this.currentPathPointIndex = this.dronePath.length - 1;
          }
          // --- КОНЕЦ ИЗМЕНЕНИЯ ---

          this.transitionToFollowPath();
          return;
      }

      const distanceToNext = this.droneModel.position.distanceTo(nextOrbitPoint);
      const moveDistance = this.orbitSpeed * delta;

      if (distanceToNext > moveDistance) {
          const direction = nextOrbitPoint.clone().sub(this.droneModel.position).normalize();
          this.droneModel.position.add(direction.multiplyScalar(moveDistance));
      } else {
          this.droneModel.position.copy(nextOrbitPoint);
          this.currentOrbitPointIndex++;
      }

      const lookAtTarget = this.orbitingTurbine.position.clone();
      lookAtTarget.y = this.droneModel.position.y;
      this.droneModel.lookAt(lookAtTarget);

      this.updateCamera();
  }

  // Вспомогательная функция для перехода в FOLLOW_PATH после облета
  transitionToFollowPath() {
      this.droneState = 'FOLLOW_PATH';
      this.orbitingTurbine = null;
      this.orbitPath = [];
      this.currentOrbitPointIndex = 0;
/*       this.orbitPathLine.visible = false; // Скрываем визуализацию орбиты */

      // Проверка на конец пути уже происходит в performOrbit после установки currentPathPointIndex
      // или в updateDronePosition. Здесь дополнительная проверка уже не нужна,
      // так как currentPathPointIndex уже будет корректно установлен.
      if (this.currentPathPointIndex >= this.dronePath.length - 1) {
          console.log("[SceneInit] Drone finished path after last orbit.");
          this.currentPathPointIndex = this.dronePath.length - 1;
          this.pauseAnimation();
      }
      this.updateCamera();
  }


  updateCamera() {
    // ... (без изменений, эта логика работает)
    if (this.followDroneCamera && this.droneModel) {
      const dronePosition = this.droneModel.position;
      this.droneCameraControls.target.copy(dronePosition);
      
      if (!this.droneCameraControls.enabled) {
          const offset = new THREE.Vector3(-20, 15, -20);
          offset.applyQuaternion(this.droneModel.quaternion);
          this.camera.position.copy(this.droneModel.position).add(offset);
          this.camera.lookAt(this.droneModel.position);
      }
      this.droneCameraControls.update();
    } else {
      this.controls.update();
    }
  }

  startAnimation() {
    this.isPaused = false;
    this.clock.start();
    console.log("[SceneInit] Animation started.");
  }

  pauseAnimation() {
    this.isPaused = true;
    this.clock.stop();
    console.log("[SceneInit] Animation paused.");
  }

  resetDronePosition() {
    this.isPaused = true;
    this.currentPathPointIndex = 0;
    if (this.droneModel && this.dronePath.length > 0) {
      this.droneModel.position.copy(this.dronePath[0].point); // Используем .point
      if (this.dronePath.length > 1) {
        const nextPoint = this.dronePath[1].point; // Используем .point
        const lookAtPoint = nextPoint.clone();
        lookAtPoint.y = this.droneModel.position.y;
        this.droneModel.lookAt(lookAtPoint);
      }
    }
    this.clock.stop();
    this.clock.elapsedTime = 0;
    this.droneState = 'FOLLOW_PATH';
    this.orbitingTurbine = null;
    this.orbitPath = [];
    this.currentOrbitPointIndex = 0;
/*     this.orbitPathLine.visible = false; // Скрываем */
    this.lastOrbitedTurbineId = null; // Сбрасываем облетевшую турбину
    this.updateCamera();
    console.log("[SceneInit] Drone position reset.");
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}