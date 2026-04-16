/**
 * PRODUCTIVITY TOOLS - Complete JavaScript
 * Tools: Task Planner, Pomodoro Timer, Quick Notes, Meeting Agenda Generator
 * Architecture: IIFE module, global register, double-init protection
 */

(function() {
  "use strict";

  // Register in global QwicktonCategoryInits
  window.QwicktonCategoryInits = window.QwicktonCategoryInits || {};

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function safeNum(v, d = 0) { let n = Number(v); return isFinite(n) ? n : d; }
  
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function copyText(text) { 
    if (text) navigator.clipboard?.writeText(String(text)).catch(() => {}); 
  }
  function downloadTextFile(name, text) {
    const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function fail(message) {
    throw new Error(message);
  }
  function localeOptions() {
    const presets = [
      { code: "en-US", label: "United States" },
      { code: "en-IN", label: "India" },
      { code: "en-GB", label: "United Kingdom" },
      { code: "de-DE", label: "Germany" },
      { code: "fr-FR", label: "France" },
      { code: "ja-JP", label: "Japan" },
      { code: "ar-SA", label: "Saudi Arabia" },
      { code: "pt-BR", label: "Brazil" }
    ];
    return presets.map((item) => `<option value="${item.code}">${item.label} (${item.code})</option>`).join("");
  }

  // ============================================
  // STORAGE KEYS
  // ============================================
  const TODO_KEY = "qw-prod-todos";
  const NOTE_KEY = "qw-prod-note";
  const STATS_KEY = "qw-prod-pomo-stats";

  // ============================================
  // CARD CREATION
  // ============================================
  function initProductivityTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.productivityToolsInitialized === "true") return;
    grid.dataset.productivityToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "prod-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="prod-card-header">
          <div class="prod-card-icon">${icon}</div>
          <h3 class="prod-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary prod-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary prod-focus-inline-close" type="button" data-focus-close>Close</button>
          ` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    // ============================================
    // TASK PLANNER CARD
    // ============================================
    const todoCard = makeCard("todo", "✅", "Task Planner Pro", `
      <div class="grid-2">
        <div><label>Task Title</label><input type="text" id="todoInput" placeholder="Enter task..."></div>
        <div><label>Priority</label><select id="todoPriority">
          <option value="P1">🔴 P1 - High Priority</option>
          <option value="P2" selected>🟡 P2 - Medium Priority</option>
          <option value="P3">🟢 P3 - Low Priority</option>
        </select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="todoAdd">➕ Add Task</button>
        <button class="btn btn-secondary" type="button" id="todoClearDone">🗑️ Clear Completed</button>
        <button class="btn btn-secondary" type="button" id="todoExport">⬇️ Export TXT</button>
      </div>
      <div id="todoMeta" class="result">Create, prioritize, and complete tasks. Saved locally in browser.</div>
      <div id="todoList" class="todo-list"></div>
    `);

    // Task storage functions
    function readTodos() {
      try {
        const parsed = JSON.parse(localStorage.getItem(TODO_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    function writeTodos(items) {
      try {
        localStorage.setItem(TODO_KEY, JSON.stringify(items));
      } catch (error) {
        void error;
      }
    }
    
    function renderTodos() {
      const items = readTodos();
      const list = todoCard.querySelector("#todoList");
      if (!items.length) {
        list.innerHTML = '<div class="empty-hint">📭 No tasks yet. Add your first task above!</div>';
        return;
      }
      list.innerHTML = "";
      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "result";
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "8px";
        
        const priorityColors = { P1: "🔴", P2: "🟡", P3: "🟢" };
        const priorityText = priorityColors[item.priority] || "📌";
        
        const label = document.createElement("span");
        label.innerHTML = `${priorityText} [${item.priority}] ${escapeHtml(item.text)}`;
        if (item.done) {
          label.style.textDecoration = "line-through";
          label.style.opacity = "0.6";
        }
        
        const actions = document.createElement("div");
        actions.className = "inline-row";
        actions.style.margin = "0";
        actions.style.gap = "0.3rem";
        
        const doneBtn = document.createElement("button");
        doneBtn.className = "btn btn-secondary btn-sm";
        doneBtn.textContent = item.done ? "↩️ Undo" : "✅ Done";
        doneBtn.onclick = () => {
          const next = readTodos();
          next[index].done = !next[index].done;
          writeTodos(next);
          renderTodos();
        };
        
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-secondary btn-sm";
        delBtn.textContent = "🗑️";
        delBtn.onclick = () => {
          const next = readTodos();
          next.splice(index, 1);
          writeTodos(next);
          renderTodos();
        };
        
        actions.appendChild(doneBtn);
        actions.appendChild(delBtn);
        row.appendChild(label);
        row.appendChild(actions);
        list.appendChild(row);
      });
    }
    
    todoCard.querySelector("#todoAdd").onclick = () => {
      try {
        const text = todoCard.querySelector("#todoInput").value.trim();
        if (!text) fail("Please enter a task title.");
        const priority = todoCard.querySelector("#todoPriority").value;
        const next = [{ text, priority, done: false }, ...readTodos()].slice(0, 200);
        writeTodos(next);
        todoCard.querySelector("#todoInput").value = "";
        todoCard.querySelector("#todoMeta").textContent = `Added task in ${priority}. Total tasks: ${next.length}`;
        renderTodos();
      } catch (error) {
        todoCard.querySelector("#todoMeta").textContent = `⚠️ ${error.message}`;
      }
    };
    
    todoCard.querySelector("#todoClearDone").onclick = () => {
      writeTodos(readTodos().filter(t => !t.done));
      renderTodos();
      todoCard.querySelector("#todoMeta").textContent = "Completed tasks removed.";
    };
    todoCard.querySelector("#todoExport").onclick = () => {
      const lines = readTodos().map((item, idx) => `${idx + 1}. [${item.done ? "x" : " "}] ${item.priority} ${item.text}`);
      downloadTextFile("task-planner-export.txt", lines.join("\n"));
    };
    
    renderTodos();

    // ============================================
    // POMODORO TIMER CARD
    // ============================================
    const pomoCard = makeCard("pomo", "🍅", "Pomodoro Pro", `
      <div class="grid-2">
        <div><label>Focus (mins)</label><input type="number" id="pomoFocus" value="25" min="1" placeholder="Focus mins"></div>
        <div><label>Break (mins)</label><input type="number" id="pomoBreak" value="5" min="1" placeholder="Break mins"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="pomoStart">▶️ Start</button>
        <button class="btn btn-secondary" type="button" id="pomoPause">⏸️ Pause</button>
        <button class="btn btn-secondary" type="button" id="pomoReset">🔄 Reset</button>
        <button class="btn btn-secondary" type="button" id="pomoExport">⬇️ Stats TXT</button>
      </div>
      <div id="pomoRes" class="result" style="font-size: 2rem; text-align: center; font-weight: 700;">25:00</div>
      <div id="pomoMeta" class="result" style="margin-top:0.5rem;">Mode: Focus | Sessions today: 0</div>
    `);

    let timer = null;
    let isFocus = true;
    let remaining = 25 * 60;
    
    function readPomoStats() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
        return { sessions: Number(parsed.sessions || 0) };
      } catch {
        return { sessions: 0 };
      }
    }
    
    function writePomoStats(stats) {
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch (error) {
        void error;
      }
    }
    
    const stats = readPomoStats();
    
    function showTime() {
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      pomoCard.querySelector("#pomoRes").textContent = `${m}:${s}`;
      pomoCard.querySelector("#pomoMeta").innerHTML = `🍅 Mode: ${isFocus ? "Focus" : "Break"} | 📊 Sessions today: ${stats.sessions}`;
    }
    
    function setMode(focusMode) {
      isFocus = focusMode;
      const mins = focusMode 
        ? safeNum(pomoCard.querySelector("#pomoFocus").value, 25) 
        : safeNum(pomoCard.querySelector("#pomoBreak").value, 5);
      remaining = Math.max(1, mins) * 60;
      showTime();
    }
    
    showTime();
    
    pomoCard.querySelector("#pomoStart").onclick = () => {
      if (timer) return;
      timer = setInterval(() => {
        remaining--;
        showTime();
        if (remaining <= 0) {
          clearInterval(timer);
          timer = null;
          if (isFocus) {
            stats.sessions++;
            writePomoStats(stats);
            setMode(false);
          } else {
            setMode(true);
          }
        }
      }, 1000);
    };
    
    pomoCard.querySelector("#pomoPause").onclick = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    
    pomoCard.querySelector("#pomoReset").onclick = () => {
      if (timer) clearInterval(timer);
      timer = null;
      setMode(true);
    };
    pomoCard.querySelector("#pomoExport").onclick = () => {
      const text = [
        "Pomodoro Stats",
        `Sessions completed: ${stats.sessions}`,
        `Current mode: ${isFocus ? "Focus" : "Break"}`,
        `Remaining seconds: ${remaining}`,
        `Export time: ${new Date().toISOString()}`
      ].join("\n");
      downloadTextFile("pomodoro-stats.txt", text);
    };

    // ============================================
    // QUICK NOTES CARD
    // ============================================
    const notesCard = makeCard("notes", "📝", "Quick Notes", `
      <div><label>Your Notes</label><textarea id="prodNoteInput" rows="6" placeholder="Write your notes here... They will be saved automatically."></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="prodSaveNote">💾 Save Now</button>
        <button class="btn btn-secondary" type="button" id="prodCopyNote">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="prodDownloadNote">⬇️ TXT</button>
      </div>
      <div id="prodNoteMeta" class="result">💡 Autosave enabled - notes are saved as you type</div>
    `);

    const noteInput = notesCard.querySelector("#prodNoteInput");
    noteInput.value = localStorage.getItem(NOTE_KEY) || "";
    
    notesCard.querySelector("#prodSaveNote").onclick = () => {
      try {
        localStorage.setItem(NOTE_KEY, noteInput.value);
      } catch (error) {
        void error;
      }
      notesCard.querySelector("#prodNoteMeta").innerHTML = `✅ Saved at ${new Date().toLocaleTimeString()}`;
    };
    
    notesCard.querySelector("#prodCopyNote").onclick = () => {
      copyText(noteInput.value || "");
      notesCard.querySelector("#prodNoteMeta").innerHTML = "📋 Copied to clipboard!";
      setTimeout(() => {
        notesCard.querySelector("#prodNoteMeta").innerHTML = "💡 Autosave enabled - notes are saved as you type";
      }, 2000);
    };
    notesCard.querySelector("#prodDownloadNote").onclick = () => downloadTextFile("quick-notes.txt", noteInput.value || "");
    
    noteInput.addEventListener("input", () => {
      try {
        localStorage.setItem(NOTE_KEY, noteInput.value);
      } catch (error) {
        void error;
      }
      notesCard.querySelector("#prodNoteMeta").innerHTML = "💾 Autosaving...";
      setTimeout(() => {
        if (notesCard.querySelector("#prodNoteMeta").innerHTML === "💾 Autosaving...") {
          notesCard.querySelector("#prodNoteMeta").innerHTML = "✅ Autosaved";
        }
      }, 500);
    });

    // ============================================
    // MEETING AGENDA GENERATOR CARD
    // ============================================
    const agendaCard = makeCard("agenda", "📋", "Meeting Agenda Generator", `
      <div class="grid-2">
        <div><label>Meeting Title</label><input id="agendaTitle" type="text" placeholder="Weekly Team Sync"></div>
        <div><label>Duration (minutes)</label><input id="agendaDuration" type="number" value="30" min="10" max="180" placeholder="Duration"></div>
      </div>
      <div><label>Locale / Country</label><select id="agendaLocale">${localeOptions()}</select></div>
      <div><label>Agenda Topics (one per line)</label><textarea id="agendaTopics" rows="4" placeholder="Project updates&#10;Blockers discussion&#10;Next sprint planning"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="agendaBuild">📋 Generate Agenda</button>
        <button class="btn btn-secondary" type="button" id="agendaCopy">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="agendaDownload">⬇️ TXT</button>
      </div>
      <textarea id="agendaOutput" class="result" rows="8" placeholder="Agenda will appear here..."></textarea>
    `);

    agendaCard.querySelector("#agendaBuild").onclick = () => {
      const title = (agendaCard.querySelector("#agendaTitle").value || "Team Sync").trim();
      const duration = Math.max(10, safeNum(agendaCard.querySelector("#agendaDuration").value, 30));
      const locale = agendaCard.querySelector("#agendaLocale").value || "en-US";
      const topicsRaw = agendaCard.querySelector("#agendaTopics").value || "";
      const topics = topicsRaw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      
      const defaultTopics = ["Project updates", "Blockers and challenges", "Next steps planning"];
      const agendaTopics = topics.length ? topics : defaultTopics;
      const eachTime = Math.max(3, Math.floor((duration - 5) / agendaTopics.length));
      
      const lines = [
        "╔══════════════════════════════════════════════════════════════╗",
        `║                    MEETING AGENDA                            ║`,
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        `📋 Meeting: ${title}`,
        `⏱️ Duration: ${duration} minutes`,
        `📅 Date: ${new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date())}`,
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "🎯 AGENDA TOPICS",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ...agendaTopics.map((topic, idx) => `${idx + 1}. ${topic} (${eachTime} mins)`),
        `\n${agendaTopics.length + 1}. Wrap-up & Action Items (5 mins)`,
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "📝 NOTES",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "✅ ACTION ITEMS",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "- [ ] ",
        "- [ ] ",
        "- [ ] ",
        "",
        `📎 Generated by Qwickton Productivity Suite`
      ].join("\n");
      
      agendaCard.querySelector("#agendaOutput").value = lines;
    };
    
    agendaCard.querySelector("#agendaCopy").onclick = () => copyText(agendaCard.querySelector("#agendaOutput").value);
    agendaCard.querySelector("#agendaDownload").onclick = () => downloadTextFile("meeting-agenda.txt", agendaCard.querySelector("#agendaOutput").value);

    // ============================================
    // EISENHOWER MATRIX TEMPLATE
    // ============================================
    const eisCard = makeCard("eisen", "⬜", "Eisenhower Matrix", `
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="eiBtn">Insert template</button>
        <button class="btn btn-secondary" type="button" id="eiCopy">Copy</button>
      </div>
      <textarea id="eiOut" class="result" rows="10" readonly></textarea>
    `);
    eisCard.querySelector("#eiBtn").onclick = () => {
      eisCard.querySelector("#eiOut").value = [
        "URGENT + IMPORTANT     | IMPORTANT, NOT URGENT",
        "— Do first —           | — Schedule deep work —",
        "[ task ]                 [ task ]",
        "",
        "URGENT, NOT IMPORTANT  | NEITHER",
        "— Delegate —           | — Eliminate —",
        "[ task ]                 [ task ]"
      ].join("\n");
    };
    eisCard.querySelector("#eiCopy").onclick = () => copyText(eisCard.querySelector("#eiOut").value);

    // ============================================
    // WEEKLY REVIEW
    // ============================================
    const wrevCard = makeCard("wrev", "📆", "Weekly Review", `
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="wrBtn">Generate prompts</button>
        <button class="btn btn-secondary" type="button" id="wrCopy">Copy</button>
      </div>
      <textarea id="wrOut" class="result" rows="11" readonly></textarea>
    `);
    wrevCard.querySelector("#wrBtn").onclick = () => {
      wrevCard.querySelector("#wrOut").value = [
        "Weekly review",
        "☐ What went well?",
        "☐ What blocked me?",
        "☐ Top 3 outcomes for next week",
        "☐ Calendar cleanup (recurring, conflicts)",
        "☐ Inbox / task list to zero",
        "☐ Learnings to document",
        `Week of ${new Date().toLocaleDateString()}`
      ].join("\n");
    };
    wrevCard.querySelector("#wrCopy").onclick = () => copyText(wrevCard.querySelector("#wrOut").value);

    // ============================================
    // HABIT TRACKER (7-DAY ASCII)
    // ============================================
    const habCard = makeCard("habit7", "✅", "7-Day Habit Grid", `
      <div><label>Habit name</label><input type="text" id="hbN" value="Deep work"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="hbBtn">Build grid</button>
        <button class="btn btn-secondary" type="button" id="hbCopy">Copy</button>
      </div>
      <textarea id="hbOut" class="result" rows="4" readonly></textarea>
    `);
    habCard.querySelector("#hbBtn").onclick = () => {
      const n = habCard.querySelector("#hbN").value.trim() || "Habit";
      habCard.querySelector("#hbOut").value = `${n}\nMon Tue Wed Thu Fri Sat Sun\n[ ] [ ] [ ] [ ] [ ] [ ] [ ]`;
    };
    habCard.querySelector("#hbCopy").onclick = () => copyText(habCard.querySelector("#hbOut").value);

    // ============================================
    // EMAIL SUBJECT LINES
    // ============================================
    const subjCard = makeCard("subj", "✉️", "Email Subject Ideas", `
      <div><label>Topic</label><input type="text" id="sjT" placeholder="Q1 roadmap"></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="sjBtn">Generate</button>
        <button class="btn btn-secondary" type="button" id="sjCopy">Copy</button>
      </div>
      <textarea id="sjOut" class="result" rows="6" readonly></textarea>
    `);
    subjCard.querySelector("#sjBtn").onclick = () => {
      const t = subjCard.querySelector("#sjT").value.trim() || "update";
      subjCard.querySelector("#sjOut").value = [
        `[Action requested] ${t} — need your input by Friday`,
        `Quick win: ${t} (2 min read)`,
        `3 bullets on ${t}`,
        `Following up: ${t}`,
        `${t} — summary + next steps`
      ].join("\n");
    };
    subjCard.querySelector("#sjCopy").onclick = () => copyText(subjCard.querySelector("#sjOut").value);

    // ============================================
    // DEEP WORK LOG
    // ============================================
    const dwCard = makeCard("deepwork", "🎯", "Deep Work Session Log", `
      <div class="grid-2">
        <div><label>Task</label><input type="text" id="dwTask"></div>
        <div><label>Minutes</label><input type="number" id="dwMin" value="50"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="dwBtn">Log line</button>
        <button class="btn btn-secondary" type="button" id="dwCopy">Copy log</button>
      </div>
      <textarea id="dwOut" class="result" rows="6"></textarea>
    `);
    const DW_KEY = "qwickton-deepwork-log";
    dwCard.querySelector("#dwBtn").onclick = () => {
      const line = `${new Date().toISOString().slice(0, 16)} | ${dwCard.querySelector("#dwMin").value}m | ${dwCard.querySelector("#dwTask").value.trim() || "focus"}`;
      const prev = localStorage.getItem(DW_KEY) || "";
      const next = prev ? `${prev}\n${line}` : line;
      localStorage.setItem(DW_KEY, next);
      dwCard.querySelector("#dwOut").value = next;
    };
    dwCard.querySelector("#dwCopy").onclick = () => copyText(dwCard.querySelector("#dwOut").value);
    dwCard.querySelector("#dwOut").value = localStorage.getItem(DW_KEY) || "";

    // ============================================
    // LINK-IN-BIO BLOCK
    // ============================================
    const bioBlockCard = makeCard("linkbio", "🔗", "Link-in-Bio Block", `
      <div><label>Headline</label><input type="text" id="lbH" value="My links"></div>
      <div><label>Links label|url per line</label><textarea id="lbL" rows="4" placeholder="Portfolio|https://&#10;Contact|https://"></textarea></div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="lbBtn">Format</button>
        <button class="btn btn-secondary" type="button" id="lbCopy">Copy</button>
      </div>
      <textarea id="lbOut" class="result" rows="8" readonly></textarea>
    `);
    bioBlockCard.querySelector("#lbBtn").onclick = () => {
      const h = bioBlockCard.querySelector("#lbH").value.trim() || "Links";
      const rows = bioBlockCard.querySelector("#lbL").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const lines = [h, "—".repeat(Math.min(h.length + 5, 40)), ...rows.map((r) => {
        const i = r.indexOf("|");
        if (i < 0) return `• ${r}`;
        return `• ${r.slice(0, i).trim()} → ${r.slice(i + 1).trim()}`;
      })];
      bioBlockCard.querySelector("#lbOut").value = lines.join("\n");
    };
    bioBlockCard.querySelector("#lbCopy").onclick = () => copyText(bioBlockCard.querySelector("#lbOut").value);

    // ============================================
    // GLOBAL TIMEZONE MEETING PLANNER
    // ============================================
    const tzCard = makeCard("timezone", "🌐", "Global Timezone Planner", `
      <div class="grid-2">
        <div><label>Base Date</label><input type="date" id="tzDate"></div>
        <div><label>Base Time</label><input type="time" id="tzTime" value="09:00"></div>
        <div><label>Base Timezone</label><select id="tzBase">
          <option value="UTC">UTC</option>
          <option value="Asia/Kolkata">Asia/Kolkata</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New_York</option>
        </select></div>
        <div><label>Locale/Country</label><select id="tzLocale">${localeOptions()}</select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="tzBtn">Build Time Table</button>
        <button class="btn btn-secondary" type="button" id="tzCopy">Copy</button>
        <button class="btn btn-secondary" type="button" id="tzDownload">⬇️ TXT</button>
      </div>
      <textarea id="tzOut" class="result" rows="7" readonly></textarea>
    `);
    tzCard.querySelector("#tzBtn").onclick = () => {
      const date = tzCard.querySelector("#tzDate").value;
      const time = tzCard.querySelector("#tzTime").value;
      const locale = tzCard.querySelector("#tzLocale").value || "en-US";
      if (!date || !time) {
        tzCard.querySelector("#tzOut").value = "Please choose both date and time.";
        return;
      }
      const dateObj = new Date(`${date}T${time}:00`);
      const zones = ["UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo", "Australia/Sydney"];
      const lines = ["Global meeting time table", `Base input: ${date} ${time}`, ""];
      zones.forEach((zone) => {
        const formatted = new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: zone
        }).format(dateObj);
        lines.push(`${zone}: ${formatted}`);
      });
      tzCard.querySelector("#tzOut").value = lines.join("\n");
    };
    tzCard.querySelector("#tzCopy").onclick = () => copyText(tzCard.querySelector("#tzOut").value);
    tzCard.querySelector("#tzDownload").onclick = () => downloadTextFile("global-timezone-plan.txt", tzCard.querySelector("#tzOut").value);

    // ============================================
    // DEADLINE PLANNER (GLOBAL)
    // ============================================
    const ddlCard = makeCard("deadline", "📆", "Deadline Planner + Workdays", `
      <div class="grid-2">
        <div><label>Start Date</label><input type="date" id="ddStart"></div>
        <div><label>Days Required</label><input type="number" id="ddDays" value="14" min="1"></div>
        <div><label>Workdays per Week</label><select id="ddWorkdays">
          <option value="5" selected>5 (Mon-Fri)</option>
          <option value="6">6 (Mon-Sat)</option>
          <option value="7">7 (Everyday)</option>
        </select></div>
        <div><label>Locale/Country</label><select id="ddLocale">${localeOptions()}</select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="ddBtn">Calculate Deadline</button>
        <button class="btn btn-secondary" type="button" id="ddCopy">Copy</button>
      </div>
      <textarea id="ddOut" class="result" rows="6" readonly></textarea>
    `);
    ddlCard.querySelector("#ddBtn").onclick = () => {
      const startRaw = ddlCard.querySelector("#ddStart").value;
      const daysReq = Math.max(1, Math.floor(safeNum(ddlCard.querySelector("#ddDays").value, 14)));
      const workdays = Math.max(5, Math.min(7, Math.floor(safeNum(ddlCard.querySelector("#ddWorkdays").value, 5))));
      const locale = ddlCard.querySelector("#ddLocale").value || "en-US";
      if (!startRaw) {
        ddlCard.querySelector("#ddOut").value = "Please select a start date.";
        return;
      }
      const d = new Date(`${startRaw}T00:00:00`);
      let done = 0;
      while (done < daysReq) {
        const day = d.getDay();
        const isWorkday = workdays === 7 ? true : workdays === 6 ? day !== 0 : day !== 0 && day !== 6;
        if (isWorkday) done++;
        if (done < daysReq) d.setDate(d.getDate() + 1);
      }
      const result = [
        `Start: ${new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date(`${startRaw}T00:00:00`))}`,
        `Required workdays: ${daysReq}`,
        `Workweek mode: ${workdays} days/week`,
        `Estimated deadline: ${new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(d)}`
      ].join("\n");
      ddlCard.querySelector("#ddOut").value = result;
    };
    ddlCard.querySelector("#ddCopy").onclick = () => copyText(ddlCard.querySelector("#ddOut").value);

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "prod-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "prod-focus-host";
    document.body.appendChild(focusOverlay);
    document.body.appendChild(focusHost);

    let activeFocusedCard = null;
    let focusPlaceholder = null;
    let focusOpenTimer = null;

    function openToolFocus(card) {
      if (!card || card.getAttribute("data-focusable") === "false") return;
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (activeFocusedCard === card) return;
      if (activeFocusedCard) activeFocusedCard.classList.remove("is-focused");
      activeFocusedCard = card;
      focusPlaceholder = document.createElement("div");
      focusPlaceholder.style.height = card.offsetHeight + "px";
      card.parentNode.insertBefore(focusPlaceholder, card);
      focusHost.appendChild(card);
      card.classList.add("is-focused");
      card.querySelector("[data-focus-open]")?.classList.add("is-hidden");
      card.querySelector("[data-focus-close]")?.classList.add("active");
      document.body.classList.add("prod-modal-open");
      focusOverlay.classList.add("active");
      focusHost.classList.add("active");
      setTimeout(() => {
        const firstInput = card.querySelector("input, select, textarea, button");
        firstInput?.focus();
      }, 40);
    }

    function closeToolFocus() {
      if (focusOpenTimer) clearTimeout(focusOpenTimer);
      if (!activeFocusedCard) return;
      activeFocusedCard.querySelector("[data-focus-open]")?.classList.remove("is-hidden");
      activeFocusedCard.querySelector("[data-focus-close]")?.classList.remove("active");
      activeFocusedCard.classList.remove("is-focused");
      if (focusPlaceholder?.parentNode) {
        focusPlaceholder.parentNode.insertBefore(activeFocusedCard, focusPlaceholder);
        focusPlaceholder.remove();
      }
      focusPlaceholder = null;
      activeFocusedCard = null;
      focusHost.classList.remove("active");
      focusOverlay.classList.remove("active");
      document.body.classList.remove("prod-modal-open");
    }

    grid.querySelectorAll(".prod-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".prod-card")));
    });
    
    grid.querySelectorAll(".prod-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".prod-card[data-focusable='true'] .prod-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".prod-card"));
      });
    });
    
    focusOverlay.addEventListener("click", () => closeToolFocus());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeToolFocus(); });

    // ============================================
    // NAVIGATION BUTTONS
    // ============================================
    document.querySelectorAll(".tool-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-target");
        const card = document.getElementById(`card-${target}`);
        if (!card) return;
        const mobileLike = window.matchMedia("(max-width: 768px)").matches;
        if (mobileLike) {
          openToolFocus(card);
        } else {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          focusOpenTimer = setTimeout(() => openToolFocus(card), 200);
        }
      });
    });

    const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    ["agendaLocale", "tzLocale", "ddLocale"].forEach((id) => {
      const select = document.getElementById(id);
      if (select && Array.from(select.options).some((opt) => opt.value === browserLocale)) {
        select.value = browserLocale;
      }
    });
    const todayIso = new Date().toISOString().slice(0, 10);
    const tzDateInput = document.getElementById("tzDate");
    if (tzDateInput && !tzDateInput.value) tzDateInput.value = todayIso;
    const ddStartInput = document.getElementById("ddStart");
    if (ddStartInput && !ddStartInput.value) ddStartInput.value = todayIso;

    // ============================================
    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["productivity-tools"] = initProductivityTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initProductivityTools(null);
    }
  });
})();