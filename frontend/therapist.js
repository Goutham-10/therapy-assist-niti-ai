const clientSelect = document.getElementById("clientSelect");
const journalBox = document.getElementById("journalBox");
const journalTable = document.getElementById("journalTable");
const emotionFilter = document.getElementById("emotionFilter");
const topicFilter = document.getElementById("topicFilter");
const clearFilters = document.getElementById("clearFilters");
const statsBox = document.getElementById("statsBox");
const statsData = document.getElementById("statsData");

let currentEntries = [];

// 🔁 Render journal entries into table
function renderJournalTable(entries) {
  journalTable.innerHTML = "";

  if (!entries.length) {
    journalTable.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-500">No entries found.</td></tr>`;
    return;
  }

  entries.forEach(entry => {
    const flagged = entry.flagged ? "bg-red-100 text-red-700 font-semibold" : "";
    const row = `
      <tr class="${flagged}">
        <td class="border px-2 py-1">${entry.date || "-"}</td>
        <td class="border px-2 py-1">${(entry.emotions || []).join(", ")}</td>
        <td class="border px-2 py-1">${(entry.topics || []).join(", ")}</td>
        <td class="border px-2 py-1">${entry.summary || "—"}</td>
      </tr>
    `;
    journalTable.innerHTML += row;
  });
}

// 🌐 Load all clients
fetch("http://localhost:8000/clients")
  .then(res => res.json())
  .then(data => {
    if (!data.clients.length) {
      alert("⚠️ No clients found. Please ensure journal entries are submitted first.");
      return;
    }

    data.clients.forEach(id => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      clientSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Client load error:", err);
    alert("Could not fetch client list.");
  });

// 📥 Handle client selection
clientSelect.addEventListener("change", () => {
  const userId = clientSelect.value;
  if (!userId) return;

  fetch(`http://localhost:8000/log/${userId}`)
    .then(res => res.json())
    .then(entries => {
      currentEntries = entries;
      journalBox.classList.remove("hidden");
      renderJournalTable(entries);

      return fetch(`http://localhost:8000/stats/${userId}`);
    })
    .then(res => res.json())
    .then(stats => {
      statsBox.classList.remove("hidden");
      statsData.textContent = JSON.stringify(stats, null, 2);
    })
    .catch(err => {
      console.error("Error fetching entries or stats:", err);
      alert("Could not load journal data.");
    });
});

// 🔍 Filter by emotion
emotionFilter.addEventListener("input", () => {
  const keyword = emotionFilter.value.toLowerCase();
  const filtered = currentEntries.filter(entry =>
    (entry.emotions || []).some(e => e.toLowerCase().includes(keyword))
  );
  renderJournalTable(filtered);
});

// 🔍 Filter by topic
topicFilter.addEventListener("input", () => {
  const keyword = topicFilter.value.toLowerCase();
  const filtered = currentEntries.filter(entry =>
    (entry.topics || []).some(t => t.toLowerCase().includes(keyword))
  );
  renderJournalTable(filtered);
});

// 🔄 Clear filters
clearFilters.addEventListener("click", () => {
  emotionFilter.value = "";
  topicFilter.value = "";
  renderJournalTable(currentEntries);
});
