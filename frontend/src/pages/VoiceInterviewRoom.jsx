import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  generateInterviewEvaluation,
  getInterviewMessages,
  submitInterviewAnswer,
} from "../api/interviewService";

function getErrorMessage(error) {
  const data = error.response?.data;
  if (!data) return error.message || "Unable to connect to the server.";
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
      return `${field}: ${message}`;
    })
    .join(" ");
}

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceInterviewRoom({ session, initialQuestion, onExit }) {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion || null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [voiceState, setVoiceState] = useState("ready");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(session.status === "completed");
  const [evaluation, setEvaluation] = useState(null);
  const [generatingEvaluation, setGeneratingEvaluation] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [canStartAnswer, setCanStartAnswer] = useState(false);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const shouldSubmitOnStopRef = useRef(false);
  const answerFinishedAtRef = useRef(null);
  const submittingRef = useRef(false);
  const completedRef = useRef(session.status === "completed");
  const currentQuestionRef = useRef(initialQuestion || null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await getInterviewMessages(session.id);
        if (active) setMessages(data);
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      active = false;
    };
  }, [session.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // The browser may already have stopped recognition.
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function enableReadyToAnswer() {
    if (!mountedRef.current || completedRef.current) return;
    setCanStartAnswer(true);
    setVoiceState("ready");
  }

  async function waitUntilFiveSecondsAfterFinish() {
    const finishedAt = answerFinishedAtRef.current;
    answerFinishedAtRef.current = null;

    if (!finishedAt) return;

    const elapsed = Date.now() - finishedAt;
    const remaining = Math.max(0, 5000 - elapsed);

    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }
  }

  async function submitVoiceAnswer(spokenAnswer) {
    const answer = spokenAnswer.trim();
    const question = currentQuestionRef.current;

    if (!answer || !question || submittingRef.current || completedRef.current) {
      if (mountedRef.current) setVoiceState(completedRef.current ? "completed" : "ready");
      return;
    }

    submittingRef.current = true;
    setCanStartAnswer(false);
    setError("");
    setLiveTranscript(answer);
    setVoiceState("processing");

    try {
      const result = await submitInterviewAnswer(
        session.id,
        question.id,
        answer,
        "voice"
      );

      const aiMessage = result.ai_response || result.ai_message;
      const newMessages = [result.user_message, aiMessage, result.question_message].filter(Boolean);
      setMessages((previous) => [...previous, ...newMessages]);
      setLiveTranscript("");

      const aiSpeech = [
        aiMessage?.content,
        result.question_message?.content || result.next_question?.question_text,
      ]
        .filter((part) => typeof part === "string" && part.trim())
        .join(" ");

      // Give the candidate at least five seconds after selecting Finish my answer.
      // The AI request runs immediately; if it takes longer than five seconds,
      // the interviewer speaks as soon as the response is ready.
      await waitUntilFiveSecondsAfterFinish();
      if (!mountedRef.current) return;

      if (result.action === "complete") {
        completedRef.current = true;
        setCompleted(true);
        currentQuestionRef.current = null;
        setCurrentQuestion(null);
        if (aiSpeech) speakText(aiSpeech, false);
        else setVoiceState("completed");
      } else if (result.next_question) {
        currentQuestionRef.current = result.next_question;
        setCurrentQuestion(result.next_question);
        if (aiSpeech) speakText(aiSpeech, true);
        else enableReadyToAnswer();
      } else {
        setError("The interviewer did not return the next question. Please try again.");
        setVoiceState("ready");
      }
    } catch (requestError) {
      answerFinishedAtRef.current = null;
      setError(getErrorMessage(requestError));
      setVoiceState("ready");
    } finally {
      submittingRef.current = false;
    }
  }

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError("Voice recognition is not supported in this browser. Please use the latest Google Chrome browser.");
      setVoiceState("ready");
      return;
    }

    if (completedRef.current || submittingRef.current) return;

    try {
      setCanStartAnswer(false);
      shouldSubmitOnStopRef.current = false;
      answerFinishedAtRef.current = null;
      transcriptRef.current = "";
      setLiveTranscript("");
      setError("");

      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (mountedRef.current) setVoiceState("listening");
      };

      recognition.onresult = (event) => {
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0]?.transcript || "";
          if (event.results[index].isFinal) {
            transcriptRef.current = `${transcriptRef.current} ${transcript}`.trim();
          } else {
            interim = `${interim} ${transcript}`.trim();
          }
        }
        const displayText = `${transcriptRef.current} ${interim}`.trim();
        if (mountedRef.current) setLiveTranscript(displayText);
      };

      recognition.onerror = (event) => {
        const messagesByError = {
          "not-allowed": "Microphone permission was denied. Allow microphone access in your browser settings and try again.",
          "service-not-allowed": "The browser speech recognition service is unavailable.",
          network: "Speech recognition needs an internet connection. Check your connection and try again.",
          "no-speech": "No speech was detected. Select Try again and speak after the microphone starts listening.",
          "audio-capture": "No microphone was found. Connect or enable a microphone and try again.",
        };
        if (mountedRef.current) {
          setError(messagesByError[event.error] || `Speech recognition error: ${event.error}`);
          setVoiceState("ready");
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) recognitionRef.current = null;

        const finalAnswer = transcriptRef.current.trim();
        const shouldSubmit = shouldSubmitOnStopRef.current;
        shouldSubmitOnStopRef.current = false;

        if (shouldSubmit && finalAnswer && !submittingRef.current && !completedRef.current) {
          submitVoiceAnswer(finalAnswer);
        } else if (mountedRef.current && !completedRef.current) {
          setVoiceState("ready");
          if (shouldSubmit && !finalAnswer) {
            setError("I could not hear an answer. Select I'm ready to answer and try again.");
          } else if (!shouldSubmit && finalAnswer) {
            setError("Listening stopped unexpectedly. Please try again and select Finish my answer when you are done.");
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (startError) {
      setError(startError.message || "Unable to start the microphone. Please try again.");
      setVoiceState("ready");
    }
  }

  function speakText(text, listenAfter = true) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      if (listenAfter) enableReadyToAnswer();
      else setVoiceState("completed");
      return;
    }

    setCanStartAnswer(false);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = muted ? 0 : 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.lang?.toLowerCase() === "en-in")
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      if (mountedRef.current) setVoiceState("speaking");
    };
    utterance.onend = () => {
      if (!mountedRef.current) return;
      if (listenAfter && !completedRef.current) {
        enableReadyToAnswer();
      } else {
        setVoiceState("completed");
      }
    };
    utterance.onerror = () => {
      if (!mountedRef.current) return;
      if (listenAfter && !completedRef.current) enableReadyToAnswer();
      else setVoiceState("completed");
    };

    window.speechSynthesis.speak(utterance);
  }

  async function beginVoiceInterview() {
    if (!getSpeechRecognition()) {
      setError("Voice recognition is not supported in this browser. Please use the latest Google Chrome browser.");
      return;
    }

    try {
      // Request microphone permission directly from the user's button click.
      if (navigator.mediaDevices?.getUserMedia) {
        const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStream.getTracks().forEach((track) => track.stop());
      }

      setError("");
      setCanStartAnswer(false);
      setHasStarted(true);
      const greeting = `Hello! Welcome to your ${session.domain?.name || "interview"} interview for the ${session.target_role} role. Let's begin. ${initialQuestion?.question_text || "Please introduce yourself."}`;
      speakText(greeting, true);
    } catch (permissionError) {
      setError("Microphone access is required for a voice interview. Allow microphone access in Chrome and try again.");
      setVoiceState("ready");
    }
  }

  function stopListening() {
    try {
      if (!recognitionRef.current) return;
      answerFinishedAtRef.current = Date.now();
      shouldSubmitOnStopRef.current = true;
      setVoiceState("processing");
      recognitionRef.current.stop();
    } catch {
      shouldSubmitOnStopRef.current = false;
      setVoiceState("ready");
    }
  }

  function replayCurrentQuestion() {
    if (!currentQuestionRef.current?.question_text) return;
    speakText(currentQuestionRef.current.question_text, true);
  }

  async function handleGenerateEvaluation() {
    setError("");
    setGeneratingEvaluation(true);
    try {
      const report = await generateInterviewEvaluation(session.id);
      setEvaluation(report);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setGeneratingEvaluation(false);
    }
  }

  const statusLabel = {
    ready: canStartAnswer ? "Ready when you are" : "Ready",
    speaking: "AI interviewer is speaking",
    listening: "Listening to your answer",
    processing: "AI is considering your answer",
    completed: "Interview completed",
  }[voiceState] || "Ready";

  const statusColor = voiceState === "listening"
    ? "bg-emerald-50 text-emerald-700"
    : voiceState === "speaking"
    ? "bg-blue-50 text-blue-700"
    : voiceState === "processing"
    ? "bg-amber-50 text-amber-700"
    : "bg-[#F1F5F8] text-[#65788B]";

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">VOICE INTERVIEW</p>
          <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-[#293747]">
            {session.domain?.name || "Interview"} interview
          </h1>
          <p className="mt-1 text-xs text-[#8793A0]">
            {session.target_role} · {session.difficulty} · {session.interview_type}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Leave this interview? Your saved conversation will remain in History.")) onExit();
          }}
          className="inline-flex items-center gap-2 border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft size={14} /> Leave interview
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_0.75fr]">
        <section className="border border-[#E8ECF0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0F3] px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-[#78A2C8]" />
              <h2 className="text-sm font-semibold text-[#39495A]">Live conversation</h2>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${completed ? "bg-[#EEF7F1] text-[#4E8A69]" : statusColor}`}>
              {completed ? "Completed" : statusLabel}
            </span>
          </div>

          <div className="bg-[#FBFCFD] p-6 sm:p-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border bg-white ${voiceState === "speaking" ? "border-[#8DB9DC] shadow-[0_0_0_12px_#EEF5FA]" : "border-[#E2EAF0]"}`}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EDF4F9] text-[#6A98BE]">
                  <UserRound size={38} strokeWidth={1.4} />
                </div>
                {voiceState === "speaking" && <span className="absolute inset-0 animate-ping rounded-full border border-[#A8C9E2] opacity-40" />}
              </div>
              <p className="mt-4 text-sm font-semibold text-[#39495A]">PrepIt AI interviewer</p>
              <p className="mt-1 text-xs text-[#98A3AE]">Your virtual interview panel</p>

              <div className="mt-6 flex h-12 items-center justify-center gap-1.5" aria-label={statusLabel}>
                {Array.from({ length: 15 }).map((_, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-full transition-all ${voiceState === "speaking" ? "animate-pulse bg-[#6F9FC8]" : voiceState === "listening" ? "bg-emerald-500" : "bg-[#D5E0E8]"}`}
                    style={{ height: `${voiceState === "speaking" ? 12 + ((index * 13) % 29) : voiceState === "listening" ? 10 + ((index * 7) % 20) : 8}px`, animationDelay: `${index * 45}ms` }}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs font-medium text-[#718294]">{statusLabel}</p>
              <p className="mt-2 max-w-md text-xs leading-6 text-[#9AA5B0]">
                {voiceState === "speaking"
                  ? "Listen carefully. Your microphone stays off while the interviewer is speaking."
                  : voiceState === "listening"
                  ? "Speak naturally. Pause whenever you need; select Finish my answer when you are done."
                  : voiceState === "processing"
                  ? "Your answer has been received. The interviewer is preparing the next turn."
                  : completed
                  ? "You have completed the interview. Generate your report to review your performance."
                  : canStartAnswer
                  ? "When you are ready, select the button below to turn on your microphone."
                  : "The interviewer will speak to you, then give you time to think before you answer."}
              </p>

              {!hasStarted && !completed && (
                <button
                  type="button"
                  onClick={beginVoiceInterview}
                  disabled={loadingMessages}
                  className="mt-7 inline-flex items-center gap-2 bg-[#477FAE] px-6 py-3 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:opacity-50"
                >
                  <Mic size={16} /> Start voice interview
                </button>
              )}

              {hasStarted && voiceState === "ready" && canStartAnswer && !completed && (
                <button type="button" onClick={startListening} className="mt-7 inline-flex items-center gap-2 bg-[#477FAE] px-6 py-3 text-xs font-semibold text-white hover:bg-[#376F9F]">
                  <Mic size={15} /> I'm ready to answer
                </button>
              )}

              {hasStarted && voiceState === "listening" && !completed && (
                <button type="button" onClick={stopListening} className="mt-7 inline-flex items-center gap-2 bg-[#477FAE] px-5 py-3 text-xs font-semibold text-white hover:bg-[#376F9F]">
                  <MicOff size={15} /> Finish my answer
                </button>
              )}

              {hasStarted && voiceState === "ready" && !canStartAnswer && !completed && (
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={startListening} className="inline-flex items-center gap-2 bg-[#477FAE] px-5 py-3 text-xs font-semibold text-white hover:bg-[#376F9F]">
                    <Mic size={15} /> Try speaking again
                  </button>
                  {currentQuestion && (
                    <button type="button" onClick={replayCurrentQuestion} className="inline-flex items-center gap-2 border border-[#DCE5ED] bg-white px-4 py-3 text-xs font-medium text-[#526B83] hover:bg-[#F3F7FA]">
                      <Volume2 size={15} /> Repeat question
                    </button>
                  )}
                </div>
              )}

              {hasStarted && !completed && (
                <button type="button" onClick={() => setMuted((value) => !value)} className="mt-4 inline-flex items-center gap-2 text-[11px] text-[#8793A0] hover:text-[#526B83]">
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {muted ? "Unmute interviewer" : "Mute interviewer"}
                </button>
              )}
            </div>
          </div>

          {(liveTranscript || voiceState === "listening") && (
            <div className="border-t border-[#EDF0F3] bg-white px-5 py-4">
              <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">YOUR LIVE TRANSCRIPT</p>
              <p className="mt-2 min-h-6 text-xs leading-6 text-[#536274]">
                {liveTranscript || "Start speaking. Your words will appear here..."}
              </p>
            </div>
          )}

          {error && (
            <div role="alert" className="mx-5 my-4 border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </div>
          )}

          {messages.length > 0 && (
            <div className="border-t border-[#EDF0F3] p-5">
              <p className="mb-3 text-[10px] font-semibold tracking-wider text-[#6F9BC5]">CONVERSATION TRANSCRIPT</p>
              <div className="max-h-[250px] space-y-3 overflow-y-auto">
                {messages.slice(-8).map((message, index) => {
                  const isCandidate = message.speaker === "user";
                  return (
                    <div key={message.id || `${message.speaker}-${index}`} className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] px-3 py-2.5 ${isCandidate ? "bg-[#EFF5FA]" : "bg-[#F7F9FB]"}`}>
                        <p className="mb-1 text-[9px] font-semibold text-[#82909D]">{isCandidate ? "You" : "PrepIt AI interviewer"}</p>
                        <p className="whitespace-pre-wrap text-[11px] leading-5 text-[#536274]">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completed && !evaluation && (
            <div className="border-t border-[#EDF0F3] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={19} className="mt-0.5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-semibold text-[#354354]">Interview completed</h3>
                  <p className="mt-1 text-xs leading-5 text-[#8793A0]">Your spoken answers have been transcribed and saved. Generate your AI evaluation to see your report.</p>
                </div>
              </div>
              <button type="button" onClick={handleGenerateEvaluation} disabled={generatingEvaluation} className="mt-5 inline-flex items-center gap-2 bg-[#477FAE] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:opacity-50">
                {generatingEvaluation ? <LoaderCircle size={14} className="animate-spin" /> : <Trophy size={14} />}
                {generatingEvaluation ? "Generating evaluation..." : "Generate AI evaluation"}
              </button>
            </div>
          )}

          {evaluation && (
            <div className="border-t border-[#EDF0F3] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Trophy size={19} className="text-[#6D9BC2]" /><h3 className="text-sm font-semibold text-[#354354]">Your interview evaluation</h3></div>
                <p className="text-2xl font-semibold text-[#477FAE]">{evaluation.overall_score}<span className="text-xs text-[#8995A2]">/100</span></p>
              </div>
              <p className="mt-3 text-xs leading-6 text-[#788695]">{evaluation.summary}</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-[#4D5D6D]">Strengths</h4>
                  <ul className="mt-2 space-y-2">{(evaluation.strengths || []).map((item, index) => <li key={index} className="flex gap-2 text-[11px] leading-5 text-[#7C8996]"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}</ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#4D5D6D]">Recommendations</h4>
                  <ul className="mt-2 space-y-2">{(evaluation.recommendations || []).map((item, index) => <li key={index} className="flex gap-2 text-[11px] leading-5 text-[#7C8996]"><Sparkles size={13} className="mt-0.5 shrink-0 text-[#6D9BC2]" />{item}</li>)}</ul>
                </div>
              </div>
              <button type="button" onClick={onExit} className="mt-6 inline-flex items-center gap-2 border border-[#DCE5ED] bg-white px-4 py-2.5 text-xs font-medium text-[#526B83] hover:bg-[#F3F7FA]">Back to dashboard</button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-[#E8ECF0] bg-white p-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#6F9BC5]">SESSION DETAILS</p>
            <h3 className="mt-2 text-sm font-semibold text-[#39495A]">{session.domain?.name || "Interview"}</h3>
            <div className="mt-4 space-y-3 text-xs text-[#788695]">
              <div className="flex justify-between gap-3"><span>Target role</span><span className="text-right font-medium text-[#526274]">{session.target_role}</span></div>
              <div className="flex justify-between gap-3"><span>Difficulty</span><span className="capitalize font-medium text-[#526274]">{session.difficulty}</span></div>
              <div className="flex justify-between gap-3"><span>Interview type</span><span className="capitalize font-medium text-[#526274]">{session.interview_type}</span></div>
              <div className="flex justify-between gap-3"><span>Main questions</span><span className="font-medium text-[#526274]">{session.question_count}</span></div>
            </div>
          </div>

          {currentQuestion && !completed && (
            <div className="border border-[#E8ECF0] bg-white p-5">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#6F9BC5]">CURRENT QUESTION</p>
              <h3 className="mt-2 text-sm font-semibold text-[#39495A]">{currentQuestion.topic}</h3>
              <p className="mt-2 text-xs leading-6 text-[#526274]">{currentQuestion.question_text}</p>
              <button type="button" onClick={replayCurrentQuestion} className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium text-[#5D88B0]"><Volume2 size={13} /> Repeat aloud</button>
            </div>
          )}

          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2"><Mic size={16} className="text-[#78A2C8]" /><h3 className="text-xs font-semibold text-[#39495A]">Voice interview tips</h3></div>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#84919E]">
              <li>• Speak clearly and at a natural pace.</li>
              <li>• Take the time you need before selecting “I'm ready to answer”.</li>
              <li>• Select “I'm ready to answer” when you want to begin.</li>
              <li>• After you finish, the interviewer will wait at least 5 seconds before responding.</li>
              <li>• Your recognized transcript is saved as your answer.</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 border border-[#E8ECF0] bg-[#F8FAFC] p-4 text-[10px] leading-5 text-[#7F8D9B]">
            <RefreshCw size={14} className="mt-0.5 shrink-0" />
            This first voice version uses your browser's speech recognition and voice engine. Keep this tab open during the interview.
          </div>
        </aside>
      </div>
    </div>
  );
}
