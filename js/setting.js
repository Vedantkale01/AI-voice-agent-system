(function() {
    const el = (id) => document.getElementById(id);
    const defaults = { voice: 'luna', lang: 'en-us', spd: 1.0, ptch: 0, wake: 'Hey Nova', wakeOn: true, mic: false, scTog: 'Alt + V', scMute: 'Alt + M' };

    // Update Slider Color
    const updateSliderFill = (input) => {
        const val = parseFloat(input.value), min = parseFloat(input.min), max = parseFloat(input.max);
        const pct = ((val - min) / (max - min)) * 100;
        const isDark = document.documentElement.classList.contains('dark');
        input.style.background = `linear-gradient(to right, #8b5cf6 ${pct}%, ${isDark?'rgba(255,255,255,0.1)':'#e2e8f0'} ${pct}%)`;
    };

    // --- UI UPDATER (Called by main.js) ---
    window.updateMicUI = (active) => {
        const btn = el('btn-mic'), dot = el('mic-dot'), txt = el('mic-txt'), vis = el('mic-vis');
        btn.dataset.active = active;
        if(active) {
            btn.innerText = "DENY";
            btn.classList.add('hover:bg-red-500', 'hover:text-white', 'hover:border-red-500'); 
            dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] mic-active-pulse"; 
            txt.innerText = "Active"; txt.className = "text-xs font-bold text-emerald-500 dark:text-emerald-400";
            vis.classList.remove('hidden');
        } else {
            btn.innerText = "REQUEST";
            btn.classList.remove('hover:bg-red-500', 'hover:text-white', 'hover:border-red-500');
            dot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
            txt.innerText = "Denied"; txt.className = "text-xs font-bold text-red-500 dark:text-red-400";
            vis.classList.add('hidden');
        }
    };

    const apply = (s) => {
        const radio = document.querySelector(`input[name="voice_model"][value="${s.voice}"]`);
        if(radio) radio.checked = true;
        el('lang').value = s.lang;
        el('rng-spd').value = s.spd; el('lbl-spd').innerText = s.spd + 'x'; updateSliderFill(el('rng-spd'));
        el('rng-ptch').value = s.ptch; el('lbl-ptch').innerText = s.ptch == 0 ? 'Normal' : s.ptch; updateSliderFill(el('rng-ptch'));
        el('inp-wake').value = s.wake; el('tog-wake').checked = s.wakeOn;
        el('sc-tog').value = s.scTog; el('sc-mute').value = s.scMute;
        updateMicUI(s.mic);
        el('settings-grid').classList.remove('invisible');
    };

    const load = () => {
        const local = JSON.parse(localStorage.getItem('novaSettings') || '{}');
        apply({ ...defaults, ...local });
    };

    const save = () => {
        const data = {
            voice: document.querySelector('input[name="voice_model"]:checked')?.value || 'luna',
            lang: el('lang').value, spd: el('rng-spd').value, ptch: el('rng-ptch').value,
            wake: el('inp-wake').value, wakeOn: el('tog-wake').checked,
            mic: el('btn-mic').dataset.active === 'true', 
            scTog: el('sc-tog').value, scMute: el('sc-mute').value
        };
        localStorage.setItem('novaSettings', JSON.stringify(data));
        const btn = el('btn-save');
        if(btn) {
            const org = btn.innerText; btn.innerText = "Saved!"; btn.classList.add('bg-green-600');
            setTimeout(() => { btn.innerText = org; btn.classList.remove('bg-green-600'); }, 1500);
        }
    };

    // --- BUTTON CLICK USES GLOBAL TOGGLE ---
    if(el('btn-mic')) el('btn-mic').onclick = () => window.toggleMasterMic();
    if(el('btn-save')) el('btn-save').onclick = save;
    if(el('btn-discard')) el('btn-discard').onclick = () => confirm("Undo changes?") && load();

    // ... (Keep existing slider/key listeners unchanged) ...
    if(el('rng-spd')) el('rng-spd').oninput = (e) => { el('lbl-spd').innerText = e.target.value + 'x'; updateSliderFill(e.target); };
    if(el('rng-ptch')) el('rng-ptch').oninput = (e) => { el('lbl-ptch').innerText = e.target.value == 0 ? 'Normal' : e.target.value; updateSliderFill(e.target); };
    const recordKey = (e) => {
        e.preventDefault(); if(['Control','Alt','Shift','Meta'].includes(e.key)) return;
        let keyName = e.key.toUpperCase(); if (e.code === 'Space') keyName = 'Space';
        e.target.value = [e.ctrlKey?'Ctrl':'', e.altKey?'Alt':'', e.shiftKey?'Shift':'', e.metaKey?'Cmd':'', keyName].filter(Boolean).join(' + ');
        e.target.blur();
    };
    if(el('sc-tog')) el('sc-tog').onkeydown = recordKey;
    if(el('sc-mute')) el('sc-mute').onkeydown = recordKey;

    load();
})();
