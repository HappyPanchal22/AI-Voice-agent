/*document.addEventListener("DOMContentLoaded", () => {
  // --- MAIN DOM ELEMENTS (for other features) ---
  const transcriptP = document.getElementById("transcript");
  const startButton = document.getElementById('start-recording');
  const stopButton = document.getElementById('stop-recording');
  const recordedAudio = document.getElementById('recorded-audio');
  const statusDiv = document.getElementById("uploadStatus");
  const chatHistoryDiv = document.getElementById("chat-history");
  const generateBtn = document.getElementById("generateAudio");
  const audioPlayer = document.getElementById("audioPlayer");
  const askAIButton = document.getElementById("ask-ai");
  const stopAIButton = document.getElementById("stop-ai");
  const aiAudio = document.getElementById("ai-audio");
  const aiTranscriptDiv = document.getElementById("ai-transcript");
  const conversationAudio = document.getElementById('conversation-audio');
  const conversationBox = document.getElementById('conversation-text-box');

  // --- Echo Bot v1 Elements ---
  const startButtonV1 = document.getElementById('start-recording-v1');
  const stopButtonV1 = document.getElementById('stop-recording-v1');
  const recordedAudioV1 = document.getElementById('recorded-audio-v1');
  const statusDivV1 = document.getElementById('uploadStatus-v1');
  const transcriptPV1 = document.getElementById('transcript-v1');

  // --- Echo Bot v2 Elements ---
  const startButtonV2 = document.getElementById('start-recording-v2');
  const stopButtonV2 = document.getElementById('stop-recording-v2');
  const recordedAudioV2 = document.getElementById('recorded-audio-v2');
  const statusDivV2 = document.getElementById('uploadStatus-v2');
  const transcriptPV2 = document.getElementById('transcript-v2');

  // --- SESSION ID ---
  function getSessionId() {
    const qs = new URLSearchParams(window.location.search);
    let id = qs.get("session_id");
    if (!id) {
      id = crypto.randomUUID();
      window.location.search = "?session_id=" + id;
    }
    return id;
  }
  const sessionId = getSessionId();

  //----------------------------------------------------------------------
  // === ECHO BOT V1: Local voice echo + transcript ===
  //----------------------------------------------------------------------
  let mediaRecorderV1;
  let recordedChunksV1 = [];

  startButtonV1.addEventListener('click', async () => {
    transcriptPV1.innerHTML = "";
    statusDivV1.innerText = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderV1 = new MediaRecorder(stream);
      recordedChunksV1 = [];
      mediaRecorderV1.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksV1.push(event.data);
      };
      mediaRecorderV1.onstop = async () => {
        const audioBlob = new Blob(recordedChunksV1, { type: 'audio/webm' });
        // Play back the recorded voice
        recordedAudioV1.src = URL.createObjectURL(audioBlob);
        recordedAudioV1.play();
        statusDivV1.innerText = "Uploading audio...";
        // Optionally, upload the file and show metadata + transcript
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, `echo_${Date.now()}.webm`);
          const response = await fetch("/upload_audio", { method: "POST", body: formData });
          const result = await response.json();
          statusDivV1.innerText = `Uploaded! (Name: ${result.filename}, Type: ${result.content_type}, Size: ${result.size} bytes)`;
          // Transcribe locally using backend if needed (optional, for transcript display)
          // Or leave transcript empty for v1, unless you want server transcript:
          const transcribeFormData = new FormData();
          transcribeFormData.append("file", audioBlob, `echo_${Date.now()}.webm`);
          const transcriptRes = await fetch("/transcribe_audio", { method: "POST", body: transcribeFormData });
          const transcriptData = await transcriptRes.json();
          transcriptPV1.innerHTML = `Transcript: "${transcriptData.transcription || ''}"`;
        } catch {
          statusDivV1.innerText = "Upload/transcription failed.";
        }
      };
      mediaRecorderV1.start();
      startButtonV1.disabled = true;
      stopButtonV1.disabled = false;
    } catch (error) {
      console.error("Microphone access (v1) error:", error);
      alert('Unable to access microphone for Echo v1.');
    }
  });

  stopButtonV1.addEventListener('click', () => {
    if (mediaRecorderV1 && mediaRecorderV1.state === "recording") {
      mediaRecorderV1.stop();
      startButtonV1.disabled = false;
      stopButtonV1.disabled = true;
    }
  });

  //----------------------------------------------------------------------
  // === ECHO BOT V2: Murf voice echo + transcript ===
  //----------------------------------------------------------------------
  let mediaRecorderV2;
  let recordedChunksV2 = [];

  startButtonV2.addEventListener('click', async () => {
    transcriptPV2.innerHTML = "";
    statusDivV2.innerText = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderV2 = new MediaRecorder(stream);
      recordedChunksV2 = [];
      mediaRecorderV2.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksV2.push(event.data);
      };
      mediaRecorderV2.onstop = async () => {
        const audioBlob = new Blob(recordedChunksV2, { type: 'audio/webm' });
        statusDivV2.innerText = "Uploading and processing with Murf...";
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, `echo_murf_${Date.now()}.webm`);
          const response = await fetch("/tts/echo", { method: "POST", body: formData });
          const result = await response.json();
          recordedAudioV2.src = result.audio_url;
          recordedAudioV2.play();
          let transcriptText = `Transcript: "${result.transcription || ''}"`;
          if (result.error) transcriptText += `<br>Error: ${result.error}`;
          transcriptPV2.innerHTML = transcriptText;
          statusDivV2.innerText = "Echoed in Murf's voice!";
        } catch {
          statusDivV2.innerText = "Echo or transcription failed.";
        }
      };
      mediaRecorderV2.start();
      startButtonV2.disabled = true;
      stopButtonV2.disabled = false;
    } catch (error) {
      console.error("Microphone access (v2) error:", error);
      alert('Unable to access microphone for Echo v2.');
    }
  });

  stopButtonV2.addEventListener('click', () => {
    if (mediaRecorderV2 && mediaRecorderV2.state === "recording") {
      mediaRecorderV2.stop();
      startButtonV2.disabled = false;
      stopButtonV2.disabled = true;
    }
  });

  //----------------------------------------------------------------------

  // All your other features (Text-to-Speech, AI Chat, Conversation Review)
  // ... (existing code unchanged -- as in your script)

  // === Text-to-Speech Button ===
  generateBtn?.addEventListener("click", async () => {
    const text = document.getElementById("textInput").value;
    if (!text) {
      alert("Please enter some text");
      return;
    }
    try {
      const res = await fetch("/generate_audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      audioPlayer.src = data.audio_url;
      audioPlayer.load();
      audioPlayer.play();
      statusDiv.innerHTML = "";
      if (data.error) {
        statusDiv.innerHTML = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      audioPlayer.src = "/static/fallback_audio.mp3";
      audioPlayer.play();
    }
  });

  // === AI Voice Chat Logic (unchanged) ===
  let aiRecorder;
  let aiChunks = [];
  askAIButton.addEventListener('click', async () => {
    if (!aiTranscriptDiv) return;
    aiTranscriptDiv.innerText = "Listening...";
    stopAIButton.disabled = false;
    askAIButton.disabled = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      aiRecorder = new MediaRecorder(stream);
      aiChunks = [];
      aiRecorder.ondataavailable = e => { if (e.data.size > 0) aiChunks.push(e.data); };
      aiRecorder.onstop = async () => {
        const blob = new Blob(aiChunks, {type: 'audio/webm'});
        const formData = new FormData();
        formData.append("file", blob, `ai_recording_${Date.now()}.webm`);
        try {
          const response = await fetch(`/agent/chat/${sessionId}`, {
            method: "POST",
            body: formData
          });
          const data = await response.json();
          let aiTranscriptHtml = data.history?.slice(-4).map(msg => `
            <div><strong>${msg.role === "user" ? "🧑 You" : "🤖 Bot"}:</strong> ${msg.content || msg.text}</div>
          `).join("") || "🤖 Sorry, I couldn't process that right now.";
          if (data.error) {
            aiTranscriptHtml += `<br>Error: ${data.error}`;
          }
          aiTranscriptDiv.innerHTML = aiTranscriptHtml;
          aiAudio.src = data.audio_url;
          aiAudio.play();
          if (chatHistoryDiv && data.history) {
            chatHistoryDiv.innerHTML = data.history.slice(-12).map(msg => `
              <div class="message-row">
                <span class="message-${msg.role === "user" ? "user" : "bot"}">
                  ${msg.role === "user" ? "You" : "Bot"}
                </span>
                <span class="message-text">${msg.content || msg.text}</span>
              </div>
            `).join("");
          }
          if (conversationAudio) {
            conversationAudio.src = data.audio_url;
            conversationAudio.load();
          }
          if (conversationBox) {
            conversationBox.innerHTML = `<strong>You:</strong> ${data.transcription || ''}<br>
                                         <strong>Bot:</strong> ${data.bot_response || data.llm_response || ''}`;
          }
        } catch (err) {
          console.error("AI Chat error:", err);
          aiTranscriptDiv.innerHTML = "🤖 Sorry, I’m having trouble right now.";
          aiAudio.src = "/static/fallback_audio.mp3";
          aiAudio.play();
        } finally {
          askAIButton.disabled = false;
          stopAIButton.disabled = true;
        }
      };
      aiRecorder.start();
    } catch (err) {
      aiTranscriptDiv.innerText = "❌ Unable to access microphone.";
      askAIButton.disabled = false;
      stopAIButton.disabled = true;
    }
  });

  stopAIButton.addEventListener('click', () => {
    if (aiRecorder && aiRecorder.state === "recording") {
      aiRecorder.stop();
      stopAIButton.disabled = true;
      askAIButton.disabled = false;
    }
  });
});*/


