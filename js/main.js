(function() {
    
  // ===========================
    // 1. HEADER LOGIC (Menu & Links)
    // ===========================
    function initHeaderLogic() {
        // A. Toggle Mobile Menu
        const btnMenu = document.getElementById('btn-mobile-menu');
        const menuDropdown = document.getElementById('mobile-menu-dropdown');
        
        if(btnMenu && menuDropdown) {
            const newBtn = btnMenu.cloneNode(true);
            btnMenu.parentNode.replaceChild(newBtn, btnMenu);
            
            newBtn.addEventListener('click', () => {
                menuDropdown.classList.toggle('hidden');
                const icon = newBtn.querySelector('span');
                icon.innerText = menuDropdown.classList.contains('hidden') ? 'menu' : 'close';
            });
        }

        // B. Highlight Active Link (SMARTER "FILENAME" CHECK)
        const highlight = (selector) => {
            const currentPath = window.location.pathname; // e.g. "/pages/settings.html"
            const currentFile = currentPath.split('/').pop() || 'index.html'; // Gets "settings.html" or defaults to "index.html"

            document.querySelectorAll(selector).forEach(link => {
                // Get the file name from the link (e.g. "/pages/settings.html" -> "settings.html")
                const linkHref = link.getAttribute('href');
                if(!linkHref) return;

                const linkFile = linkHref.split('/').pop() || 'index.html';

                // Compare just the filenames
                if (linkFile === currentFile) {
                    // Remove Inactive Styles
                    link.classList.remove('text-slate-500', 'dark:text-slate-400', 'text-slate-600', 'dark:text-slate-300');
                    // Add Active Styles
                    link.classList.add('text-primary', 'bg-primary/10', 'font-bold');
                }
            });
        };

        highlight('.nav-link');     
        highlight('.mobile-link');  
    }
 
  
   // ===========================
    // 2. LOADER (Corrected for your structure)
    // ===========================
    function loadSkeleton() {
        
        // Check if we are inside the 'pages' folder
        const isPagesFolder = window.location.pathname.includes('/pages/');
        const basePath = isPagesFolder ? '../' : './';

        // Load Header
        const headerContainer = document.getElementById('global-header');
        if (headerContainer) {
            // Fetch from components folder
            fetch(basePath + 'components/header.html') 
                .then(res => res.text())
                .then(html => {
                    let processedHtml = html;

                    // --- PATH FIXING LOGIC ---

                    // 1. If we are deep in /pages/, we need to go up (../) to find assets
                    if (isPagesFolder) {
                        // Fix Logo: assets/images/logo.png -> ../assets/images/logo.png
                        processedHtml = processedHtml.replace(/src="assets\//g, 'src="../assets/');
                        
                        // Fix Home Link: index.html -> ../index.html
                        processedHtml = processedHtml.replace(/href="index.html"/g, 'href="../index.html"');

                        // Fix Page Links: 
                        // Since we are already in 'pages/', we don't need 'pages/' in the link.
                        // Example: href="pages/settings.html" -> href="settings.html"
                        processedHtml = processedHtml.replace(/href="pages\//g, 'href="');
                    }
                    
                    headerContainer.innerHTML = processedHtml;
                    
                    // Initialize Toggles
                    if(typeof initThemeToggle === 'function') initThemeToggle();
                    if(typeof initHeaderLogic === 'function') initHeaderLogic(); 
                })
                .catch(err => console.error('Header Error:', err));
        }

        // Load Footer
        const footerContainer = document.getElementById('global-footer');
        if (footerContainer) {
            fetch(basePath + 'components/footer.html')
                .then(res => res.text())
                .then(html => {
                     // Same fix for logo in footer if needed
                     let processedHtml = html;
                     if (isPagesFolder) {
                         processedHtml = processedHtml.replace(/src="assets\//g, 'src="../assets/');
                     }
                     footerContainer.innerHTML = processedHtml;
                });
        }
    }
    // ===========================
    // 3. THEME TOGGLE
    // ===========================
    function initTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage))) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    initTheme();

    function initThemeToggle() {
        const btnTheme = document.getElementById('btn-theme-toggle');
        if (btnTheme) {
            const newBtn = btnTheme.cloneNode(true);
            btnTheme.parentNode.replaceChild(newBtn, btnTheme);
            newBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.theme = isDark ? 'dark' : 'light';
                showGlobalToast(isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled', isDark ? 'dark_mode' : 'light_mode');
            });
        }
    }

    // ===========================
    // 4. SHARED UTILS & TOAST
    // ===========================
    const defaults = { voice: 'luna', lang: 'en-us', spd: 1.0, ptch: 0, wake: 'Hey Nova', wakeOn: true, mic: false, scTog: 'Alt + V', scMute: 'Alt + M' };
    function getSettings() { return { ...defaults, ...JSON.parse(localStorage.getItem('novaSettings') || '{}') }; }
    function saveSettings(s) { localStorage.setItem('novaSettings', JSON.stringify(s)); }

    function showGlobalToast(msg, icon = 'check') {
        const existing = document.getElementById('global-toast');
        if(existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'global-toast';
        t.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-white dark:bg-[#1a1825] border border-slate-200 dark:border-[#8b5cf6]/30 pl-4 pr-6 py-3 rounded-full shadow-xl shadow-slate-200/50 dark:shadow-[#8b5cf6]/20 backdrop-blur-md transition-all duration-300 translate-y-24 opacity-0 text-slate-800 dark:text-white font-sans';
        t.innerHTML = `<div class="w-6 h-6 rounded-full bg-violet-100 dark:bg-[#8b5cf6]/20 flex items-center justify-center text-violet-600 dark:text-[#8b5cf6]"><span class="material-symbols-rounded text-sm">${icon}</span></div><p class="text-sm font-medium">${msg}</p>`;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.remove('translate-y-24', 'opacity-0'));
        setTimeout(() => { t.classList.add('translate-y-24', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 3000);
    }

    // ===========================
    // 5. INITIALIZE
    // ===========================
    document.addEventListener('DOMContentLoaded', () => {
        loadSkeleton();
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            const s = getSettings();
            const match = (combo) => {
                if(!combo) return false;
                const parts = combo.split(' + ');
                const key = parts.pop();
                return e.key.toUpperCase() === key && e.ctrlKey === parts.includes('Ctrl') && e.altKey === parts.includes('Alt') && e.shiftKey === parts.includes('Shift');
            };
            if (match(s.scTog)) {
                e.preventDefault(); s.wakeOn = !s.wakeOn; saveSettings(s);
                showGlobalToast(`Voice Mode: ${s.wakeOn ? 'ON' : 'OFF'}`, s.wakeOn ? 'mic' : 'mic_off');
                const toggle = document.getElementById('tog-wake'); if(toggle) toggle.checked = s.wakeOn;
            }
            if (match(s.scMute)) {
                e.preventDefault(); s.mic = !s.mic; saveSettings(s);
                showGlobalToast(s.mic ? "Mic Unmuted" : "Mic Muted", s.mic ? 'graphic_eq' : 'volume_off');
                // 
                if(window.updateMicUI) window.updateMicUI(s.mic);
            }
        });
    });
})();


