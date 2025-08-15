# <span> 🎙️ AI Voice Agent</span>
An interactive, voice-driven conversational agent powered by FastAPI, Murf AI, AssemblyAI, and Google Gemini.

Designed for natural, back-and-forth conversation with realistic TTS responses, smooth error handling, and a sleek, modern UI.

# <span>🚀 About the Project</span>

This project enables users to have real-time spoken conversations with an AI assistant directly in their browser.
It started as a minimal FastAPI backend serving an HTML/JS frontend and evolved into a fully featured application that:

- Records voice directly in the browser
- Transcribes speech to text
- Passes text (plus conversation context) to a Large Language Model for a reply
- Synthesizes that reply into natural-sounding speech using Murf AI
- Plays the audio and displays the conversation transcript and history
- Handles errors gracefully with fallback audio and messaging
- Includes multiple interaction modes such as Echo Bots and a text-to-speech demo.


# <span>🛠️ Technologies Used </span>

### <span> Frontend </span>
- HTML5, CSS3 – Responsive layout, animations, gradients
- JavaScript – Fetch API, event handling, DOM updates
- MediaRecorder API – Microphone audio capture
- HTML – Playback of generated or recorded audio

### <span> Backend </span>
- Python + FastAPI – Asynchronous RESTful API
- Uvicorn – ASGI server
- In-memory datastore – Conversation history per session

### <span> External APIs </span>

- Murf AI – Text-to-speech generation
- AssemblyAI – Speech-to-text transcription
- Google Gemini – LLM for conversational intelligence

# ✨ Work Carried Out

- **Backend setup** with FastAPI to serve static HTML/CSS/JS and REST endpoints  
- **Text-to-Speech:** Endpoint to generate Murf AI voice output from provided text  
- **Browser playback** of server-provided TTS audio  
- **Echo Bot v1:** Record voice and play back user’s own recorded audio  
- **Audio upload handling** to backend  
- **Transcription service** integration using AssemblyAI  
- **Echo Bot v2:** Record → Transcription → Murf AI TTS output  
- **LLM integration** with Google Gemini API for conversational responses  
- **Full pipeline:** Audio input → STT → LLM → TTS → Playback  
- **Session-based conversation memory** for context-aware replies  
- **Error handling** enhancements with try/except, fallback messages, and fallback audio  
- **UI revamp** with single animated record/stop button, centered layout, and responsive design  
- **Autoplay AI audio** with hidden player for a more seamless experience  

## 🤝 Acknowledgements

- **[FastAPI](https://fastapi.tiangolo.com/)** – Web framework  
- **[Murf AI](https://murf.ai/)** – Text-to-Speech  
- **[AssemblyAI](https://www.assemblyai.com/)** – Speech-to-Text  
- **[Google Gemini](https://deepmind.google/technologies/gemini/)** – Conversational LLM  


# <span> 🧩 Architecture </span>

```mermaid
flowchart TD
    %% Browser UI
    subgraph UI[Browser UI]
        A1["Record voice\n(MediaRecorder API)"]
        A2["Send audio to backend\n(Fetch API)"]
        A5["Play AI reply audio"]
        A6["Show transcript & bot response"]
        A7["Optionally auto-restart listening"]
    end

    %% FastAPI Backend
    subgraph BE[FastAPI Backend]
        B1["Store uploaded audio\n(/uploads)"]
        B2["Transcribe with AssemblyAI"]
        B3["Append message to session chat history"]
        B4["Send context to Google Gemini → AI text reply"]
        B5["Convert AI reply to voice with Murf AI"]
        B6["Return reply audio URL, transcript, history to UI"]
    end

    %% Flow connections
    A1 --> A2 --> B1 --> B2 --> B3 --> B4 --> B5 --> B6 --> A5
    A5 --> A6 --> A7

    %% Styling for groups
    style UI fill:#fdf5e6,stroke:#ff9900,stroke-width:2px,color:#222
    style BE fill:#e6f2ff,stroke:#0066cc,stroke-width:2px,color:#222

    %% Styling for individual nodes
    style A1 fill:#fff,stroke:#ff9900,stroke-width:1px,color:#222
    style A2 fill:#fff,stroke:#ff9900,stroke-width:1px,color:#222
    style A5 fill:#fff,stroke:#ff9900,stroke-width:1px,color:#222
    style A6 fill:#fff,stroke:#ff9900,stroke-width:1px,color:#222
    style A7 fill:#fff,stroke:#ff9900,stroke-width:1px,color:#222

    style B1 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222
    style B2 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222
    style B3 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222
    style B4 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222
    style B5 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222
    style B6 fill:#fff,stroke:#0066cc,stroke-width:1px,color:#222