/*document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // --- MAIN DOM ELEMENTS (AI Chat)
  // ===============================
  const chatHistoryDiv = document.getElementById("chat-history");
  const aiAudio = document.getElementById("ai-audio");
  const aiTranscriptDiv = document.getElementById("ai-transcript");
  const recordAIButton = document.getElementById("record-ai");
  const recordBtnLabel = document.getElementById("record-button-label");
  const conversationAudio = document.getElementById('conversation-audio');
  const conversationBox = document.getElementById('conversation-text-box');

  // --- SESSION ID ---
  function getSessionId() {
    const qs = new URLSearchParams(window.location.search);
    let id = qs.get("session_id");
    if (!id) {
      id = crypto.randomUUID();
      window.location.search = "?session_id=" + id;
    }
    return id;
  }
  const sessionId = getSessionId();

  /* =========================================================
     ==== COMMENTED OUT: ECHO BOT v1 Logic ====
  ========================================================= 
  
  const startButtonV1 = document.getElementById('start-recording-v1');
  const stopButtonV1 = document.getElementById('stop-recording-v1');
  const recordedAudioV1 = document.getElementById('recorded-audio-v1');
  const statusDivV1 = document.getElementById('uploadStatus-v1');
  const transcriptPV1 = document.getElementById('transcript-v1');
  

  /* =========================================================
     ==== COMMENTED OUT: ECHO BOT v2 Logic ====
  ========================================================= 
  
  const startButtonV2 = document.getElementById('start-recording-v2');
  const stopButtonV2 = document.getElementById('stop-recording-v2');
  const recordedAudioV2 = document.getElementById('recorded-audio-v2');
  const statusDivV2 = document.getElementById('uploadStatus-v2');
  const transcriptPV2 = document.getElementById('transcript-v2');
  


  /* =========================================================
     ==== COMMENTED OUT: TEXT-TO-SPEECH Logic ====
  ========================================================= 
  
  const generateBtn = document.getElementById("generateAudio");
  const audioPlayer = document.getElementById("audioPlayer");
  generateBtn?.addEventListener("click", async () => {
    
  });
  

  // =========================================================
  // === AI VOICE CHAT — SINGLE RECORD BUTTON (Day 12) ===
  // =========================================================
  let aiRecorder;
  let aiChunks = [];
  let recording = false;

  function setRecordingState(isRecording) {
    recording = isRecording;
    if (isRecording) {
      document.body.classList.add('recording');
      recordBtnLabel.textContent = "Stop Listening";
      recordAIButton.classList.add("pulse");
    } else {
      document.body.classList.remove('recording');
      recordBtnLabel.textContent = "Start Listening";
      recordAIButton.classList.remove("pulse");
    }
  }

  recordAIButton.addEventListener('click', async () => {
    if (!recording) {
      // --- START Recording
      setRecordingState(true);
      aiTranscriptDiv.innerHTML = "<em>Listening...</em>";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        aiRecorder = new MediaRecorder(stream);
        aiChunks = [];
        aiRecorder.ondataavailable = e => { if (e.data.size > 0) aiChunks.push(e.data); };
        aiRecorder.onstop = async () => {
          setRecordingState(false);
          aiTranscriptDiv.innerHTML = "<em>Processing...</em>";
          const blob = new Blob(aiChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append("file", blob, `ai_recording_${Date.now()}.webm`);
          try {
            const response = await fetch(`/agent/chat/${sessionId}`, {
              method: "POST",
              body: formData
            });
            const data = await response.json();
            // Auto-play AI audio
            aiAudio.src = data.audio_url;
            aiAudio.play();
            // Render transcript/history
            let aiTranscriptHtml = data.history?.slice(-4).map(msg => `
              <div><strong>${msg.role === "user" ? "🧑 You" : "🤖 Bot"}:</strong> ${msg.content || msg.text}</div>
            `).join("") || "🤖 Sorry, I couldn't process that right now.";
            if (data.error) {
              aiTranscriptHtml += `<br>Error: ${data.error}`;
            }
            aiTranscriptDiv.innerHTML = aiTranscriptHtml;
            if (chatHistoryDiv && data.history) {
              chatHistoryDiv.innerHTML = data.history.slice(-12).map(msg => `
                <div class="message-row">
                  <span class="message-${msg.role === "user" ? "user" : "bot"}">
                    ${msg.role === "user" ? "You" : "Bot"}
                  </span>
                  <span class="message-text">${msg.content || msg.text}</span>
                </div>
              `).join("");
            }
            if (conversationAudio) {
              conversationAudio.src = data.audio_url;
              conversationAudio.load();
            }
            if (conversationBox) {
              conversationBox.innerHTML = `<strong>You:</strong> ${data.transcription || ''}<br>
                                           <strong>Bot:</strong> ${data.bot_response || data.llm_response || ''}`;
            }
          } catch (err) {
            console.error("AI Chat error:", err);
            aiTranscriptDiv.innerHTML = "🤖 Sorry, I’m having trouble right now.";
            aiAudio.src = "/static/fallback_audio.mp3";
            aiAudio.play();
          }
        };
        aiRecorder.start();
      } catch (err) {
        setRecordingState(false);
        aiTranscriptDiv.innerText = "❌ Unable to access microphone.";
      }
    } else {
      // --- STOP Recording
      if (aiRecorder && aiRecorder.state === "recording") {
        aiRecorder.stop();
      }
    }
  });

});*/

