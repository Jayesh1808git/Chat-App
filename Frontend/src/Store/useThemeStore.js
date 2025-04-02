import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme); // Set data-theme attribute on root element
    set({ theme });
  },
}));

// Set initial theme on document root
document.documentElement.setAttribute("data-theme", localStorage.getItem("chat-theme") || "coffee");