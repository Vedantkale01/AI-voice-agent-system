 // --- VARIABLES ---

    const micBtn = document.getElementById('micBtn');
    const micIcon = document.getElementById('micIcon');
    const innerRing = document.getElementById('innerRing');
    const visualizer = document.getElementById('audioVisualizer');
    const statusText = document.getElementById('statusText');
    const liveIndicator = document.getElementById('liveIndicator');
    const chatArea = document.getElementById('chatArea');
    const introScreen = document.getElementById('introScreen');
    const initSystemBtn = document.getElementById('initSystemBtn');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickSearchBtn = document.getElementById('quickSearchBtn');
    const muteBtn = document.getElementById('muteBtn');
    const muteIcon = document.getElementById('muteIcon');

    let isActiveMode = false;
    let isSystemSpeaking = false;
    let recognition;
    let silenceTimer;
    let isSystemMuted = false;
    let listeningStartTime = 0; 
    let pendingText = ""; 
    const SILENCE_TIMEOUT = 8000; 
    let lastKeyTime = 0;
    
    function getSettings() {
        try { return JSON.parse(localStorage.getItem('novaSettings') || '{}'); } 
        catch (e) { return {}; }
    }

    // --- INITIALIZATION ---
    if (initSystemBtn) initSystemBtn.addEventListener('click', startExperience);

    function startExperience() {
        try { sessionStorage.setItem('introShown', 'true'); } catch(e) {}
        introScreen.classList.add('fade-out');
        setTimeout(() => { introScreen.style.display = 'none'; }, 600);
        initSpeechEngine();
    }

    try {
        if (sessionStorage.getItem('introShown') !== 'true') {
            introScreen.style.display = 'flex';
        } else {
            introScreen.style.display = 'none';
            setTimeout(initSpeechEngine, 500);
        }
    } catch(e) {}

    // --- TOGGLE LOGIC ---
    function handleToggleCommand() {
        const now = Date.now();
        if (now - lastKeyTime < 300) return; 
        lastKeyTime = now;

        if (isSystemSpeaking) {
            window.speechSynthesis.cancel();
            isSystemSpeaking = false;
            activateActiveMode(); 
            return;
        }

        if (isActiveMode) {
            deactivateActiveMode(); 
        } else {
            activateActiveMode(); 
        }
    }

    micBtn.addEventListener('click', handleToggleCommand);

    document.addEventListener('keydown', (e) => {
        if (e.repeat) return; 
        if (e.altKey && (e.code === 'KeyV' || e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            e.stopPropagation();
            micBtn.classList.add('scale-90');
            setTimeout(() => micBtn.classList.remove('scale-90'), 150);
            micBtn.click();
        }
    });

    // --- ACTIVATE ---
    function activateActiveMode() {
        const settings = getSettings();
        if (settings.mic === false) {
            if (typeof showGlobalToast === 'function') showGlobalToast("Microphone Access Denied", "mic_off");
            return;
        }

        isActiveMode = true; 
        listeningStartTime = Date.now(); 
        pendingText = ""; 
        resetSilenceTimer();
        
        statusText.textContent = "Listening...";
        statusText.classList.remove("text-slate-500", "dark:text-gray-400");
        statusText.classList.add("text-primary", "animate-pulse");
        
        innerRing.classList.add("animate-[spin_4s_linear_infinite]", "opacity-100");
        innerRing.classList.remove("opacity-40"); 
        visualizer.classList.add("visualizer-active"); 
        micBtn.classList.add("mic-active"); 
        micIcon.textContent = "stop"; 
        liveIndicator.classList.remove("hidden");

        if(!recognition) initSpeechEngine();
        try { recognition.start(); } catch(e) {} 
    }

    // --- DEACTIVATE / PROCESS TEXT ---
    function deactivateActiveMode(silent = false, inputText = "") {
        isActiveMode = false; 
        clearTimeout(silenceTimer);

        let finalInput = inputText || pendingText;

        if (!silent && finalInput.trim() !== "") {
            
            // 1. Show EXACTLY what was said (Wake word included)
            addMessageToChat(finalInput, 'user');

            statusText.textContent = "Processing...";
            
            setTimeout(() => {
                // 2. ★ NO FILTERING: Treat the entire input as the command
                // Even if it is just "Hey Nova", send "Hey Nova" to the AI.
                const reply = "I heard: " + finalInput;
                addMessageToChat(reply, 'ai');
                speakResponse(reply); 
            }, 300);
        }
        pendingText = ""; 

        statusText.textContent = "Ready";
        statusText.classList.remove("text-primary", "animate-pulse");
        statusText.classList.add("text-slate-500", "dark:text-gray-400");
        
        innerRing.classList.remove("animate-[spin_4s_linear_infinite]", "opacity-100");
        innerRing.classList.add("opacity-40");
        visualizer.classList.remove("visualizer-active"); 
        micBtn.classList.remove("mic-active"); 
        micIcon.textContent = "mic"; 
        liveIndicator.classList.add("hidden");
        
        try { recognition.start(); } catch(e) {}
    }

    // --- SPEECH ENGINE ---
    function initSpeechEngine() {
        if (recognition) { try { recognition.abort(); } catch(e) {} recognition = null; }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

        const settings = getSettings();
        if (settings.mic === false) return; 

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.interimResults = true; 
        recognition.continuous = true; 

        let langCode = 'en-US'; 
        if (settings.lang === 'hi') langCode = 'hi-IN';
        else if (settings.lang === 'en-uk') langCode = 'en-GB';
        recognition.lang = langCode; 

        const savedWakeWord = (settings.wake || 'hey nova').toLowerCase();
        let triggerWords = [savedWakeWord, "nova", "hey nova"];
        if (settings.lang === 'hi') triggerWords.push("हे नोवा", "नमस्ते");

        recognition.onresult = (event) => {
            if (isSystemSpeaking) return;

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }

            let cleanTranscript = (finalTranscript || interimTranscript).toLowerCase().trim();
            cleanTranscript = cleanTranscript.replace(/।/g, '').replace(/[?.!,]/g, '').trim();

            if (cleanTranscript.includes("namaste") || cleanTranscript.includes("bataiye") || cleanTranscript.includes("help you") || cleanTranscript.includes("listening")) return;

            // PASSIVE WAKE WORD (Background)
            if (!isActiveMode) {
                const detectedTrigger = triggerWords.find(t => cleanTranscript.includes(t));
                if (detectedTrigger) {
                    try { recognition.abort(); } catch(e) {} 
                    setTimeout(() => {
                        const msg = getLocalizedGreeting();
                        addMessageToChat(msg, 'ai');
                        speakResponse(msg, () => activateActiveMode());
                    }, 200);
                }
                return; 
            }

            // ACTIVE MODE (Listening)
            if (isActiveMode) {
                if (Date.now() - listeningStartTime < 100) return;
                resetSilenceTimer();

                if (cleanTranscript) {
                    statusText.textContent = `"${cleanTranscript}"`; 
                    statusText.classList.remove("text-slate-500", "dark:text-gray-400");
                    statusText.classList.add("text-slate-900", "dark:text-white");
                    pendingText = cleanTranscript; 
                }

                if (finalTranscript) {
                    if (finalTranscript.trim() === "") return;
                    deactivateActiveMode(false, finalTranscript); 
                    pendingText = ""; 
                }
            }
        };

        recognition.onend = () => { 
            const currentSettings = getSettings();
            if (currentSettings.mic !== false) {
                try { recognition.start(); } catch(e) {} 
            }
        };
        try { recognition.start(); } catch(e) {}
    }

    function resetSilenceTimer() {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            if (isActiveMode) deactivateActiveMode(); 
        }, SILENCE_TIMEOUT);
    }

    // --- UI HELPERS ---
    quickSearchBtn.addEventListener('click', () => { chatInput.focus(); });
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function sendMessage() {
        const text = chatInput.value.trim();
        if (text) {
            addMessageToChat(text, 'user');
            chatInput.value = ''; 
            setTimeout(() => {
                const response = "I received your message: " + text;
                addMessageToChat(response, 'ai');
                speakResponse(response);
            }, 600);
        }
    }

    muteBtn.addEventListener('click', () => {
        isSystemMuted = !isSystemMuted;
        if(isSystemMuted) {
            muteIcon.textContent = 'volume_off';
            muteBtn.classList.add('text-red-500');
            window.speechSynthesis.cancel();
            isSystemSpeaking = false;
        } else {
            muteIcon.textContent = 'volume_up';
            muteBtn.classList.remove('text-red-500');
        }
    });

    function getLocalizedGreeting() {
        const settings = getSettings();
        if (settings.lang === 'hi') return "Namaste! Bataiye, main aapki kaise help kar sakta hoon?"; 
        return "How can I help you?";
    }

    function updatePersonaHeading() {
        const settings = getSettings();
        const voiceName = settings.voice || 'Alex'; 
        const formattedName = voiceName.charAt(0).toUpperCase() + voiceName.slice(1);
        const headingSpan = document.getElementById('dynamicName');
        if(headingSpan) headingSpan.textContent = formattedName + "?";
    }
    updatePersonaHeading();

    function addMessageToChat(text, sender) {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
        let colorClass = sender === 'user' ? 'bg-primary text-white' : 'bg-lightBg dark:bg-white/5 border border-lightBorder dark:border-border text-slate-700 dark:text-gray-300';
        const bubble = document.createElement('div');
        bubble.className = `${colorClass} px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[90%] shadow-md mb-1`;
        bubble.textContent = text;
        div.appendChild(bubble);
        chatArea.appendChild(div);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function speakResponse(text, callback = null) {
        if(isSystemMuted) { if(callback) callback(); return; }

        isSystemSpeaking = true; 
        window.speechSynthesis.cancel(); 

        const settings = getSettings();
        const persona = settings.voice || 'luna';
        const lang = settings.lang || 'en-us';
        const speed = parseFloat(settings.spd) || 1.0;
        
        let allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length === 0) {
            setTimeout(() => speakResponse(text, callback), 200);
            return;
        }

        let selectedVoice = null;
        let finalPitch = 1.0; 

        if (lang === 'hi') {
            selectedVoice = allVoices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN') || allVoices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
            if (persona === 'atlas') finalPitch = 0.7; else if (persona === 'luna') finalPitch = 1.1;
        } else {
            const region = lang === 'en-uk' ? 'GB' : 'US';
            const regionVoices = allVoices.filter(v => v.lang.includes(region) || v.lang.includes(lang === 'en-uk' ? 'en-GB' : 'en-US'));
            if (persona === 'luna') {
                selectedVoice = regionVoices.find(v => v.name.includes('Female') || v.name.includes('Zira'));
            } else {
                selectedVoice = regionVoices.find(v => v.name.includes('Male') || v.name.includes('David'));
            }
            if (!selectedVoice && regionVoices.length > 0) selectedVoice = regionVoices[0];
        }

        if (!selectedVoice) selectedVoice = allVoices[0];

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.pitch = finalPitch;
        utterance.rate = speed;
        
        utterance.onstart = () => { isSystemSpeaking = true; };
        
        const safetyTimeout = setTimeout(() => { 
            isSystemSpeaking = false;
            if(callback) callback();
        }, (text.length * 100) + 2000);

        utterance.onend = () => { 
            clearTimeout(safetyTimeout);
            setTimeout(() => { 
                isSystemSpeaking = false; 
                if (callback) callback();
            }, 300); 
        };
        
        window.speechSynthesis.speak(utterance);
    }
