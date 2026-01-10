// ================ ELEMENTS ============================
const micBtn = document.getElementById("micBtn");
const chatArea = document.getElementById("chatArea");
const micStatus = document.getElementById("micStatus");

// --- HELPER: Check Mute Status & Toast ---
function isMicMuted() {
    const settings = JSON.parse(localStorage.getItem('novaSettings') || '{}');
    return settings.mic === false;
}

function triggerToast(msg, icon) {
    if (window.showGlobalToast) window.showGlobalToast(msg, icon);
}

// ======== SPEECH RECOGNITION (STT) ===========================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.error("Speech Recognition not supported");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-IN"; // Default, can be dynamic if needed
recognition.interimResults = false;
recognition.continuous = false;

let isListening = false;

// =================== TEXT TO SPEECH (TTS - SMART VERSION) =======================
const synth = window.speechSynthesis;
let voices = [];

// 1. Load Voices Robustly
function populateVoices() {
    voices = synth.getVoices();
}
populateVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
}

// 2. The Smart Speak Function (Connects Persona/Speed/Pitch)
function speak(text) {
    if (!synth) return;

    // A. Cancel old audio so it doesn't overlap
    synth.cancel();

    // B. Get Saved Settings
    const settings = JSON.parse(localStorage.getItem('novaSettings') || '{}');
    const savedVoice = settings.voice || 'luna'; // 'atlas', 'luna', 'nexus'
    const savedLang  = (settings.lang || 'en-us').toLowerCase().split('-')[0]; // 'en', 'hi'
    const savedSpeed = parseFloat(settings.spd || 1);
    
    // Base pitch from slider (default 1.0)
    let finalPitch = parseFloat(settings.ptch || 1); 

    // C. Find Best Voice & Apply Persona Tricks
    let selectedVoice = null;

    // --- HINDI LOGIC ---
    if (savedLang === 'hi') {
        selectedVoice = voices.find(v => v.lang.toLowerCase().includes('hi'));
        // Pitch Shift for Persona effect in Hindi
        if (selectedVoice) {
            if (savedVoice === 'atlas') finalPitch *= 0.8; // Deepen
            if (savedVoice === 'luna')  finalPitch *= 1.2; // Heighten
        }
    } 
    // --- ENGLISH LOGIC ---
    else {
        if (savedVoice === 'luna') {
            // Try finding a Female voice
            selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')));
            // If fallback to generic, artificially raise pitch
            if (!selectedVoice || !selectedVoice.name.includes('Female')) finalPitch *= 1.1;
        } 
        else if (savedVoice === 'atlas') {
            // Try finding a Male voice
            selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Male') || v.name.includes('David')));
            // If fallback to generic, artificially lower pitch
            if (!selectedVoice || !selectedVoice.name.includes('Male')) finalPitch *= 0.8;
        }
        else {
            // Nexus (Neutral) - Default Google Voice
            selectedVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Mark'));
        }
    }

    // Fallback if no specific voice found
    if (!selectedVoice) selectedVoice = voices[0];

    // D. Speak
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = savedSpeed;
    utterance.pitch = finalPitch;
    utterance.volume = 1;

    synth.speak(utterance);
}

// =========== MIC BUTTON CLICK (TOGGLE LOGIC) ============================
micBtn.addEventListener("click", () => {
    // 1. Check Global Mute
    if (isMicMuted()) {
        triggerToast("Microphone is Muted", "mic_off");
        return;
    }

    // 2. Stop if listening
    if (isListening) {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove("listening");
        if (micStatus) micStatus.innerText = "Tap to Speak";
        triggerToast("Microphone Stopped", "stop_circle");
        return;
    }

    // 3. Start Listening
    try {
        recognition.start();
        isListening = true;
        micBtn.classList.add("listening");
        triggerToast("Listening...", "mic");
        if (micStatus) micStatus.innerText = "Listening...";
    } catch (err) {
        console.error("Mic start error:", err);
    }
});

// ============ VOICE RESULT ======================
recognition.onresult = (event) => {
    const userText = event.results[0][0].transcript.trim().toLowerCase();
    if (!userText) return;

    addUserMessage(userText);

    // Weather Check
    const weatherMatch = userText.match(/weather (in|is)?\s*(.+)/);
    if (weatherMatch) {
        const city = weatherMatch[2].trim();
        if(window.fetchWeather) {
            window.fetchWeather(city); 
            speak(`Fetching weather for ${city}`);
        }
        return; 
    }

    // Dummy AI Reply
    setTimeout(() => {
        const reply = getDummyReply(userText);
        addAIMessage(reply);
        speak(reply);
    }, 500);
};

// ============= MIC END EVENT =========================
recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove("listening");
    if (micStatus) micStatus.innerText = "Tap to Speak";
};

// =============================== UI HELPERS ===============================
function addUserMessage(text) {
    const msg = document.createElement("div");
    msg.className = "flex justify-end gap-3 animate-fade-in-up";
    msg.innerHTML = `
    <div class="flex flex-col items-end max-w-[80%]">
      <div class="bg-[#28273a] p-4 rounded-2xl rounded-tr-none text-sm text-white shadow-md">${text}</div>
    </div>`;
    chatArea.appendChild(msg);
    scrollChat();
}

function addAIMessage(text) {
    const msg = document.createElement("div");
    msg.className = "flex items-start gap-3 animate-fade-in-up";
    msg.innerHTML = `
    <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
      <span class="material-symbols-rounded text-white" style="font-size:16px">smart_toy</span>
    </div>
    <div class="flex flex-col max-w-[80%]">
      <div class="bg-primary/10 border border-primary/20 p-4 rounded-2xl rounded-tl-none text-sm text-slate-800 dark:text-slate-200 shadow-sm">${text}</div>
    </div>`;
    chatArea.appendChild(msg);
    scrollChat();
}

function scrollChat() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ================ DUMMY AI LOGIC ===============================
function getDummyReply(input) {
    input = input.toLowerCase();
    if (input.includes("weather")) return "🌤️ The weather is pleasant today.";
    if (input.includes("task")) return "You have three pending tasks.";
    if (input.includes("reminder")) return "I can help you set reminders.";
    if (input.includes("hello") || input.includes("hi")) return "Hello! How can I help you?";
    return "I am listening and learning.";
}
