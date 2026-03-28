import cv2 
import torch  
import os  
from ultralytics import YOLO 

class YoloDetector:
    def __init__(self, input_folder, output_folder):
        self.input_folder = input_folder
        self.output_folder = output_folder
        
    def start_detection_single(self, input_path, output_path):
        
        os.makedirs(self.output_folder, exist_ok=True)
        
        model = YOLO("./defect_detection/data/best_turbine.pt").to("cpu")
        
        image = cv2.imread(input_path)
        if image is None:
            raise ValueError(f"Не удалось загрузить изображение: {input_path}")
        
        results = model(image)
        
        for result in results:
            for box in result.boxes:  
                x1, y1, x2, y2 = map(int, box.xyxy[0])  
                conf = float(box.conf[0]) 
                cls = int(box.cls[0]) 
                label = f"{model.names[cls]} {conf:.2f}" 

                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 255), 2)
                cv2.putText(image, label, (x1, y1 - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        cv2.imwrite(output_path, image)
        return output_path