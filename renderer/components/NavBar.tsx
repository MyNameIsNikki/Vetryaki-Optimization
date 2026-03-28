import { useState, useEffect } from "react";
import { RiCloseLine, RiMenuFill } from "react-icons/ri";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [missions, setMissions] = useState<string[]>(() => {
    const savedMissions = localStorage.getItem("missions");
    try {
      // Ensure savedMissions is not null before parsing and that it's an array
      return savedMissions ? JSON.parse(savedMissions) : [];
    } catch (error) {
      console.error("Error parsing missions from localStorage:", error);
      return []; // Return an empty array in case of parsing error
    }
  });
  const [selectedMission, setSelectedMission] = useState<string | null>(() => {
    return localStorage.getItem("selectedMission");
  });

  const navLinks = [
    {
      to: "/",
      label: t("Home"),
    },
    {
      to: "/weather",
      label: t("Weather"),
    },
    {
      to: "/router",
      label: t("Router"),
    },
    {
      to: "/detection",
      label: t("Detection"),
    },
    {
      to: "/history",
      label: t("History"),
    },
    {
      to: "/docs",
      label: t("Docs"),
    },
  ];

  useEffect(() => {
    const handleStorageChange = () => {
      const savedMissions = localStorage.getItem("missions");
      const savedSelectedMission = localStorage.getItem("selectedMission");
      try {
        setMissions(savedMissions ? JSON.parse(savedMissions) : []);
      } catch (error) {
        console.error("Error parsing missions from localStorage on storage change:", error);
        setMissions([]); // Reset to empty array on error
      }
      setSelectedMission(savedSelectedMission);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("mission-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mission-updated", handleStorageChange);
    };
  }, []);

  // Update localStorage and dispatch custom event when selectedMission changes
  useEffect(() => {
    localStorage.setItem("selectedMission", selectedMission || "");
    window.dispatchEvent(new CustomEvent("mission-updated"));
  }, [selectedMission]);

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  return (
    <header className="fixed top-0 left-0 z-50 w-full py-5 mx-auto bg-[#282828] border-b border-gray-800 opacity-65">
      <nav className="container flex items-center justify-between px-4 mx-auto md:px-10">
        {/* Logo */}
        <div className="flex items-center cursor-pointer gap-2.5">
          <div className="h-10 w-20 group bg-[#69a7ce] rounded grid place-items-center text-white">
            <span className="text-[24px] font-bold font-Sync">WTM</span>
          </div>
          <div className="flex flex-col items-start h-full text-white translate-y-1">
            <p className="text-xl font-medium group-hover:opacity-90 font-Sync">
              Wind turbine
            </p>
            <p className="text-gray-200/80 -translate-y-[7px] font-Sync text-lg">
              Maintenance
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <ul className="items-center hidden gap-3 md:flex">
          {navLinks.map((link, index) => (
            <div key={index}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "bg-gradient-to-tr from-gray-400/10 px-2 py-1 rounded text-gray-300 to-transparent"
                    : "text-base hover:text-gray-200 transition duration-300 px-2 py-1 font-medium text-gray-400"
                }
              >
                {link.label}
              </NavLink>
            </div>
          ))}
        </ul>

        {/* Mission Selector */}
        <div className="hidden md:flex items-center gap-2">
          <select
            value={selectedMission || ""}
            onChange={(e) => setSelectedMission(e.target.value || null)}
            className="h-10 w-20 bg-[#69a7ce] text-white px-3 h-10 rounded-lg text-sm font-medium focus:outline-none"
          >
            {/* Ensure missions is an array before mapping */}
            {missions && missions.length > 0 ? (
              missions.map((mission, index) => (
                <option key={index} value={mission}>
                  {mission}
                </option>
              ))
            ) : (
              <option value="">{t("No Mission")}</option>
            )}
          </select>
        </div>

        <button
          onClick={toggleNav}
          className="flex items-center justify-center w-12 h-12 text-lg text-white rounded-lg ring-inset ring ring-gray-800/10 active:ring-0 active:bg-gray-800/70 active:scale-95 bg-gray-800/50 md:hidden"
        >
          {isNavOpen ? <RiCloseLine size={24} /> : <RiMenuFill size={20} />}
        </button>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 bg-[#282828] shadow-lg w-80 md:hidden"
            >
              <div className="flex flex-col h-full px-6 py-16 pt-20">
                {/* Mission Selector */}
                <div className="mb-6">
                  <select
                    value={selectedMission || ""}
                    onChange={(e) => setSelectedMission(e.target.value || null)}
                    className="bg-[#69a7ce] text-white px-3 py-1 rounded-lg text-sm font-medium w-full focus:outline-none"
                  >
                    <option value="">{t("Select Mission")}</option>
                    {/* Ensure missions is an array before mapping */}
                    {missions && missions.length > 0 ? (
                      missions.map((mission, index) => (
                        <option key={index} value={mission}>
                          {mission}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {t("No missions available")}
                      </option>
                    )}
                  </select>
                </div>
                {/* Navigation Links */}
                <ul className="flex flex-col items-start gap-3">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full"
                    >
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-gradient-to-tr from-gray-400/10 to-transparent px-2 py-1 rounded text-gray-300 block w-full"
                            : "text-base hover:text-gray-200 transition duration-300 px-2 py-1 font-medium text-gray-400 block w-full"
                        }
                        onClick={toggleNav}
                      >
                        {link.label}
                      </NavLink>
                    </motion.div>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;