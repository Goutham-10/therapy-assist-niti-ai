document.addEventListener("DOMContentLoaded", () => {
  const promptText = document.getElementById("prompt");
  const submitBtn = document.getElementById("submitBtn");
  const journalInput = document.getElementById("journalInput");
  const userIdInput = document.getElementById("user_id");
  const resultBox = document.getElementById("resultBox");
  const insightsBox = document.getElementById("insights");
  const historyBtn = document.getElementById("historyBtn");
  const historyBox = document.getElementById("historyBox");
  const historyTable = document.getElementById("historyTable");

  // Load prompt
  fetch("/prompt")
    .then(res => res.json())
    .then(data => {
      promptText.textContent = data.prompt || "Could not load prompt.";
    });

  // Submit journal entry
  submitBtn.addEventListener("click", () => {
    const input = journalInput.value.trim();
    const userId = userIdInput.value.trim();

    if (!input || !userId) {
      alert("Please enter both your User ID and journal entry.");
      return;
    }

    fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, raw_input: input, source: "text" }),
    })
      .then(res => res.json())
      .then(data => {
        insightsBox.classList.remove("hidden");
        resultBox.textContent = JSON.stringify(data, null, 2);
      })
      .catch(err => {
        console.error("Submission error:", err);
        alert("Error submitting your entry.");
      });
  });

  // View journal history
  historyBtn.addEventListener("click", () => {
    const userId = userIdInput.value.trim();
    if (!userId) return alert("Enter your User ID to view history.");

    fetch(`http://localhost:8000/log/${userId}`)
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
        console.error("History fetch error:", err);
        alert("Could not fetch journal history.");
      });
  });
});
