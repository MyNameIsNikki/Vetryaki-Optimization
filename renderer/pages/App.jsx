import { Routes, Route} from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import Home from "./Home";
import Weather from "./Weather";
import Router from "./Router";
import Detection  from "./Detection"
import History from "./History";
import Docs from "./Docs";
import Menu from "../threejsSimulation/pages/menu";
import Simulation from "../threejsSimulation/pages/simulation"

import i18n from "../i18n"

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/weather' element={<Weather />}/>
        <Route path='/router' element={<Router />}/>
        <Route path='/detection' element={<Detection />}/>
        <Route path='/history' element={<History />}/>
        <Route path='/docs' element={<Docs />}/>
        <Route path='/3dsetup' element={<Menu />}/>
        <Route path='/simulation' element={<Simulation />}/>
      </Routes>
    </I18nextProvider>
  );
}

export default App;