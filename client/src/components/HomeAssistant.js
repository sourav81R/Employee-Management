import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/homeAssistant.css";

const DEFAULT_HINTS = [
  "Summarize my attendance and leave status.",
  "What should I focus on today in this dashboard?",
  "Explain my role permissions in simple words.",
];

const VOICE_INPUT_UNAVAILABLE = "Voice input is not supported in this browser.";

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3.23v17.54a1 1 0 0 1-1.64.77L7.69 18H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3.69l4.67-3.54A1 1 0 0 1 14 3.23z" />
      <path d="M16.5 8.5a1 1 0 0 1 1.41 0A5 5 0 0 1 19.4 12a5 5 0 0 1-1.49 3.5 1 1 0 0 1-1.41-1.41A3 3 0 0 0 17.4 12a3 3 0 0 0-.9-2.09 1 1 0 0 1 0-1.41z" />
      <path d="M18.95 5.55a1 1 0 0 1 1.41 0A9 9 0 0 1 23 12a9 9 0 0 1-2.64 6.45 1 1 0 0 1-1.41-1.41A7 7 0 0 0 21 12a7 7 0 0 0-2.05-5.04 1 1 0 0 1 0-1.41z" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3.23v17.54a1 1 0 0 1-1.64.77L7.69 18H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3.69l4.67-3.54A1 1 0 0 1 14 3.23z" />
      <path d="M21.71 8.29a1 1 0 0 0-1.42 0L18 10.59l-2.29-2.3a1 1 0 0 0-1.42 1.42L16.59 12l-2.3 2.29a1 1 0 1 0 1.42 1.42L18 13.41l2.29 2.3a1 1 0 0 0 1.42-1.42L19.41 12l2.3-2.29a1 1 0 0 0 0-1.42z" />
    </svg>
  );
}

function normalizeHistory(messages) {
  return messages
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      text: String(message.text || "").trim(),
    }))
    .filter((message) => message.text);
}

