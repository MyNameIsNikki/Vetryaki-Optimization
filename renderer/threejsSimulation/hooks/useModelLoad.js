import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function useModelLoad(modelPath) {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const gltfLoader = new GLTFLoader();
    
    gltfLoader.load(
      modelPath,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(gltf);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setError(error);
        setLoading(false);
      }
    );
  }, [modelPath]);

  return { model, loading, error };
}