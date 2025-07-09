document.addEventListener("DOMContentLoaded", () => {
  //  AUTH & UI ELEMENTS
  const loginBox = document.getElementById("loginBox");
  const dashboardBox = document.getElementById("dashboardBox");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const therapistPasswordInput = document.getElementById("therapistPassword");

  const clientSelect = document.getElementById("clientSelect");
  const journalBox = document.getElementById("journalBox");
  const journalTable = document.getElementById("journalTable");
  const statsBox = document.getElementById("statsBox");
  const statsData = document.getElementById("statsData");

  const tabs = document.getElementById("tabs");
  const tabJournal = document.getElementById("tabJournal");
  const tabStats = document.getElementById("tabStats");

  //  LOGIN HANDLER
  loginBtn.addEventListener("click", async () => {
    const password = therapistPasswordInput.value.trim();
    loginError.classList.add("hidden");

    if (!password) {
      loginError.textContent = "Password is required.";
      loginError.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch("/therapist-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error("Unauthorized");

      loginBox.classList.add("hidden");
      dashboardBox.classList.remove("hidden");
      loadClients();
    } catch (err) {
      console.error("Login error:", err);
      loginError.textContent = "Incorrect password. Try again.";
      loginError.classList.remove("hidden");
    }
  });

  //  TAB SWITCHING
  function switchTab(tab) {
    if (tab === "journal") {
      journalBox.classList.remove("hidden");
      statsBox.classList.add("hidden");
      tabJournal.classList.add("border-b-2", "border-blue-600", "text-blue-600");
      tabStats.classList.remove("border-b-2", "border-blue-600", "text-blue-600");
    } else {
      statsBox.classList.remove("hidden");
      journalBox.classList.add("hidden");
      tabStats.classList.add("border-b-2", "border-blue-600", "text-blue-600");
      tabJournal.classList.remove("border-b-2", "border-blue-600", "text-blue-600");
    }
  }

  tabJournal.addEventListener("click", () => switchTab("journal"));
  tabStats.addEventListener("click", () => switchTab("stats"));

  //  LOAD CLIENTS
  async function loadClients() {
    try {
      console.log("Loading clients...");
      const res = await fetch("/clients");
      const data = await res.json();
      
      console.log("Clients data:", data);

      if (!data.clients || !data.clients.length) {
        alert(" No clients found. Ask users to submit journal entries.");
        return;
      }

      clientSelect.innerHTML = `<option value="">-- Select Client --</option>`;
      data.clients.forEach((id) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = id;
        clientSelect.appendChild(option);
      });
      console.log("Clients loaded successfully");
    } catch (err) {
      console.error("Error fetching clients:", err);
      alert("Could not load clients.");
    }
  }

  //  LOAD JOURNALS & STATS
  clientSelect.addEventListener("change", async () => {
    const userId = clientSelect.value;
    if (!userId) return;

    tabs.classList.remove("hidden");
    switchTab("journal");

    await loadJournalEntries(userId);
    await loadStats(userId);
  });

  async function loadJournalEntries(userId) {
    try {
      console.log("Loading journal entries for user:", userId);
      const res = await fetch(`/log/${userId}`);
      const entries = await res.json();
      
      console.log("Received entries:", entries);

      journalTable.innerHTML = "";

      if (!entries.length) {
        journalTable.innerHTML = `
          <tr>
            <td colspan="8" class="text-center p-3 text-gray-500">No journal entries found.</td>
          </tr>`;
        return;
      }

      const fragment = document.createDocumentFragment();

      entries.forEach((entry) => {
        console.log("Processing entry:", entry);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="border px-2 py-1">${entry.date || "-"}</td>
          <td class="border px-2 py-1">${(entry.emotions || []).join(", ")}</td>
          <td class="border px-2 py-1">${(entry.topics || []).join(", ")}</td>
          <td class="border px-2 py-1">${entry.summary || "—"}</td>
          <td class="border px-2 py-1">${(entry.cognitive_patterns || []).join(", ")}</td>
          <td class="border px-2 py-1">${(entry.suggested_questions || []).join("<br>")}</td>
          <td class="border px-2 py-1">${entry.tip || "—"}</td>
          <td class="border px-2 py-1">
            <input type="text" placeholder="Leave feedback..." 
              class="text-xs border rounded px-1 py-0.5 w-full feedback-input" 
              value="${entry.therapist_feedback || ""}" 
              data-entry-id="${entry._id}">
            <button class="bg-blue-500 text-white text-xs px-2 py-0.5 mt-1 rounded save-feedback">
              💬 Save
            </button>
          </td>
        `;
        fragment.appendChild(row);
      });

      journalTable.appendChild(fragment);
      console.log("Journal entries loaded successfully");
    } catch (err) {
      console.error("Error loading journals:", err);
      alert("Failed to load journal entries.");
    }
  }

  async function loadStats(userId) {
    try {
      const res = await fetch(`/stats/${userId}`);
      const stats = await res.json();

      statsData.innerHTML = `
        <p> <strong>Total entries:</strong> ${stats.total_entries ?? 0}</p>
        <p> <strong>Avg. words per entry:</strong> ${stats.avg_words_per_entry ?? 0}</p>
        <p> <strong>Top emotions:</strong> ${(stats.top_emotions ?? []).join(", ")}</p>
        <p> <strong>Common topics:</strong> ${(stats.most_common_topics ?? []).join(", ")}</p>
        <p> <strong>First entry:</strong> ${stats.first_entry_date ?? "—"}</p>
        <p> <strong>Last entry:</strong> ${stats.last_entry_date ?? "—"}</p>
      `;
    } catch (err) {
      console.error("Error fetching stats:", err);
      statsData.innerHTML = "Unable to load stats.";
    }
  }

  //  FEEDBACK HANDLER
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("save-feedback")) {
      const row = e.target.closest("tr");
      const input = row.querySelector("input.feedback-input");
      const entryId = input.dataset.entryId;
      const feedback = input.value.trim();

      if (!entryId) return alert("Missing entry ID.");
      if (!feedback) return alert("Feedback is empty.");

      fetch("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, feedback }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to save feedback");
          alert(" Feedback saved successfully!");
        })
        .catch((err) => {
          console.error("Feedback error:", err);
          alert(" Could not save feedback.");
        });
    }
  });
});
