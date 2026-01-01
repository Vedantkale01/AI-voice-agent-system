// File: js/tailwind-setup.js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#6c2bee", 
        dark: "#0f0e17",
        surface: "#1a1825",
        border: "rgba(255, 255, 255, 0.08)",
        // Light Mode
        lightBg: "#f6f6f8", 
        lightCard: "#ffffff",
        lightText: "#0f172a", 
        lightBorder: "#e2e8f0" 
      },
      fontFamily: { display: ["Inter", "sans-serif"] },
      boxShadow: { 
        'glow': '0 0 20px rgba(108, 43, 238, 0.15)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
      }
    }
  }
};
