/**
 * PERSONAL TOOLS - Complete JavaScript
 * Tools: BMI Calculator, BMR & TDEE Calculator, Hydration Planner
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
  // HISTORY MANAGER
  // ============================================
  const HISTORY_KEY = "qw-personal-history";
  
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } 
    catch { return []; }
  }
  
  function writeHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
    } catch (error) {
      void error;
    }
  }
  
  function pushHistory(type, text, renderFn) {
    if (!text) return;
    writeHistory([{ type, text: String(text).slice(0, 160), ts: Date.now() }, ...readHistory()]);
    if (renderFn) renderFn();
  }

  // ============================================
  // CARD CREATION
  // ============================================
  function initPersonalTools(api) {
    const grid = document.getElementById("categoryToolGrid");
    if (!grid) return;
    if (grid.dataset.personalToolsInitialized === "true") return;
    grid.dataset.personalToolsInitialized = "true";

    function makeCard(id, icon, title, bodyHtml, options = {}) {
      const focusable = options.focusable !== false;
      const card = document.createElement("div");
      card.className = "personal-card";
      card.id = `card-${id}`;
      card.setAttribute("data-tool", id);
      card.setAttribute("data-focusable", focusable ? "true" : "false");
      card.innerHTML = `
        <div class="personal-card-header">
          <div class="personal-card-icon">${icon}</div>
          <h3 class="personal-card-title">${escapeHtml(title)}</h3>
          ${focusable ? `
            <button class="btn btn-secondary personal-focus-btn" type="button" data-focus-open>Open</button>
            <button class="btn btn-secondary personal-focus-inline-close" type="button" data-focus-close>Close</button>
          ` : ""}
        </div>
        ${bodyHtml}
      `;
      grid.appendChild(card);
      return card;
    }

    // ============================================
    // RENDER HISTORY FUNCTION
    // ============================================
    let historyCardEl = null;
    function renderHistory() {
      if (!historyCardEl) return;
      const items = readHistory();
      const historyContainer = historyCardEl.querySelector("#personalHistory");
      if (!historyContainer) return;
      if (!items.length) {
        historyContainer.innerHTML = '<span class="empty-hint">No personal results yet.</span>';
        return;
      }
      historyContainer.innerHTML = items.map((item, idx) => 
        `<button class="prompt-chip" data-idx="${idx}"><strong>${escapeHtml(item.type)}:</strong> ${escapeHtml(item.text)}</button>`
      ).join("");
      historyContainer.querySelectorAll("[data-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          copyText(items[idx]?.text || "");
        });
      });
    }

    // ============================================
    // BMI CALCULATOR CARD
    // ============================================
    const bmiCard = makeCard("bmi", "⚖️", "BMI & Body Metrics Pro", `
      <div class="grid-2">
        <div><label>Weight (kg)</label><input id="bmiW" type="number" placeholder="Weight" value="68" step="0.5"></div>
        <div><label>Height (cm)</label><input id="bmiH" type="number" placeholder="Height" value="170" step="1"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="bmiBtn">📊 Calculate BMI</button>
        <button class="btn btn-secondary" type="button" id="bmiCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="bmiDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="bmiRes" class="result">-</div>
      <div id="bmiMeta" class="result" style="margin-top:0.5rem;">Healthy range weight: -</div>
    `);

    bmiCard.querySelector("#bmiBtn").onclick = () => {
      const w = safeNum(bmiCard.querySelector("#bmiW").value);
      const hCm = safeNum(bmiCard.querySelector("#bmiH").value);
      const h = hCm / 100;
      if (w <= 0 || h <= 0) {
        bmiCard.querySelector("#bmiRes").innerHTML = "⚠️ Please enter valid weight and height";
        return;
      }
      const bmi = w / (h * h);
      const cat = bmi < 18.5
        ? "Underweight"
        : bmi < 25
          ? "Normal weight"
          : bmi < 30
            ? "Overweight"
            : "Obese";
      
      const minW = 18.5 * h * h;
      const maxW = 24.9 * h * h;
      const result = `📊 BMI: ${bmi.toFixed(2)} | Category: ${cat}`;
      const meta = `✅ Healthy weight range: ${minW.toFixed(1)} kg - ${maxW.toFixed(1)} kg`;
      
      bmiCard.querySelector("#bmiRes").innerHTML = result;
      bmiCard.querySelector("#bmiMeta").innerHTML = meta;
      pushHistory("BMI", result, renderHistory);
    };
    
    bmiCard.querySelector("#bmiCopyBtn").onclick = () => {
      const text = `${bmiCard.querySelector("#bmiRes").textContent} | ${bmiCard.querySelector("#bmiMeta").textContent}`;
      copyText(text);
    };
    bmiCard.querySelector("#bmiDownloadBtn").onclick = () => {
      const text = `${bmiCard.querySelector("#bmiRes").textContent}\n${bmiCard.querySelector("#bmiMeta").textContent}`;
      downloadTextFile("bmi-results.txt", text);
    };

    // ============================================
    // BMR & TDEE CALCULATOR CARD
    // ============================================
    const bmrCard = makeCard("bmr", "🔥", "BMR & Daily Calories", `
      <div class="grid-2">
        <div><label>Age (years)</label><input id="bmrAge" type="number" placeholder="Age" value="28"></div>
        <div><label>Gender</label><select id="bmrGender">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select></div>
        <div><label>Weight (kg)</label><input id="bmrW" type="number" placeholder="Weight" value="68"></div>
        <div><label>Height (cm)</label><input id="bmrH" type="number" placeholder="Height" value="170"></div>
        <div><label>Activity Level</label><select id="bmrActivity">
          <option value="1.2">Sedentary (little or no exercise)</option>
          <option value="1.375">Lightly active (1-3 days/week)</option>
          <option value="1.55" selected>Moderately active (3-5 days/week)</option>
          <option value="1.725">Very active (6-7 days/week)</option>
          <option value="1.9">Super active (athlete/physical job)</option>
        </select></div>
        <div><label>Goal Adjustment (± kcal)</label><input id="bmrGoalAdj" type="number" placeholder="Goal calories" value="0"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="bmrBtn">🔥 Calculate BMR & TDEE</button>
        <button class="btn btn-secondary" type="button" id="bmrCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="bmrDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="bmrRes" class="result">-</div>
    `);

    bmrCard.querySelector("#bmrBtn").onclick = () => {
      const age = Math.max(1, safeNum(bmrCard.querySelector("#bmrAge").value));
      const gender = bmrCard.querySelector("#bmrGender").value;
      const w = safeNum(bmrCard.querySelector("#bmrW").value);
      const h = safeNum(bmrCard.querySelector("#bmrH").value);
      const activity = safeNum(bmrCard.querySelector("#bmrActivity").value, 1.55);
      const goalAdj = safeNum(bmrCard.querySelector("#bmrGoalAdj").value, 0);
      
      if (w <= 0 || h <= 0 || age <= 0) {
        bmrCard.querySelector("#bmrRes").innerHTML = "⚠️ Please enter valid age, weight, and height";
        return;
      }
      
      const bmr = gender === "female" 
        ? (10 * w) + (6.25 * h) - (5 * age) - 161 
        : (10 * w) + (6.25 * h) - (5 * age) + 5;
      
      const tdee = bmr * activity;
      const goal = tdee + goalAdj;
      const recommendation = goalAdj > 0 ? "Calorie surplus for weight gain" : goalAdj < 0 ? "Calorie deficit for weight loss" : "Maintenance calories";
      
      const result = `🔥 BMR: ${Math.round(bmr)} kcal/day | 💪 TDEE: ${Math.round(tdee)} kcal/day\n🎯 Goal target: ${Math.round(goal)} kcal/day (${recommendation})`;
      
      bmrCard.querySelector("#bmrRes").textContent = result;
      pushHistory("BMR/TDEE", `${Math.round(bmr)}/${Math.round(tdee)} kcal`, renderHistory);
    };
    
    bmrCard.querySelector("#bmrCopyBtn").onclick = () => copyText(bmrCard.querySelector("#bmrRes").textContent);
    bmrCard.querySelector("#bmrDownloadBtn").onclick = () => downloadTextFile("bmr-tdee-results.txt", bmrCard.querySelector("#bmrRes").textContent);

    // ============================================
    // HYDRATION PLANNER CARD
    // ============================================
    const waterCard = makeCard("water", "💧", "Hydration Planner", `
      <div class="grid-2">
        <div><label>Weight (kg)</label><input id="waterWeight" type="number" placeholder="Weight" value="68" step="0.5"></div>
        <div><label>Workout (mins/day)</label><input id="waterWorkout" type="number" placeholder="Workout minutes" value="30"></div>
        <div><label>Climate Boost (%)</label><input id="waterClimate" type="number" placeholder="0-30%" value="10"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="waterBtn">💧 Calculate Water Intake</button>
        <button class="btn btn-secondary" type="button" id="waterCopyBtn">📋 Copy</button>
        <button class="btn btn-secondary" type="button" id="waterDownloadBtn">⬇️ TXT</button>
      </div>
      <div id="waterRes" class="result">-</div>
      <div id="waterTips" class="result" style="margin-top:0.5rem;">💡 Tip: Spread water intake throughout the day for better hydration.</div>
    `);

    waterCard.querySelector("#waterBtn").onclick = () => {
      const weight = Math.max(1, safeNum(waterCard.querySelector("#waterWeight").value, 68));
      const workout = Math.max(0, safeNum(waterCard.querySelector("#waterWorkout").value, 0));
      const climate = Math.max(0, Math.min(30, safeNum(waterCard.querySelector("#waterClimate").value, 0)));
      
      const baseMl = weight * 35; // 35ml per kg of body weight
      const workoutMl = workout * 12; // 12ml per minute of exercise
      const climateBoost = (baseMl * climate) / 100;
      const totalMl = baseMl + workoutMl + climateBoost;
      const totalL = totalMl / 1000;
      
      const glasses = Math.round(totalMl / 250); // 250ml per glass
      
      const result = `💧 Daily water target: ${totalL.toFixed(2)} liters (${Math.round(totalMl)} ml)\n🥤 About ${glasses} glasses (250ml each)`;
      
      waterCard.querySelector("#waterRes").textContent = result;
      pushHistory("Hydration", `${totalL.toFixed(1)}L/day`, renderHistory);
    };
    
    waterCard.querySelector("#waterCopyBtn").onclick = () => copyText(waterCard.querySelector("#waterRes").textContent);
    waterCard.querySelector("#waterDownloadBtn").onclick = () => downloadTextFile("hydration-plan.txt", waterCard.querySelector("#waterRes").textContent);

    // ============================================
    // SLEEP CYCLE WAKE WINDOWS
    // ============================================
    const sleepCard = makeCard("sleep", "😴", "Sleep Cycle Helper", `
      <div><label>Bedtime (or leave empty & use wake target)</label><input type="time" id="slBed" value="23:00"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="slFromBed">Suggest wake times (90m cycles)</button>
        <button class="btn btn-secondary" id="slCopy">Copy</button>
      </div>
      <textarea id="slOut" class="result" rows="5" readonly></textarea>
    `);
    sleepCard.querySelector("#slFromBed").onclick = () => {
      const t = sleepCard.querySelector("#slBed").value;
      if (!t) return;
      const [h, m] = t.split(":").map(Number);
      const start = h * 60 + m;
      const lines = [];
      for (let c = 4; c <= 6; c++) {
        const wake = (start + c * 90) % (24 * 60);
        const hh = String(Math.floor(wake / 60) % 24).padStart(2, "0");
        const mm = String(wake % 60).padStart(2, "0");
        lines.push(`After ${c} cycles (~${c * 1.5}h sleep): wake ~ ${hh}:${mm}`);
      }
      sleepCard.querySelector("#slOut").value = lines.join("\n");
    };
    sleepCard.querySelector("#slCopy").onclick = () => copyText(sleepCard.querySelector("#slOut").value);

    // ============================================
    // HEART RATE ZONES (simple % of max HR)
    // ============================================
    const hrCard = makeCard("hrzones", "❤️", "Heart Rate Zones", `
      <div><label>Age (years)</label><input type="number" id="hrAge" value="30" min="10" max="100"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="hrBtn">Calculate zones</button>
        <button class="btn btn-secondary" id="hrCopy">Copy</button>
      </div>
      <textarea id="hrOut" class="result" rows="8" readonly></textarea>
    `);
    hrCard.querySelector("#hrBtn").onclick = () => {
      const age = Math.max(10, Math.min(100, safeNum(hrCard.querySelector("#hrAge").value, 30)));
      const maxHr = 220 - age;
      const z = (lo, hi) => `${Math.round(maxHr * lo)}–${Math.round(maxHr * hi)} bpm`;
      hrCard.querySelector("#hrOut").value = [
        `Estimated max HR: ~${maxHr} bpm (220−age, rough estimate)`,
        `Zone 1 (50–60%): ${z(0.5, 0.6)}`,
        `Zone 2 (60–70%): ${z(0.6, 0.7)}`,
        `Zone 3 (70–80%): ${z(0.7, 0.8)}`,
        `Zone 4 (80–90%): ${z(0.8, 0.9)}`,
        `Zone 5 (90–100%): ${z(0.9, 1)}`,
        "— Not medical advice; use HR monitor for training."
      ].join("\n");
    };
    hrCard.querySelector("#hrCopy").onclick = () => copyText(hrCard.querySelector("#hrOut").value);

    // ============================================
    // ONE-REP MAX (Epley)
    // ============================================
    const ormCard = makeCard("orm", "🏋️", "One-Rep Max (Epley)", `
      <div class="grid-2">
        <div><label>Weight lifted</label><input type="number" id="ormW" value="80" step="0.5"></div>
        <div><label>Reps (1–12)</label><input type="number" id="ormR" value="5" min="1" max="12"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="ormBtn">Estimate 1RM</button>
      </div>
      <div id="ormOut" class="result">—</div>
    `);
    ormCard.querySelector("#ormBtn").onclick = () => {
      const w = safeNum(ormCard.querySelector("#ormW").value, 0);
      const r = Math.max(1, Math.min(12, Math.floor(safeNum(ormCard.querySelector("#ormR").value, 5))));
      if (w <= 0) return;
      const oneRm = w * (1 + r / 30);
      ormCard.querySelector("#ormOut").textContent = `Estimated 1RM ≈ ${oneRm.toFixed(1)} (from ${w}×${r})`;
    };

    // ============================================
    // IDEAL WEIGHT RANGE (BMI 18.5–25)
    // ============================================
    const idealCard = makeCard("idealw", "⚖️", "Healthy Weight Range (BMI)", `
      <div><label>Height (cm)</label><input type="number" id="idH" value="175" min="100" max="250"></div>
      <div class="inline-row">
        <button class="btn btn-primary" id="idBtn">Compute</button>
      </div>
      <div id="idOut" class="result">—</div>
    `);
    idealCard.querySelector("#idBtn").onclick = () => {
      const h = Math.max(0.5, safeNum(idealCard.querySelector("#idH").value, 175) / 100);
      const minKg = 18.5 * h * h;
      const maxKg = 25 * h * h;
      idealCard.querySelector("#idOut").textContent = `BMI 18.5–25 ≈ ${minKg.toFixed(1)}–${maxKg.toFixed(1)} kg (for ${(h * 100).toFixed(0)} cm).`;
    };

    // ============================================
    // BODY FAT (U.S. Navy estimator)
    // ============================================
    const navyCard = makeCard("navyfat", "📏", "Body Fat % (Navy method)", `
      <p class="small">Uses neck, waist, height (men) or neck, waist, hip, height (women).</p>
      <div><label>Sex</label><select id="nvS"><option value="m">Male</option><option value="f">Female</option></select></div>
      <div class="grid-2">
        <div><label>Height (cm)</label><input type="number" id="nvHt" value="175"></div>
        <div><label>Neck (cm)</label><input type="number" id="nvNk" value="38"></div>
        <div><label>Waist (cm)</label><input type="number" id="nvWa" value="85"></div>
        <div id="nvHipWrap"><label>Hip (cm)</label><input type="number" id="nvHp" value="95"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="nvBtn">Estimate</button>
      </div>
      <div id="nvOut" class="result">—</div>
    `);
    navyCard.querySelector("#nvS").addEventListener("change", () => {
      navyCard.querySelector("#nvHipWrap").style.display = navyCard.querySelector("#nvS").value === "f" ? "" : "none";
    });
    navyCard.querySelector("#nvHipWrap").style.display = "none";
    navyCard.querySelector("#nvBtn").onclick = () => {
      const f = navyCard.querySelector("#nvS").value === "f";
      const h = safeNum(navyCard.querySelector("#nvHt").value, 175);
      const neck = safeNum(navyCard.querySelector("#nvNk").value, 38);
      const waist = safeNum(navyCard.querySelector("#nvWa").value, 85);
      const hip = safeNum(navyCard.querySelector("#nvHp").value, 95);
      if (h <= neck || waist <= neck || (f && hip <= 0)) {
        navyCard.querySelector("#nvOut").textContent = "Check measurements.";
        return;
      }
      let bf;
      if (f) {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(h)) - 450;
      } else {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
      }
      navyCard.querySelector("#nvOut").textContent = Number.isFinite(bf) ? `Estimated body fat ≈ ${bf.toFixed(1)}%` : "Could not compute.";
    };

    // ============================================
    // MACRO SPLIT
    // ============================================
    const macroCard = makeCard("macro", "🥗", "Macro Calories Split", `
      <div class="grid-2">
        <div><label>Daily calories</label><input type="number" id="mcCal" value="2000"></div>
        <div><label>Protein % / Carb % / Fat %</label><input type="text" id="mcRat" value="30,40,30" placeholder="30,40,30"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" id="mcBtn">Split</button>
        <button class="btn btn-secondary" id="mcCopy">Copy</button>
      </div>
      <div id="mcOut" class="result">—</div>
    `);
    macroCard.querySelector("#mcBtn").onclick = () => {
      const cal = Math.max(0, safeNum(macroCard.querySelector("#mcCal").value, 2000));
      const parts = macroCard.querySelector("#mcRat").value.split(",").map((x) => safeNum(x.trim(), 0));
      const s = parts.reduce((a, b) => a + b, 0) || 100;
      const p = (parts[0] / s) * cal / 4;
      const c = (parts[1] / s) * cal / 4;
      const fat = (parts[2] / s) * cal / 9;
      macroCard.querySelector("#mcOut").textContent = `Protein ~${p.toFixed(0)}g | Carbs ~${c.toFixed(0)}g | Fat ~${fat.toFixed(0)}g (from ${cal} kcal)`;
    };
    macroCard.querySelector("#mcCopy").onclick = () => copyText(macroCard.querySelector("#mcOut").textContent);

    // ============================================
    // STEPS & DISTANCE PLANNER
    // ============================================
    const stepCard = makeCard("steps", "🚶", "Steps & Distance Planner", `
      <div class="grid-2">
        <div><label>Daily Steps Target</label><input type="number" id="spSteps" value="10000" min="1000"></div>
        <div><label>Average Step Length (cm)</label><input type="number" id="spLen" value="75" min="30"></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="spBtn">Calculate Distance</button>
        <button class="btn btn-secondary" type="button" id="spCopy">Copy</button>
      </div>
      <textarea id="spOut" class="result" rows="4" readonly></textarea>
    `);
    stepCard.querySelector("#spBtn").onclick = () => {
      const steps = Math.max(1, safeNum(stepCard.querySelector("#spSteps").value, 10000));
      const stepLenCm = Math.max(1, safeNum(stepCard.querySelector("#spLen").value, 75));
      const meters = (steps * stepLenCm) / 100;
      const km = meters / 1000;
      const miles = km * 0.621371;
      stepCard.querySelector("#spOut").value = [
        `Steps: ${Math.round(steps).toLocaleString()}`,
        `Estimated distance: ${km.toFixed(2)} km`,
        `Approx miles: ${miles.toFixed(2)} mi`
      ].join("\n");
      pushHistory("Steps Planner", `${Math.round(steps)} steps`, renderHistory);
    };
    stepCard.querySelector("#spCopy").onclick = () => copyText(stepCard.querySelector("#spOut").value);

    // ============================================
    // GLOBAL AGE FORMATTER
    // ============================================
    const ageCard = makeCard("ageglobal", "🌍", "Global Age & Date Formatter", `
      <div class="grid-2">
        <div><label>Date of Birth</label><input type="date" id="agDob"></div>
        <div><label>Locale/Country</label><select id="agLocale">${localeOptions()}</select></div>
      </div>
      <div class="inline-row">
        <button class="btn btn-primary" type="button" id="agBtn">Calculate</button>
        <button class="btn btn-secondary" type="button" id="agCopy">Copy</button>
      </div>
      <textarea id="agOut" class="result" rows="5" readonly></textarea>
    `);
    ageCard.querySelector("#agBtn").onclick = () => {
      const dobRaw = ageCard.querySelector("#agDob").value;
      const locale = ageCard.querySelector("#agLocale").value || "en-US";
      if (!dobRaw) {
        ageCard.querySelector("#agOut").value = "Please select date of birth.";
        return;
      }
      const dob = new Date(dobRaw);
      const now = new Date();
      let years = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
      const nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < now) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      const daysLeft = Math.ceil((nextBirthday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const out = [
        `Localized DOB: ${new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(dob)}`,
        `Current age: ${years} years`,
        `Next birthday in: ${daysLeft} day(s)`,
        `Today (${locale}): ${new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(now)}`
      ].join("\n");
      ageCard.querySelector("#agOut").value = out;
      pushHistory("Age Global", `${years}y (${locale})`, renderHistory);
    };
    ageCard.querySelector("#agCopy").onclick = () => copyText(ageCard.querySelector("#agOut").value);

    // ============================================
    // HISTORY CARD (Full Width)
    // ============================================
    const historyCard = makeCard("history", "📜", "Recent Personal Results", `
      <div id="personalHistory" class="chip-list"><span class="empty-hint">No personal results yet.</span></div>
      <div class="inline-row">
        <button class="btn btn-secondary" type="button" id="clearPersonalHistory">🗑️ Clear History</button>
      </div>
    `, { focusable: false });
    historyCard.classList.add("full-width");
    historyCardEl = historyCard;

    historyCard.querySelector("#clearPersonalHistory").addEventListener("click", () => {
      writeHistory([]);
      renderHistory();
    });
    renderHistory();

    // ============================================
    // FOCUS MODAL SYSTEM
    // ============================================
    const focusOverlay = document.createElement("div");
    focusOverlay.className = "personal-focus-overlay";
    const focusHost = document.createElement("div");
    focusHost.className = "personal-focus-host";
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
      document.body.classList.add("personal-modal-open");
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
      document.body.classList.remove("personal-modal-open");
    }

    grid.querySelectorAll(".personal-card [data-focus-open]").forEach(btn => {
      btn.addEventListener("click", (e) => openToolFocus(e.target.closest(".personal-card")));
    });
    
    grid.querySelectorAll(".personal-card [data-focus-close]").forEach(btn => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); closeToolFocus(); });
    });
    
    grid.querySelectorAll(".personal-card[data-focusable='true'] .personal-card-header").forEach(header => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("[data-focus-open], [data-focus-close], button, input, select, textarea, a")) return;
        openToolFocus(e.currentTarget.closest(".personal-card"));
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
    const ageLocale = document.getElementById("agLocale");
    if (ageLocale && Array.from(ageLocale.options).some((opt) => opt.value === browserLocale)) {
      ageLocale.value = browserLocale;
    }

    // ============================================
    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // Register the init function
  window.QwicktonCategoryInits["personal-tools"] = initPersonalTools;

  // Fallback auto-init if bootstrap missing
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("categoryToolGrid") && !window._qwCategoryBootstrapped) {
      initPersonalTools(null);
    }
  });
})();