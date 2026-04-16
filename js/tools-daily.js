(function initDailyToolsUpgrade() {
  const historyKey = "qw-daily-history";

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(historyKey) || "[]");
    } catch {
      return [];
    }
  }

  function writeHistory(items) {
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 16)));
  }

  function addHistory(label, value) {
    const items = readHistory();
    const record = `${label}: ${value}`;
    writeHistory([record, ...items.filter((item) => item !== record)]);
    renderHistory();
  }

  function renderHistory() {
    const node = document.getElementById("dailyHistory");
    if (!node) return;
    const items = readHistory();
    if (!items.length) {
      node.innerHTML = '<span class="empty">No recent output yet.</span>';
      return;
    }
    node.innerHTML = items
      .map(
        (item) =>
          `<button type="button" class="tool-chip" data-history-item="${escapeHtml(item)}">${item}</button>`
      )
      .join("");
    node.querySelectorAll("[data-history-item]").forEach((chip) => {
      chip.addEventListener("click", () => {
        copyText(chip.textContent?.trim() || "");
      });
    });
  }

  async function copyText(value) {
    if (!value) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  function numberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function tokenizeExpression(expression) {
    const tokens = [];
    let i = 0;
    while (i < expression.length) {
      const ch = expression[i];
      if (/\s/.test(ch)) {
        i += 1;
        continue;
      }
      if (/[+\-*/()%]/.test(ch)) {
        tokens.push(ch);
        i += 1;
        continue;
      }
      if (/\d|\./.test(ch)) {
        let j = i + 1;
        while (j < expression.length && /[\d.]/.test(expression[j])) j += 1;
        const raw = expression.slice(i, j);
        if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) return null;
        tokens.push(raw);
        i = j;
        continue;
      }
      return null;
    }
    return tokens;
  }

  function toRpn(tokens) {
    const output = [];
    const ops = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
    let prev = null;

    for (const token of tokens) {
      if (/^\d+(\.\d+)?$|^\.\d+$/.test(token)) {
        output.push(token);
        prev = "num";
        continue;
      }
      if (token === "%") {
        if (prev !== "num") return null;
        output.push("%");
        prev = "num";
        continue;
      }
      if (token === "(") {
        ops.push(token);
        prev = "(";
        continue;
      }
      if (token === ")") {
        let found = false;
        while (ops.length) {
          const top = ops.pop();
          if (top === "(") {
            found = true;
            break;
          }
          output.push(top);
        }
        if (!found) return null;
        prev = "num";
        continue;
      }
      if (!(token in precedence)) return null;
      if (token === "-" && (prev === null || prev === "(" || prev === "op")) {
        output.push("0");
      } else if (prev === null || prev === "(" || prev === "op") {
        return null;
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (!(top in precedence) || precedence[top] < precedence[token]) break;
        output.push(ops.pop());
      }
      ops.push(token);
      prev = "op";
    }

    while (ops.length) {
      const top = ops.pop();
      if (top === "(" || top === ")") return null;
      output.push(top);
    }
    return output;
  }

  function evalRpn(rpn) {
    const stack = [];
    for (const token of rpn) {
      if (/^\d+(\.\d+)?$|^\.\d+$/.test(token)) {
        stack.push(Number(token));
        continue;
      }
      if (token === "%") {
        if (!stack.length) return null;
        const value = stack.pop();
        stack.push(value / 100);
        continue;
      }
      const right = stack.pop();
      const left = stack.pop();
      if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
      if (token === "+") stack.push(left + right);
      else if (token === "-") stack.push(left - right);
      else if (token === "*") stack.push(left * right);
      else if (token === "/") {
        if (right === 0) return null;
        stack.push(left / right);
      } else {
        return null;
      }
    }
    if (stack.length !== 1) return null;
    const value = stack[0];
    return Number.isFinite(value) ? value : null;
  }

  function evaluateExpressionSafely(expression) {
    const tokens = tokenizeExpression(expression);
    if (!tokens) return null;
    const rpn = toRpn(tokens);
    if (!rpn) return null;
    return evalRpn(rpn);
  }

  (function initSmartCalculator() {
    const aInput = document.getElementById("calcA");
    const bInput = document.getElementById("calcB");
    const exprInput = document.getElementById("calcExpr");
    const exprBtn = document.getElementById("calcExprBtn");
    const result = document.getElementById("calcResult");
    const opButtons = Array.from(document.querySelectorAll("[data-op]"));
    const copyBtn = document.getElementById("copyCalcResult");
    const resetBtn = document.getElementById("resetCalc");
    if (!aInput || !bInput || !exprInput || !exprBtn || !result || !opButtons.length) return;

    function setResult(value) {
      result.textContent = `Result: ${value}`;
      addHistory("Calculator", String(value));
    }

    opButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = numberOrNull(aInput.value);
        const b = numberOrNull(bInput.value);
        const op = btn.getAttribute("data-op");
        if (a === null || b === null) {
          result.textContent = "Result: Enter valid numbers.";
          return;
        }
        const outcomeMap = {
          "+": a + b,
          "-": a - b,
          "*": a * b,
          "/": b === 0 ? NaN : a / b,
        };
        const value = outcomeMap[op];
        if (!Number.isFinite(value)) {
          result.textContent = "Result: Invalid operation.";
          return;
        }
        setResult(value);
      });
    });

    exprBtn.addEventListener("click", () => {
      const expression = exprInput.value.trim();
      if (!expression) {
        result.textContent = "Result: Enter expression.";
        return;
      }
      if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        result.textContent = "Result: Expression contains invalid characters.";
        return;
      }
      const output = evaluateExpressionSafely(expression);
      if (output === null) {
        result.textContent = "Result: Could not evaluate expression.";
        return;
      }
      setResult(output);
    });

    exprInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        exprBtn.click();
      }
    });

    copyBtn?.addEventListener("click", async () => {
      const text = result.textContent.replace(/^Result:\s*/i, "").trim();
      if (!text || text === "-") return;
      const done = await copyText(text);
      if (done) {
        result.textContent = `Result: ${text} (copied)`;
      }
    });
    resetBtn?.addEventListener("click", () => {
      aInput.value = "";
      bInput.value = "";
      exprInput.value = "";
      result.textContent = "Result: -";
    });
  })();

  (function initAgeCalculatorPlus() {
    const dobInput = document.getElementById("dobInput");
    const ageAtInput = document.getElementById("ageAtDate");
    const button = document.getElementById("calcAgeBtn");
    const result = document.getElementById("ageResult");
    if (!dobInput || !button || !result) return;

    button.addEventListener("click", () => {
      if (!dobInput.value) {
        result.textContent = "Age: Please select date of birth.";
        return;
      }
      const dob = new Date(dobInput.value);
      const target = ageAtInput?.value ? new Date(ageAtInput.value) : new Date();
      if (target < dob) {
        result.textContent = "Age: Invalid date range.";
        return;
      }

      let years = target.getFullYear() - dob.getFullYear();
      let months = target.getMonth() - dob.getMonth();
      let days = target.getDate() - dob.getDate();
      if (days < 0) {
        months -= 1;
        const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
        days += prevMonthDays;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const nextBirthday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < target) nextBirthday.setFullYear(target.getFullYear() + 1);
      const daysToBirthday = Math.ceil(
        (nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
      );

      const output = `${years} years, ${months} months, ${days} days | Next birthday in ${daysToBirthday} day(s)`;
      result.textContent = `Age: ${output}`;
      addHistory("Age", output);
    });
    ageAtInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") button.click();
    });
  })();

  (function initGSTCalculatorAdvanced() {
    const amountInput = document.getElementById("baseAmount");
    const rateInput = document.getElementById("gstRate");
    const addBtn = document.getElementById("gstAddBtn");
    const removeBtn = document.getElementById("gstRemoveBtn");
    const result = document.getElementById("gstResult");
    const presets = [
      { id: "gstPreset5", value: 5 },
      { id: "gstPreset12", value: 12 },
      { id: "gstPreset18", value: 18 },
      { id: "gstPreset28", value: 28 },
    ];
    if (!amountInput || !rateInput || !addBtn || !removeBtn || !result) return;

    function parseInputs() {
      const amount = numberOrNull(amountInput.value);
      const rate = numberOrNull(rateInput.value);
      if (amount === null || rate === null || amount < 0 || rate < 0) return null;
      return { amount, rate };
    }

    presets.forEach((preset) => {
      document.getElementById(preset.id)?.addEventListener("click", () => {
        rateInput.value = String(preset.value);
      });
    });

    addBtn.addEventListener("click", () => {
      const values = parseInputs();
      if (!values) {
        result.textContent = "GST output: Enter a valid amount and rate.";
        return;
      }
      const gstValue = (values.amount * values.rate) / 100;
      const half = gstValue / 2;
      const output = `Tax ${gstValue.toFixed(2)} | CGST ${half.toFixed(2)} | SGST ${half.toFixed(2)} | Total ${(values.amount + gstValue).toFixed(2)}`;
      result.textContent = `GST output: ${output}`;
      addHistory("GST Add", output);
    });

    removeBtn.addEventListener("click", () => {
      const values = parseInputs();
      if (!values) {
        result.textContent = "GST output: Enter a valid amount and rate.";
        return;
      }
      const base = (values.amount * 100) / (100 + values.rate);
      const gstValue = values.amount - base;
      const output = `Base ${base.toFixed(2)} | GST ${gstValue.toFixed(2)} | CGST ${(gstValue / 2).toFixed(2)} | SGST ${(gstValue / 2).toFixed(2)}`;
      result.textContent = `GST output: ${output}`;
      addHistory("GST Remove", output);
    });

    amountInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addBtn.click();
    });
  })();

  (function initLengthConverterAdvanced() {
    const valueInput = document.getElementById("lengthValue");
    const fromInput = document.getElementById("lengthFrom");
    const toInput = document.getElementById("lengthTo");
    const convertBtn = document.getElementById("convertLengthBtn");
    const swapBtn = document.getElementById("swapLengthBtn");
    const result = document.getElementById("lengthResult");
    if (!valueInput || !fromInput || !toInput || !convertBtn || !result) return;

    const factors = { m: 1, km: 1000, cm: 0.01, ft: 0.3048, in: 0.0254 };

    function convert() {
      const value = numberOrNull(valueInput.value);
      if (value === null) {
        result.textContent = "Converted value: Enter a valid number.";
        return;
      }
      const meters = value * factors[fromInput.value];
      const output = meters / factors[toInput.value];
      const formatted = `${output.toFixed(6)} ${toInput.value}`;
      result.textContent = `Converted value: ${formatted}`;
      addHistory("Length", `${value} ${fromInput.value} -> ${formatted}`);
    }

    convertBtn.addEventListener("click", convert);
    swapBtn?.addEventListener("click", () => {
      const previousFrom = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = previousFrom;
      convert();
    });
  })();

  (function initDateDiffAdvanced() {
    const startInput = document.getElementById("dateStart");
    const endInput = document.getElementById("dateEnd");
    const button = document.getElementById("dateDiffBtn");
    const result = document.getElementById("dateDiffResult");
    if (!startInput || !endInput || !button || !result) return;

    function countWeekdays(start, end) {
      const current = new Date(start);
      let weekdays = 0;
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) weekdays += 1;
        current.setDate(current.getDate() + 1);
      }
      return weekdays;
    }

    button.addEventListener("click", () => {
      if (!startInput.value || !endInput.value) {
        result.textContent = "Difference: Select both dates.";
        return;
      }
      const start = new Date(startInput.value);
      const end = new Date(endInput.value);
      const forward = end >= start;
      const minDate = forward ? start : end;
      const maxDate = forward ? end : start;
      const diffMs = maxDate.getTime() - minDate.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const weekdays = countWeekdays(minDate, maxDate);
      const output = `${days} day(s), ${weeks} week(s), ${weekdays} weekday(s)`;
      result.textContent = `Difference: ${output} ${forward ? "after" : "before"} start date`;
      addHistory("Date Diff", output);
    });

    [startInput, endInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") button.click();
      });
    });
  })();

  document.getElementById("copyDailyHistory")?.addEventListener("click", async () => {
    const items = readHistory();
    if (!items.length) return;
    await copyText(items.join("\n"));
  });
  document.getElementById("exportDailyHistory")?.addEventListener("click", () => {
    const items = readHistory();
    if (!items.length) return;
    const content = [
      "Qwickton Daily Tools History",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      ...items.map((item, idx) => `${idx + 1}. ${item}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-tools-history.txt";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("clearDailyHistory")?.addEventListener("click", () => {
    localStorage.removeItem(historyKey);
    renderHistory();
  });

  renderHistory();
})();
