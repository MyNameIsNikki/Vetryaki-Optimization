import Navbar from "@components/NavBar";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Docs = () => {

  const { t } = useTranslation();
  
  const downloadFile = (url: string, filename: string): void => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File downloaded successfully!");
    } catch (error) {
      toast.error("Error while downloading file.");
      console.error(error);
    }
  };
    
  return (
   <>
    <Navbar/>
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
        <div className="text-white z-10 mb-[50px] w-full max-w-[1169px] bg-black bg-opacity-20 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
          <div className="mb-6 pb-4 border-b border-white border-opacity-20">
            <h6 className="flex justify-center">Brief documentation. Only the most important things to use!</h6>
            <h4>
              Раздел «История» и сохранение данных "History": «История» в данном приложении является опциональной. 
              Это означает, что данные о ваших действиях (например, результаты запроса погоды или построенные маршруты) не 
              сохраняются автоматически. Как это работает: Данные сессии временны. Вы можете использовать основные функции приложения (загружать погоду, строить маршруты), 
              но при переключении между разделами эти данные будут утеряны.<br></br>Явное сохранение. Для того чтобы сохранить результаты миссии (сессии работы), необходимо нажать кнопку «Save to localStorage». Только после этого все данные текущей сессии 
              будут записаны в локальное хранилище и станут доступны для просмотра в разделе «История» после завершения миссии. Экспорт данных. Раздел «История» позволяет просматривать все сохраненные миссии и экспортировать их в 
              виде JSON-файла. Вам предоставляется свобода выбора в зависимости от ваших задач:
            </h4>
            <h4 className="p-3" >Сценарий 1: Предварительный экспорт. Если вам не требуется сохранять сессию в истории приложения, а нужен лишь итоговый файл, вы можете экспортировать данные в JSON в любой момент, даже не начиная миссию.</h4>
            <h4 className="p-3" >Сценарий 2: Полное сохранение сессии. Если вы хотите вести историю своих миссий внутри приложения, обязательно используйте кнопку «Save to localStorage» перед завершением работы или переключением раздела. Это сохранит все данные, и вы сможете вернуться к ним позднее в разделе «История» после завершения миссии, откуда их также можно будет экспортировать.</h4>
            <h4>Вывод: Вы сами управляете тем, как сохранять данные — либо через регулярное сохранение в «Историю», либо через прямое создание JSON-файла.</h4>
            <h5 className="p-3">PS: При нажатии «Save to localStorage» вы можете 
              спокойно перемещаться между разделами — данные останутся на месте и ничего не удалится. По завершении миссии вы также сможете увидеть их в истории.
            </h5>
          </div>
          <div className="mb-6 pb-4 border-b border-white border-opacity-20">
            <h4>
              В приложении предусмотрена гибкая последовательность действий без строгих ограничений. Вы можете начать работу с любого этапа — например, сразу построить маршрут или запросить погодные данные без создания миссии.
              Важно отметить, что сохранение результатов в раздел «История» возможно только после создания миссии. Однако экспорт данных в формате JSON доступен на любом этапе работы, даже без активной миссии.
              Все полученные данные предназначены для последующей корректировки маршрута в 3D-редакторе. Вы можете загрузить информацию как из localStorage (после сохранения миссии), так и из локального JSON-файла с вашего устройства.
              Для оптимальной работы рекомендуется придерживаться последовательности, соответствующей порядку вкладок в интерфейсе: сначала добавить миссию, получить погодные данные, затем построить маршрут и выполнить его корректировку.
            </h4>
            <h4>
              Вы сами решаете как пользоваться данной программой.
            </h4>
          </div>
          <div className="flex justify-center">
          <button
            onClick={() => downloadFile("../../server/docs/documentation.pdf", "documentation.pdf")}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors flex items-center w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t("Download documentation")}
            </button>
          </div>
        </div>
    </main>
   </>
  )
}

export default Docs;