document.addEventListener("DOMContentLoaded", () => {
  // --- MAIN DOM ELEMENTS ---
  const generateBtn = document.getElementById("generateAudio");
  const audioPlayer = document.getElementById("audioPlayer");

  // --- Voice AI Chatbot Elements ---
  const recordAIButton = document.getElementById("record-ai");
  const recordButtonLabel = document.getElementById("record-button-label");
  const aiAudio = document.getElementById("ai-audio");
  const aiTranscriptDiv = document.getElementById("ai-transcript");

  // Store chat history (frontend only)
  let chatHistory = [];

  // --- Echo Bot v1 Elements ---
  const startButtonV1 = document.getElementById('start-recording-v1');
  const stopButtonV1 = document.getElementById('stop-recording-v1');
  const recordedAudioV1 = document.getElementById('recorded-audio-v1');
  const statusDivV1 = document.getElementById('uploadStatus-v1');
  const transcriptPV1 = document.getElementById('transcript-v1');

  // --- Echo Bot v2 Elements ---
  const startButtonV2 = document.getElementById('start-recording-v2');
  const stopButtonV2 = document.getElementById('stop-recording-v2');
  const recordedAudioV2 = document.getElementById('recorded-audio-v2');
  const statusDivV2 = document.getElementById('uploadStatus-v2');
  const transcriptPV2 = document.getElementById('transcript-v2');

  // --- Session ID ---
  function getSessionId() {
    const qs = new URLSearchParams(window.location.search);
    let id = qs.get("session_id");
    if (!id) {
      id = crypto.randomUUID();
      window.location.search = "?session_id=" + id;
    }
    return id;
  }
  const sessionId = getSessionId();

  // --- Generate Voice (TTS) ---
  if (generateBtn && audioPlayer) {
    generateBtn.addEventListener("click", async () => {
      const textInput = document.querySelector("input[type='text']");
      const text = textInput?.value.trim();
      if (!text) {
        alert("Please type a message before generating voice.");
        return;
      }
      try {
        const res = await fetch(`/generate_audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.audio_url) {
          audioPlayer.src = data.audio_url;
          audioPlayer.play();
        } else {
          alert("TTS failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("TTS error:", err);
        alert("Error generating voice.");
      }
    });
  }

  // --- Voice AI Chatbot (toggle start/stop) ---
  if (recordAIButton && aiAudio && aiTranscriptDiv) {
    let mediaRecorderAI;
    let recordedChunksAI = [];
    let isRecordingAI = false;

    recordAIButton.addEventListener("click", async () => {
      if (!isRecordingAI) {
        // Start recording
        aiTranscriptDiv.innerHTML = "Listening...";
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderAI = new MediaRecorder(stream);
          recordedChunksAI = [];

          mediaRecorderAI.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksAI.push(e.data);
          };

          mediaRecorderAI.onstop = async () => {
            const audioBlob = new Blob(recordedChunksAI, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("file", audioBlob, `ai_listen_${Date.now()}.webm`);

            try {
              const res = await fetch(`/agent/chat/${sessionId}`, { method: "POST", body: formData });
              const data = await res.json();
              if (data.audio_url) {
                aiAudio.src = data.audio_url;
                aiAudio.style.display = "block";
                aiAudio.play();
              }

              if (data.transcription && data.bot_response) {
                // Append to chat history
                chatHistory.push({
                  role: "user",
                  text: data.transcription
                });
                chatHistory.push({
                  role: "bot",
                  text: data.bot_response
                });

                // Render chat history
                aiTranscriptDiv.innerHTML = chatHistory.map(msg =>
                  `<div><strong>${msg.role === "user" ? "You" : "Bot"}:</strong> ${msg.text}</div>`
                ).join("");
              }

            } catch (err) {
              console.error("AI listen error:", err);
              aiTranscriptDiv.innerHTML = "Error processing AI response.";
            }
          };

          mediaRecorderAI.start();
          isRecordingAI = true;
          recordButtonLabel.textContent = "Stop Listening";
          recordAIButton.classList.add("recording");

        } catch (err) {
          console.error("Microphone error:", err);
          alert("Unable to access microphone.");
        }
      } else {
        // Stop recording
        if (mediaRecorderAI && mediaRecorderAI.state === "recording") {
          mediaRecorderAI.stop();
        }
        isRecordingAI = false;
        recordButtonLabel.textContent = "Start Listening";
        recordAIButton.classList.remove("recording");
      }
    });
  }

  // --- Echo Bot v1 ---
  if (startButtonV1 && stopButtonV1 && recordedAudioV1 && statusDivV1 && transcriptPV1) {
    let mediaRecorderV1;
    let recordedChunksV1 = [];
    startButtonV1.addEventListener('click', async () => {
      transcriptPV1.innerHTML = "";
      statusDivV1.innerText = "";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderV1 = new MediaRecorder(stream);
        recordedChunksV1 = [];
        mediaRecorderV1.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksV1.push(event.data);
        };
        mediaRecorderV1.onstop = async () => {
          const audioBlob = new Blob(recordedChunksV1, { type: 'audio/webm' });
          recordedAudioV1.src = URL.createObjectURL(audioBlob);
          recordedAudioV1.play();
          statusDivV1.innerText = "Uploading audio...";
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, `echo_${Date.now()}.webm`);
            const response = await fetch("/upload_audio", { method: "POST", body: formData });
            const result = await response.json();
            statusDivV1.innerText = `Uploaded! (Name: ${result.filename})`;
            const transcribeFormData = new FormData();
            transcribeFormData.append("file", audioBlob, `echo_${Date.now()}.webm`);
            const transcriptRes = await fetch("/transcribe_audio", { method: "POST", body: transcribeFormData });
            const transcriptData = await transcriptRes.json();
            transcriptPV1.innerHTML = `Transcript: "${transcriptData.transcription || ''}"`;
          } catch {
            statusDivV1.innerText = "Upload/transcription failed.";
          }
        };
        mediaRecorderV1.start();
        startButtonV1.disabled = true;
        stopButtonV1.disabled = false;
      } catch (error) {
        console.error("Microphone access (v1) error:", error);
        alert('Unable to access microphone for Echo v1.');
      }
    });
    stopButtonV1.addEventListener('click', () => {
      if (mediaRecorderV1 && mediaRecorderV1.state === "recording") {
        mediaRecorderV1.stop();
        startButtonV1.disabled = false;
        stopButtonV1.disabled = true;
      }
    });
  }

  // --- Echo Bot v2 ---
  if (startButtonV2 && stopButtonV2 && recordedAudioV2 && statusDivV2 && transcriptPV2) {
    let mediaRecorderV2;
    let recordedChunksV2 = [];
    startButtonV2.addEventListener('click', async () => {
      transcriptPV2.innerHTML = "";
      statusDivV2.innerText = "";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderV2 = new MediaRecorder(stream);
        recordedChunksV2 = [];
        mediaRecorderV2.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksV2.push(event.data);
        };
        mediaRecorderV2.onstop = async () => {
          const audioBlob = new Blob(recordedChunksV2, { type: 'audio/webm' });
          statusDivV2.innerText = "Uploading and processing with Murf...";
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, `echo_murf_${Date.now()}.webm`);
            const response = await fetch("/tts/echo", { method: "POST", body: formData });
            const result = await response.json();
            recordedAudioV2.src = result.audio_url;
            recordedAudioV2.play();
            let transcriptText = `Transcript: "${result.transcription || ''}"`;
            if (result.error) transcriptText += `<br>Error: ${result.error}`;
            transcriptPV2.innerHTML = transcriptText;
            statusDivV2.innerText = "Echoed in Murf's voice!";
          } catch {
            statusDivV2.innerText = "Echo or transcription failed.";
          }
        };
        mediaRecorderV2.start();
        startButtonV2.disabled = true;
        stopButtonV2.disabled = false;
      } catch (error) {
        console.error("Microphone access (v2) error:", error);
        alert('Unable to access microphone for Echo v2.');
      }
    });
    stopButtonV2.addEventListener('click', () => {
      if (mediaRecorderV2 && mediaRecorderV2.state === "recording") {
        mediaRecorderV2.stop();
        startButtonV2.disabled = false;
        stopButtonV2.disabled = true;
      }
    });
  }
});
