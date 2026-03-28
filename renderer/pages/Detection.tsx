import { useState, useRef } from "react";
import Navbar from "@components/NavBar";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DetectionRequest {
    image: File | null;
}

const Detection = () => {
    const { t } = useTranslation();

    const [isDataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [formdata, setFormdata] = useState<DetectionRequest>({ image: null });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formdata.image) {
            toast.warn("Filetype must be .jpg or .png", {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
            });
            return;
        }

        setIsLoading(true);
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", formdata.image);

            const response = await fetch("http://127.0.0.1:8000/api/detect", {
                method: "POST",
                body: uploadFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Ошибка сервера");
            }

            const result = await response.json();
            
            if (result.success && result.processed_image) {
                setProcessedImage(`data:image/jpeg;base64,${result.processed_image}`);
                setDataLoaded(true);

                toast.success("Detection successfully done!", {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "colored",
                });
            } else {
                throw new Error("Couldn't handle image");
            }

        } catch (error) {
            console.error("Upload failed:", error);
            if (error instanceof Error) {
                toast.error(`Detection ERROR: ${error.message}`, {
                    position: "top-right",
                    autoClose: 4000,
                    theme: "colored",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormdata({ image: file });
            
            const imageUrl = URL.createObjectURL(file);
            setOriginalImage(imageUrl);
            setProcessedImage(null);
            setDataLoaded(false);

            toast.info(`Added file: ${file.name}`, {
                position: "top-right",
                autoClose: 2000,
                theme: "dark",
            });
        }
    };

    const handleExport = () => {
        if (!processedImage) return;
        
        const link = document.createElement("a");
        link.href = processedImage;
        link.download = `processed_${formdata.image?.name || "image.jpg"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Image saved!", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
        });
    };

    const handleClear = () => {
        setFormdata({ image: null });
        setOriginalImage(null);
        setProcessedImage(null);
        setDataLoaded(false);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        
        if (originalImage) {
            URL.revokeObjectURL(originalImage);
        }

        toast.info("All clean!", {
            position: "top-right",
            autoClose: 2000,
            theme: "dark",
        });
    };

    return (
        <>
            <Navbar/>
            <main className="relative min-h-screen w-full bg-[#a2c8df] flex items-center justify-center pt-[109px] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                </div>
                
                <div className="text-white z-10 w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-8">
                        {/* Input для файла */}
                        <div>
                            <label htmlFor="images" className="flex justify-center text-sm font-medium text-white mb-3">
                                {t("Upload Image")}
                            </label>
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    id="images" 
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                    disabled={isLoading}
                                />
                                <label
                                    htmlFor="images"
                                    className={`flex items-center justify-between w-full p-4 rounded-xl border border-white border-opacity-40 cursor-pointer transition-all duration-300 shadow-sm ${
                                        isLoading 
                                            ? "bg-gray-600 cursor-not-allowed" 
                                            : "bg-white bg-opacity-20 hover:bg-opacity-30"
                                    }`}
                                >
                                    <span className="text-white font-medium truncate max-w-[70%]">
                                        {formdata.image ? formdata.image.name : t("Choose an image file")}
                                    </span>
                                    <span className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ${
                                        isLoading
                                            ? "bg-gray-500 text-gray-300"
                                            : "text-white bg-blue-600 hover:bg-blue-700"
                                    }`}>
                                        {t("Browse")}
                                    </span>
                                </label>

                                <button 
                                    type="submit" 
                                    disabled={!formdata.image || isLoading}
                                    className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-colors shadow-sm mt-5 ${
                                        !formdata.image || isLoading
                                            ? "bg-gray-600 cursor-not-allowed text-gray-300"
                                            : "text-white bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {isLoading ? "Processing..." : t("Detect Defects")}
                                </button>
                            </div>
                        </div>

                        {/* Область для отображения изображений */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Оригинальное изображение */}
                            <div className="flex flex-col items-center">
                                <div className="text-white text-lg mb-3">{t("Original Image")}</div>
                                {originalImage ? (
                                    <img 
                                        src={originalImage} 
                                        alt="Original" 
                                        className="max-w-full max-h-96 rounded-lg shadow-md"
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-300 bg-opacity-20 rounded-lg border-2 border-dashed border-white border-opacity-30 flex items-center justify-center">
                                        <div className="text-white text-opacity-70">{t("Original image")}</div>
                                    </div>
                                )}
                            </div>

                            {/* Обработанное изображение */}
                            <div className="flex flex-col items-center">
                                <div className="text-white text-lg mb-3">{t("Processed Image")}</div>
                                {isLoading ? (
                                    <div className="w-full h-96 bg-gray-300 bg-opacity-50 rounded-lg flex flex-col items-center justify-center">
                                        <div className="text-white text-lg mb-3">{t("Processing image...")}</div>
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : processedImage ? (
                                    <img 
                                        src={processedImage} 
                                        alt="Processed result" 
                                        className="max-w-full max-h-96 rounded-lg shadow-md"
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-300 bg-opacity-20 rounded-lg border-2 border-dashed border-white border-opacity-30 flex items-center justify-center">
                                        <div className="text-white text-opacity-70">{t("Processed image will appear here")}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex justify-center gap-5 mt-10">
                            <button
                                type="button"
                                disabled={!isDataLoaded || isLoading}
                                className={`px-6 py-2 rounded-lg text-white transition duration-300 shadow-md ${
                                    isDataLoaded && !isLoading
                                        ? "bg-[#648596] hover:bg-[#547485]"
                                        : "bg-gray-600 cursor-not-allowed"
                                }`}
                                onClick={handleExport}
                            >
                                {t("Download Result")}
                            </button>
                            
                            <button
                                type="button"
                                disabled={isLoading}
                                className={`px-6 py-2 rounded-lg text-white transition duration-300 shadow-md ${
                                    isLoading
                                        ? "bg-gray-600 cursor-not-allowed"
                                        : "bg-[#963333] hover:bg-[#7a2a2a]"
                                }`}
                                onClick={handleClear}
                            >
                                {t("Clear")}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Контейнер для алертов */}
            <ToastContainer />
        </>
    );
};

export default Detection;
