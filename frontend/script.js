// ─────────────────────────────────────────────────────────────
// 🌱 INITIAL SETUP: DOM ELEMENTS
// ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Journal & Prompt Elements
  const journalInput = document.getElementById("journalInput");
  const userIdInput = document.getElementById("user_id");
  const promptText = document.getElementById("prompt");

  // Insights & History UI
  const insightsBox = document.getElementById("insights");
  const resultBox = document.getElementById("resultBox");
  const tipBox = document.getElementById("tipBox");
  const historyBox = document.getElementById("historyBox");
  const historyTable = document.getElementById("historyTable");

  // Buttons
  const submitBtn = document.getElementById("submitBtn");
  const historyBtn = document.getElementById("historyBtn");
  const startMic = document.getElementById("startMic");
  const confirmVoice = document.getElementById("confirmVoice");
  const voicePreview = document.getElementById("voicePreview");

  // ─────────────────────────────────────────────────────────────
  // 🔄 LOAD DAILY PROMPT
  // ─────────────────────────────────────────────────────────────

  fetch("/prompt")
    .then(res => res.json())
    .then(data => {
      promptText.textContent = data.prompt || "Could not load prompt.";
    })
    .catch(err => {
      console.error("Prompt load error:", err);
      promptText.textContent = "⚠️ Failed to load prompt.";
    });

  // ─────────────────────────────────────────────────────────────
  // ✍️ SUBMIT JOURNAL ENTRY
  // ─────────────────────────────────────────────────────────────

  submitBtn.addEventListener("click", () => {
    const input = journalInput.value.trim();
    const userId = userIdInput.value.trim();
    if (!input || !userId) return alert("Please enter both User ID and journal entry.");
  
    fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, raw_input: input, source: "text" }),
    })
      .then(async res => {
        const data = await res.json();
  
        // 👀 Check for server-side failure even if status = 200
        if (!res.ok || !data.summary) {
          throw new Error("Invalid response from server.");
        }
  
        // ✅ Show insights
        insightsBox.classList.remove("hidden");
        resultBox.textContent = JSON.stringify(data, null, 2);
  
        // ✅ Show tip if available
        const tipBox = document.getElementById("tipBox");
        tipBox.classList.remove("hidden");
        tipBox.textContent = `💡 Tip: ${data.tip || "No tip available."}`;
      })
      .catch(err => {
        console.warn("Submission error:", err.message);
  
        // 🎯 Graceful fallback message
        const tipBox = document.getElementById("tipBox");
        tipBox.classList.remove("hidden");
        tipBox.textContent = "⚠️ Your entry was saved, but insights may not be complete.";
      });
  });
  
  

  // ─────────────────────────────────────────────────────────────
  // 📚 VIEW JOURNAL HISTORY
  // ─────────────────────────────────────────────────────────────

  historyBtn.addEventListener("click", () => {
    const userId = userIdInput.value.trim();
    if (!userId) return alert("Enter your User ID to view history.");

    fetch(`/log/${userId}`)
      .then(res => res.json())
      .then(entries => {
        historyBox.classList.remove("hidden");
        historyTable.innerHTML = "";

        if (!entries.length) {
          historyTable.innerHTML = `<tr><td colspan="4" class="text-center p-3 text-gray-500">No entries found.</td></tr>`;
          return;
        }

        // Render each entry
        entries.forEach(entry => {
          const row = `
            <tr>
              <td class="border px-2 py-1">${entry.date || "-"}</td>
              <td class="border px-2 py-1">${(entry.emotions || []).join(", ")}</td>
              <td class="border px-2 py-1">${(entry.topics || []).join(", ")}</td>
              <td class="border px-2 py-1">${entry.summary || "—"}</td>
              <td class="border px-2 py-1">${entry.feedback || "—"}</td>
            </tr>`;
          historyTable.innerHTML += row;
        });
      })
      .catch(err => {
        console.error("History error:", err);
        alert("Could not fetch history.");
      });
  });

  // ─────────────────────────────────────────────────────────────
  // 🎙️ VOICE INPUT MODULE
  // ─────────────────────────────────────────────────────────────

  let recognition;
  let isRecording = false;
  let finalTranscript = '';

  // ✅ Create and configure recognition object
  function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      voicePreview.textContent = "🎤 Listening...";
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      const display = (finalTranscript + interim).trim();
      voicePreview.textContent = display ? `🎤 ${display}` : "🎤 Listening...";
      voicePreview.style.height = "auto";
      voicePreview.style.height = voicePreview.scrollHeight + "px";
    };

    rec.onerror = (e) => {
      voicePreview.textContent = `❌ Error: ${e.error}`;
      console.error("Recognition error:", e);
      stopRecording();
    };

    rec.onend = () => {
      if (isRecording) {
        try {
          rec.start(); // auto-restart
        } catch (error) {
          console.error("Restart failed:", error);
          stopRecording();
        }
      }
    };

    return rec;
  }

  // 🎙️ Start recording
  function startRecording() {
    try {
      isRecording = true;
      finalTranscript = '';
      startMic.textContent = "⏹️ Stop Voice";
      recognition = createRecognition();
      recognition.start();
    } catch (error) {
      console.error("Start failed:", error);
      voicePreview.textContent = "❌ Could not start recording.";
      stopRecording();
    }
  }

  // 🛑 Stop recording
  function stopRecording() {
    isRecording = false;
    if (recognition) recognition.stop();
    startMic.textContent = "🎙️ Start Voice";

    voicePreview.textContent = finalTranscript.trim()
      ? `🎤 ${finalTranscript.trim()}`
      : "⏹️ Voice stopped.";
  }

  // 🎛️ Button handlers
  startMic.addEventListener("click", () => {
    isRecording ? stopRecording() : startRecording();
  });

  confirmVoice.addEventListener("click", () => {
    if (isRecording) stopRecording();

    const text = voicePreview.textContent.replace('🎤 ', '').trim();

    if (
      text && !text.startsWith("❌") &&
      !text.startsWith("⏹️") && text !== "Listening..."
    ) {
      journalInput.value += journalInput.value.trim()
        ? `\n${text}`
        : text;
      voicePreview.textContent = "✅ Added to input box.";
      finalTranscript = '';
    } else {
      voicePreview.textContent = "❌ No valid transcript to add.";
    }
  });

  // 🛑 Fallback if speech API not supported
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    voicePreview.textContent = "❌ Your browser doesn't support voice input.";
    startMic.disabled = true;
    confirmVoice.disabled = true;
  }
});
