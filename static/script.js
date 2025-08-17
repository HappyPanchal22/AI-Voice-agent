
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

let streamRecorder;
let streamSocket;

const startStreamBtn = document.getElementById("start-streaming");
const stopStreamBtn = document.getElementById("stop-streaming");
const statusEl = document.getElementById("stream-status");

if (startStreamBtn) {
  startStreamBtn.onclick = async () => {
    streamSocket = new WebSocket("ws://localhost:8000/ws/audio");

    streamSocket.onopen = () => {
      statusEl.textContent = "Streaming started...";
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRecorder = new MediaRecorder(stream);

    streamRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && streamSocket.readyState === WebSocket.OPEN) {
        event.data.arrayBuffer().then(buffer => {
          streamSocket.send(buffer);
        });
      }
    };

    streamRecorder.start(250); // send every 250ms
    startStreamBtn.disabled = true;
    stopStreamBtn.disabled = false;
  };

  stopStreamBtn.onclick = () => {
    if (streamRecorder && streamRecorder.state !== "inactive") {
      streamRecorder.stop();
    }
    if (streamSocket) {
      streamSocket.close();
    }
    statusEl.textContent = "Streaming stopped. Audio saved on server.";
    startStreamBtn.disabled = false;
    stopStreamBtn.disabled = true;
  };
}
