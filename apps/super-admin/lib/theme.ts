export const THEME_STORAGE_KEY = "mergio-theme";

// Runs in <head> before the page paints, preventing light theme flash
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`;
