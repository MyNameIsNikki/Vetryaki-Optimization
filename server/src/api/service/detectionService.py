import os
import cv2
import numpy as np
from fastapi import HTTPException
from defect_detection.yolo_detector import YoloDetector
import base64
from io import BytesIO
from PIL import Image

class DetectionService:
    @staticmethod
    def detect_defects(image_data: bytes):
        try:
            
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Не удалось загрузить изображение")
            
            input_path = "temp_input.jpg"
            output_path = "temp_output.jpg"
            
            cv2.imwrite(input_path, image)
            
            detector = YoloDetector(input_folder=".", output_folder=".")
            detector.start_detection_single(input_path, output_path)
            
            processed_image = cv2.imread(output_path)
            
            if processed_image is None:
                raise ValueError("Не удалось загрузить обработанное изображение")
            
            _, buffer = cv2.imencode('.jpg', processed_image)
            img_str = base64.b64encode(buffer).decode('utf-8')
            
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)
                
            return img_str
            
        except Exception as e:
            for path in ["temp_input.jpg", "temp_output.jpg"]:
                if os.path.exists(path):
                    os.remove(path)
            raise e