function pickPreferredIndianFemaleVoice(voices) {
  const list = Array.isArray(voices) ? voices : [];
  if (!list.length) return null;

  const femaleHints = [
    "female",
    "woman",
    "samantha",
    "veena",
    "lekha",
    "zira",
    "siri",
  ];

  const scored = list
    .map((voice) => {
      const lang = String(voice?.lang || "").toLowerCase();
      const name = String(voice?.name || "").toLowerCase();
      let score = 0;

      if (lang === "en-in") score += 70;
      else if (lang === "hi-in") score += 66;
      else if (lang.endsWith("-in")) score += 58;
      else if (lang.startsWith("en")) score += 20;

      if (name.includes("india") || name.includes("hindi")) score += 15;
      if (femaleHints.some((hint) => name.includes(hint))) score += 24;
      if (name.includes("male")) score -= 30;
      if (voice?.localService) score += 4;
      if (voice?.default) score += 2;

      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice || null;
}

async function requestAssistantReply(prompt, history) {
  const token = localStorage.getItem("token");
  const response = await fetch(buildApiUrl("/api/assistant/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ prompt, history }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Could not reach the assistant right now.");
  }

  const answer = String(payload?.answer || "").trim();
  if (!answer) {
    throw new Error("Assistant returned an empty response.");
  }
  return answer;
}

function toFriendlyAssistantError(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (
    lower.includes("assistant is not configured")
    || lower.includes("gemini_api_key")
    || lower.includes("invalid gemini api key")
    || lower.includes("invalid api key")
  ) {
    return "Assistant setup is incomplete. Add a valid Gemini API key in server/.env and restart backend.";
  }

  if (lower.includes("quota")) {
    return "Gemini usage quota is exceeded. Please check billing/quota and try again.";
  }

  if (lower.includes("unauthorized") || lower.includes("token")) {
    return "Session issue detected. Please log in again.";
  }

  return text || "Assistant failed. Please try again.";
}

export default function HomeAssistant({ userName }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi ${userName}. You can type or use voice. I will answer with your account context.`,
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [preferredVoice, setPreferredVoice] = useState(null);

  const threadRef = useRef(null);
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);
  const sendPromptRef = useRef(() => {});
  const hints = useMemo(() => DEFAULT_HINTS, []);

  const voiceInputSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const voiceOutputSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window;
  }, []);

  useEffect(() => {
    if (!voiceOutputSupported || typeof window === "undefined") return undefined;

    const synth = window.speechSynthesis;
    const syncPreferredVoice = () => {
      const nextVoice = pickPreferredIndianFemaleVoice(synth.getVoices());
      setPreferredVoice(nextVoice || null);
    };

    syncPreferredVoice();

    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", syncPreferredVoice);
      return () => {
        synth.removeEventListener("voiceschanged", syncPreferredVoice);
      };
    }

    const previous = synth.onvoiceschanged;
    synth.onvoiceschanged = syncPreferredVoice;
    return () => {
      synth.onvoiceschanged = previous || null;
    };
  }, [voiceOutputSupported]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    sendPromptRef.current = sendPrompt;
  });

  useEffect(() => {
    if (!voiceInputSupported || typeof window === "undefined") return undefined;

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const spoken = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalTranscript += spoken;
        } else {
          interimTranscript += spoken;
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript).trim();
      setPrompt(currentTranscript);

      if (finalTranscript.trim()) {
        sendPromptRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event?.error === "not-allowed") {
        setError("Microphone permission denied. Allow microphone access and try again.");
      } else if (event?.error !== "aborted") {
        setError("Voice input failed. Please try again.");
      }
    };

    recognition.onstart = () => {
      setError("");
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onstart = null;
      recognition.onend = null;
      if (recognitionRef.current) {
        recognition.stop();
      }
    };
  }, [voiceInputSupported]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speakText(text) {
    if (!voiceReplyEnabled || !voiceOutputSupported || typeof window === "undefined") return;
    const voiceText = String(text || "").trim();
    if (!voiceText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceText);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.lang = preferredVoice?.lang || "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function sendPrompt(rawValue) {
    const cleanPrompt = String(rawValue || "").trim();
    if (!cleanPrompt || isThinking) return;

    const historyForApi = normalizeHistory(messages);
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: cleanPrompt }]);
    setPrompt("");
    setIsThinking(true);

    try {
      const answer = await requestAssistantReply(cleanPrompt, historyForApi);
      if (!isMountedRef.current) return;
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
      speakText(answer);
    } catch (err) {
      if (!isMountedRef.current) return;
      const failMessage = toFriendlyAssistantError(err?.message);
      setError(failMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I could not answer right now. Please try again." },
      ]);
    } finally {
      if (isMountedRef.current) {
        setIsThinking(false);
      }
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    sendPrompt(prompt);
  }

  function toggleVoiceInput() {
    if (!voiceInputSupported) {
      setError(VOICE_INPUT_UNAVAILABLE);
      return;
    }
    if (isThinking) return;

    setError("");
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (_err) {
      setError("Voice input is busy. Wait a second and try again.");
    }
  }

  function toggleVoiceReply() {
    if (!voiceOutputSupported) return;
    setVoiceReplyEnabled((prev) => {
      const next = !prev;
      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }

  return (
    <section className="home-assistant">
      <div className="assistant-glow assistant-glow-left" aria-hidden="true"></div>
      <div className="assistant-glow assistant-glow-right" aria-hidden="true"></div>

      <div className="assistant-header-row">
        <div className="assistant-head">
          <span className="assistant-badge">EmployeeHub AI</span>
          <h2>Ask your dashboard assistant</h2>
          <p>Type or talk. Replies are personalized to your logged-in account.</p>
          <div className="assistant-live">
            <span className="assistant-live-dot" aria-hidden="true"></span>
            <span>Live assistant ready</span>
          </div>
        </div>

        <div className="assistant-tools">
          <button
            type="button"
            className={`assistant-tool ${isListening ? "active" : ""}`}
            onClick={toggleVoiceInput}
            disabled={isThinking}
            title={isListening ? "Stop voice input" : "Start voice input"}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            <MicIcon />
            <span className="assistant-sr-only">{isListening ? "Stop mic" : "Start mic"}</span>
          </button>
          <button
            type="button"
            className={`assistant-tool ${voiceReplyEnabled ? "active" : "muted"}`}
            onClick={toggleVoiceReply}
            disabled={!voiceOutputSupported}
            title={voiceReplyEnabled ? "Mute assistant voice" : "Unmute assistant voice"}
            aria-label={voiceReplyEnabled ? "Mute assistant voice" : "Unmute assistant voice"}
          >
            {voiceReplyEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
            <span className="assistant-sr-only">
              {voiceReplyEnabled ? "Mute assistant voice" : "Unmute assistant voice"}
            </span>
          </button>
        </div>
      </div>

      {!voiceInputSupported && (
        <p className="assistant-inline-note">{VOICE_INPUT_UNAVAILABLE}</p>
      )}
      {!voiceOutputSupported && (
        <p className="assistant-inline-note">Voice output is not supported in this browser.</p>
      )}
      {error && <p className="assistant-error">{error}</p>}

      <div className="assistant-thread-shell">
        <div className="assistant-thread" ref={threadRef}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`assistant-message ${message.role === "user" ? "user" : "bot"}`}
            >
              <span className="assistant-role-label">
                {message.role === "user" ? "You" : "Assistant"}
              </span>
              <span className="assistant-message-body">{message.text}</span>
            </div>
          ))}
          {isThinking && (
            <div className="assistant-message bot thinking">
              <span className="assistant-role-label">Assistant</span>
              Thinking<span>.</span><span>.</span><span>.</span>
            </div>
          )}
        </div>
      </div>

      <div className="assistant-hints-block">
        <p className="assistant-hints-title">Suggested prompts</p>
        <div className="assistant-hints">
          {hints.map((hint) => (
            <button
              key={hint}
              type="button"
              className="assistant-hint-chip"
              onClick={() => sendPrompt(hint)}
              disabled={isThinking}
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      <form className="assistant-composer" onSubmit={onSubmit}>
        <span className="assistant-composer-mark" aria-hidden="true">✦</span>
        <input
          type="text"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={isListening ? "Listening..." : "Ask anything about your work data"}
          className="assistant-input"
          disabled={isThinking}
        />
        <button type="submit" className="assistant-send" disabled={isThinking || !prompt.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
