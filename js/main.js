(function() {
    
    // ===========================
    // 1. MASTER MIC CONTROLLER (GLOBAL)
    // ===========================
    window.toggleMasterMic = function() {
        // 1. Get current state
        const settings = JSON.parse(localStorage.getItem('novaSettings') || '{}');
        const currentState = settings.mic === true; // Default to false if missing
        
        // 2. Flip State
        const newState = !currentState;
        settings.mic = newState;
        localStorage.setItem('novaSettings', JSON.stringify(settings));

        // 3. Global Toast Notification
        if (newState) {
            showGlobalToast("Microphone Activated", "graphic_eq");
        } else {
            showGlobalToast("Microphone Muted", "mic_off");
            // Stop any active listening on Home Page
            const homeMic = document.getElementById('micBtn');
            if(homeMic && homeMic.classList.contains('listening')) {
                // We simulate a click to stop it, or just reload logic
                // For now, let's just let voice.js handle the stop if it polls
            }
        }

        // 4. Update Settings UI (If we are on the Settings Page)
        if (typeof window.updateMicUI === 'function') {
            window.updateMicUI(newState);
        }
    };

    // ===========================
    // 2. HEADER & LOADER LOGIC
    // ===========================
    function initHeaderLogic() {
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
        const highlight = (selector) => {
            const currentFile = window.location.pathname.split('/').pop() || 'index.html'; 
            document.querySelectorAll(selector).forEach(link => {
                const linkFile = (link.getAttribute('href') || '').split('/').pop() || 'index.html';
                if (linkFile === currentFile) {
                    link.classList.remove('text-slate-500', 'dark:text-slate-400');
                    link.classList.add('text-primary', 'bg-primary/10', 'font-bold');
                }
            });
        };
        highlight('.nav-link');     
        highlight('.mobile-link');  
    }

    function loadSkeleton() {
        const isPagesFolder = window.location.pathname.includes('/pages/');
        const basePath = isPagesFolder ? '../' : './';
        const headerContainer = document.getElementById('global-header');
        if (headerContainer) {
            fetch(basePath + 'components/header.html').then(res => res.text()).then(html => {
                    let processedHtml = html;
                    if (isPagesFolder) {
                        processedHtml = processedHtml.replace(/src="assets\//g, 'src="../assets/').replace(/href="index.html"/g, 'href="../index.html"').replace(/href="pages\//g, 'href="');
                    }
                    headerContainer.innerHTML = processedHtml;
                    if(typeof initThemeToggle === 'function') initThemeToggle();
                    initHeaderLogic(); 
            });
        }
        const footerContainer = document.getElementById('global-footer');
        if (footerContainer) {
            fetch(basePath + 'components/footer.html').then(res => res.text()).then(html => {
                     let processedHtml = html;
                     if (isPagesFolder) processedHtml = processedHtml.replace(/src="assets\//g, 'src="../assets/');
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
                showGlobalToast(isDark ? 'Dark Mode' : 'Light Mode', isDark ? 'dark_mode' : 'light_mode');
            });
        }
    }

    // ===========================
    // 4. SHARED TOAST
    // ===========================
    window.showGlobalToast = function(msg, icon = 'check') {
        const existing = document.getElementById('global-toast');
        if(existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'global-toast';
        t.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-white dark:bg-[#1a1825] border border-slate-200 dark:border-[#8b5cf6]/30 pl-4 pr-6 py-3 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 translate-y-24 opacity-0 text-slate-800 dark:text-white font-sans';
        t.innerHTML = `<div class="w-6 h-6 rounded-full bg-violet-100 dark:bg-[#8b5cf6]/20 flex items-center justify-center text-violet-600 dark:text-[#8b5cf6]"><span class="material-symbols-rounded text-sm">${icon}</span></div><p class="text-sm font-medium">${msg}</p>`;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.remove('translate-y-24', 'opacity-0'));
        setTimeout(() => { t.classList.add('translate-y-24', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 3000);
    };

    // ===========================
    // 5. GLOBAL SHORTCUTS LISTENER
    // ===========================
function initShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 1. Ignore typing in inputs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            // 2. Get Settings
            const settings = JSON.parse(localStorage.getItem('novaSettings') || '{}');
            // Force defaults if missing
            const toggleKey = (settings.scTog || 'Alt + V').toUpperCase(); 
            const muteKey = (settings.scMute || 'Alt + M').toUpperCase();

            // 3. Build Pressed Key String (Always UpperCase for comparison)
            let keyName = e.key.toUpperCase();
            if (e.code === 'Space') keyName = 'SPACE'; 

            const pressedParts = [
                e.ctrlKey ? 'CTRL' : '',
                e.altKey ? 'ALT' : '',
                e.shiftKey ? 'SHIFT' : '',
                e.metaKey ? 'CMD' : '',
                keyName
            ].filter(Boolean).join(' + ');

            console.log("Pressed:", pressedParts); // Debugging help

            // --- SCENARIO A: TOGGLE LISTENING (Alt + V) ---
            if (pressedParts === toggleKey) {
                e.preventDefault();
                
                // Check if globally muted first
                if (settings.mic === false) {
                    showGlobalToast("Microphone is Muted/Denied", "mic_off");
                    return;
                }

                const micBtn = document.getElementById('micBtn');
                if (micBtn) {
                    // Visual Press Effect
                    micBtn.classList.add('scale-90', 'ring-4', 'ring-primary/50'); 
                    setTimeout(() => micBtn.classList.remove('scale-90', 'ring-4', 'ring-primary/50'), 150);
                    
                    // ACTUALLY CLICK IT
                    micBtn.click();
                } else {
                    console.log("Mic button not found on this page.");
                }
            }

            // --- SCENARIO B: MUTE MASTER SWITCH (Alt + M) ---
            if (pressedParts === muteKey) {
                e.preventDefault();
                window.toggleMasterMic();
            }
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        loadSkeleton(); 
        initShortcuts(); 
    });
})();


