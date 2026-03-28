import { useState, useRef } from 'react';

const Dropdown = ({ lang, onChange }: { lang: string; onChange: (lang: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'EN', name: 'En' },
    { code: 'RU', name: 'Ru' }
  ];

  const handleLanguageSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="inline-block relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2 bg-[#69a7ce] text-white rounded-lg hover:bg-[#547485] transition duration-300 shadow-md"
        type="button"
      >
        {lang}
        <svg 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`size-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path 
            fillRule="evenodd" 
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-[70px] mt-2 origin-top-right rounded-md bg-gray-600 outline-1 -outline-offset-1 outline-white/10 transition-all duration-100 ease-out">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`block w-full px-4 py-2 text-sm ${
                  lang === language.code 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                } focus:bg-white/5 focus:text-white focus:outline-none`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dropdown;