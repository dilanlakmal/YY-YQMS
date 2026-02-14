// src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme in localStorage or default to 'light'
    const savedTheme = localStorage.getItem("global-theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove the opposite class and add the current one
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
    // Save the theme preference
    localStorage.setItem("global-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
