document.addEventListener("DOMContentLoaded", () => {
  // 📌 Basic UI Elements
  const promptText = document.getElementById("prompt");
  const submitBtn = document.getElementById("submitBtn");
  const journalInput = document.getElementById("journalInput");
  const userIdInput = document.getElementById("user_id");
  const resultBox = document.getElementById("resultBox");
  const insightsBox = document.getElementById("insights");
  const historyBtn = document.getElementById("historyBtn");
  const historyBox = document.getElementById("historyBox");
  const historyTable = document.getElementById("historyTable");

  // 🔄 Load Daily Prompt
  fetch("/prompt")
    .then(res => res.json())
    .then(data => {
      promptText.textContent = data.prompt || "Could not load prompt.";
    });

  // 📝 Submit Entry
  submitBtn.addEventListener("click", () => {
    const input = journalInput.value.trim();
    const userId = userIdInput.value.trim();
    if (!input || !userId) return alert("Please enter both User ID and journal entry.");

    fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, raw_input: input, source: "text" }),
    })
      .then(res => res.json())
      .then(data => {
        insightsBox.classList.remove("hidden");
        resultBox.textContent = JSON.stringify(data, null, 2);

        const tipBox = document.getElementById("tipBox");
        tipBox.classList.remove("hidden");
        tipBox.textContent = `💡 Tip: ${data.tip || "No tip available."}`;
      })
      .catch(err => {
        console.error("Submission error:", err);
        alert("Error submitting your entry.");
      });
  });

  // 📜 View Journal History
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

        entries.forEach(entry => {
          const row = `
            <tr>
              <td class="border px-2 py-1">${entry.date || "-"}</td>
              <td class="border px-2 py-1">${(entry.emotions || []).join(", ")}</td>
              <td class="border px-2 py-1">${(entry.topics || []).join(", ")}</td>
              <td class="border px-2 py-1">${entry.summary || "—"}</td>
            </tr>
          `;
          historyTable.innerHTML += row;
        });
      })
      .catch(err => {
        console.error("History error:", err);
        alert("Could not fetch history.");
      });
  });

  // 🎤 Voice Recognition Setup
  let recognition;
  let isRecording = false;
  let finalTranscript = '';

  const voicePreview = document.getElementById("voicePreview");
  const startMic = document.getElementById("startMic");
  const confirmVoice = document.getElementById("confirmVoice");

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    function createRecognition() {
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;  // Keep listening
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log("Speech recognition started");
        voicePreview.textContent = "🎤 Listening...";
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
      
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
      
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      
        const displayText = (finalTranscript + interimTranscript).trim();
        voicePreview.textContent = displayText ? `🎤 ${displayText}` : "🎤 Listening...";
      
        // ✅ Auto-grow the preview box to fit new content
        voicePreview.style.height = "auto";  // Reset previous height
        voicePreview.style.height = voicePreview.scrollHeight + "px";  // Grow to fit content
      };
      
      
      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        
        if (event.error === 'no-speech') {
          voicePreview.textContent = "❌ No speech detected. Try again.";
        } else if (event.error === 'audio-capture') {
          voicePreview.textContent = "❌ Microphone access denied.";
        } else {
          voicePreview.textContent = `❌ Error: ${event.error}`;
        }
        
        stopRecording();
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        if (isRecording) {
          // If we're still supposed to be recording, restart
          setTimeout(() => {
            if (isRecording) {
              try {
                recognition.start();
              } catch (error) {
                console.error("Failed to restart recognition:", error);
                stopRecording();
              }
            }
          }, 100);
        }
      };
      
      return recognition;
    }
    
    function startRecording() {
      try {
        isRecording = true;
        finalTranscript = '';  // Reset transcript
        startMic.textContent = "⏹️ Stop Voice";
        recognition = createRecognition();
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        voicePreview.textContent = "❌ Failed to start recording. Please refresh the page.";
        stopRecording();
      }
    }
    
    function stopRecording() {
      isRecording = false;
      if (recognition) {
        recognition.stop();
      }
      startMic.textContent = "🎙️ Start Voice";
      
      // Show final transcript
      if (finalTranscript.trim()) {
        voicePreview.textContent = `🎤 ${finalTranscript.trim()}`;
      } else {
        voicePreview.textContent = "⏹️ Voice stopped.";
      }
    }
    
    startMic.addEventListener("click", () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    });
    
    confirmVoice.addEventListener("click", () => {
      // Stop any ongoing recording
      if (isRecording) {
        stopRecording();
      }
      
      // Get the current transcript (removing the microphone emoji)
      const transcriptText = voicePreview.textContent.replace('🎤 ', '').trim();
      
      // Only add non-empty, valid transcripts
      if (transcriptText && 
          transcriptText !== "Listening..." && 
          !transcriptText.startsWith('❌') && 
          !transcriptText.startsWith('⏹️') &&
          !transcriptText.startsWith('🎤 Waiting')) {
        
        // Add to journal input
        const existing = journalInput.value.trim();
        journalInput.value = existing
          ? `${existing}\n${transcriptText}`
          : transcriptText;
        
        voicePreview.textContent = "✅ Added to input box.";
        
        // Clear the transcript for next use
        finalTranscript = '';
      } else {
        voicePreview.textContent = "❌ No valid transcript to add.";
      }
    });
    
  } else {
    // Browser doesn't support speech recognition
    voicePreview.textContent = "❌ Your browser doesn't support voice input.";
    startMic.disabled = true;
    confirmVoice.disabled = true;
  }
});
