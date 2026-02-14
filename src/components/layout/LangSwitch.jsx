// src/components/LanguageSwitcher.jsx

import { Menu } from "@headlessui/react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../authentication/AuthContext";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // Default language is English

  useEffect(() => {
    // Initialize language from user preference or localStorage
    const savedLanguage =
      user?.language || localStorage.getItem("preferredLanguage") || "en";
    setSelectedLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
  }, [user, i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setSelectedLanguage(lng);

    // Update localStorage
    localStorage.setItem("preferredLanguage", lng);

    // Update user object if available
    if (user) {
      updateUser({ ...user, language: lng });
    }

    // Dispatch custom event for same-tab language changes
    window.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { language: lng } })
    );
  };

  const languageOptions = {
    en: { name: "English", flag: "assets/Img/flag/ukFlag.png" },
    kh: { name: "Khmer", flag: "assets/Img/flag/khFlag.png" },
    ch: { name: "Chinese", flag: "assets/Img/flag/chFlag.png" }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
          <img
            src={languageOptions[selectedLanguage].flag}
            alt={languageOptions[selectedLanguage].name}
            className="w-4 h-4 mr-2"
          />
          {t(`languages.${selectedLanguage}`)}
        </Menu.Button>
      </div>

      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          {Object.keys(languageOptions).map((lng) => (
            <Menu.Item key={lng}>
              {({ active }) => (
                <button
                  onClick={() => changeLanguage(lng)}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } block px-4 py-2 text-sm text-gray-700 w-full text-left flex items-center`}
                >
                  <img
                    src={languageOptions[lng].flag}
                    alt={languageOptions[lng].name}
                    className="w-5 h-5 mr-2"
                  />
                  {t(`languages.${lng}`)}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default LanguageSwitcher;
