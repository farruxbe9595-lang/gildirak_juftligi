(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");

  const savedTheme = localStorage.getItem("gildirak_theme") || "light";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("gildirak_theme", theme);

    if (btn) {
      btn.textContent = theme === "dark" ? "☀️ Kunduzgi rejim" : "🌙 Tungi rejim";
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Kunduzgi rejimga o‘tish" : "Tungi rejimga o‘tish"
      );
    }
  }

  applyTheme(savedTheme);

  if (btn) {
    btn.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme") || "light";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }
})();
