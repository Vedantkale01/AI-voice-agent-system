const synth = window.speechSynthesis;
    let voices = [];

    function populateVoices() {
        voices = synth.getVoices();
    }
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    function previewVoice(event, persona) {
        event.preventDefault(); 
        event.stopPropagation();

        if (synth.speaking) {
            synth.cancel();
            resetIcons();
            return;
        }

        const langBox = document.getElementById('lang');
        // Get the base language code (e.g. 'hi' from 'hi-in')
        const langCode = langBox.value.toLowerCase().split('-')[0];

        let text = "";
        let selectedVoice = null;
        
        // Base Pitch/Rate from sliders
        let basePitch = parseFloat(document.getElementById('rng-ptch').value);
        let baseRate = parseFloat(document.getElementById('rng-spd').value);

        // --- HINDI LOGIC ---
        if (langCode === 'hi') {
            // 1. Text
            if (persona === 'atlas') text = "नमस्ते, मैं एटलस हूँ। मैं आपका सहायक हूँ।";
            else if (persona === 'luna') text = "नमस्ते, मैं लूना हूँ। आपकी क्या सेवा करूँ?";
            else text = "नमस्ते, नेक्सस सिस्टम ऑनलाइन है।";

            // 2. Find ANY Hindi Voice
            selectedVoice = voices.find(v => v.lang.toLowerCase().includes('hi'));

            // 3. THE FIX: Pitch Shifting to simulate Personas
            // If we found a voice, we tweak the pitch to fake male/female
            if (selectedVoice) {
                if (persona === 'atlas') {
                    // Force Deep Pitch for Male
                    basePitch = 0.6; 
                } else if (persona === 'luna') {
                    // Force High Pitch for Female
                    basePitch = 1.2;
                } else {
                    // Neutral
                    basePitch = 1.0;
                }
            } else {
                // No Hindi voice found
                text = "Hindi voice not available.";
                selectedVoice = voices[0];
            }
        } 
        
        // --- ENGLISH LOGIC ---
        else {
            if (persona === 'atlas') text = "Hello, I am Atlas.";
            else if (persona === 'luna') text = "Hi, I am Luna.";
            else text = "System Online.";

            // Try to find specific gender voices for English
            if (persona === 'luna') {
                selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')));
                if(!selectedVoice) basePitch = 1.2; // Fallback pitch shift
            } else {
                selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Male') || v.name.includes('David')));
                if(!selectedVoice) basePitch = 0.7; // Fallback pitch shift
            }
        }

        // Fallback
        if (!selectedVoice) selectedVoice = voices[0];

        // Play
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.voice = selectedVoice;
        utterThis.pitch = basePitch;
        utterThis.rate = baseRate;

        // Icon Animation
        const iconSpan = document.querySelector(`.icon-${persona}`);
        resetIcons();
        if(iconSpan) iconSpan.textContent = 'stop';

        utterThis.onend = function() {
            if(iconSpan) iconSpan.textContent = 'play_arrow';
        };

        synth.speak(utterThis);
    }

    function resetIcons() {
        document.querySelectorAll('[class*="icon-"]').forEach(icon => {
            icon.textContent = 'play_arrow';
        });
    }
