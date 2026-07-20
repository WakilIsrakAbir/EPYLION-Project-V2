// ==========================================================
// DARK MODE TOGGLE SYSTEM
// ==========================================================
(function () {
    const STORAGE_KEY = 'theme-preference';

    function getThemePreference() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        // Default to dark mode
        return 'dark';
    }

    function applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        updateToggleIcon(theme);
        updateSidebarForTheme(theme);
        updateDashboardAnimation(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function updateToggleIcon(theme) {
        const btn = document.getElementById('darkModeToggle');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        if (theme === 'dark') {
            icon.className = 'fas fa-sun text-yellow-400 text-base';
            btn.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon text-gray-500 text-base';
            btn.title = 'Switch to Dark Mode';
        }
    }

    function updateSidebarForTheme(theme) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        if (theme === 'dark') {
            // Switch sidebar text from black to light
            sidebar.querySelectorAll('.text-black').forEach(el => {
                el.classList.remove('text-black');
                el.classList.add('dm-text-light');
            });
        } else {
            // Switch sidebar text from light to black
            sidebar.querySelectorAll('.dm-text-light').forEach(el => {
                el.classList.remove('dm-text-light');
                el.classList.add('text-black');
            });
        }
    }

    function updateDashboardAnimation(theme) {
        // Notify dashboard animation about theme change
        if (window.updateDashboardTheme) {
            window.updateDashboardTheme(theme);
        }
    }

    function toggleTheme() {
        const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    }

    // When DOM is ready, fully apply theme
    document.addEventListener('DOMContentLoaded', function () {
        const theme = getThemePreference();
        applyTheme(theme);
    });

    // Expose toggle function globally
    window.toggleDarkMode = toggleTheme;
})();
