(function initTemplateCategory() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "Category";

  const catalog = {
    "PDF Tools": ["Image to PDF", "Text to PDF", "PDF Viewer"],
    "Text Tools": ["Word Counter", "Case Converter", "Remove Spaces", "Text Compare"],
    "Converter Tools": ["Length Converter", "Weight Converter", "Data Converter", "Time Converter"],
    "Security Tools": ["Password Generator", "Base64 Encoder", "Base64 Decoder"],
    "Calculator Tools": ["EMI Calculator", "Discount Calculator", "Profit Calculator"],
    "Design Tools": ["Color Picker", "Gradient Generator", "CSS Button Generator"],
    "Social Media Tools": ["Hashtag Generator", "Caption Formatter"],
    "Business Tools": ["Invoice Generator", "Bill Generator"],
    "Data Tools": ["JSON Formatter", "CSV to JSON", "JSON to CSV"],
    "Random Tools": ["Coin Toss", "Dice Roller", "Random Picker"],
    "File Tools": ["File Size Checker", "File Type Detector"],
    "Font Tools": ["Fancy Text Generator"],
    "SEO Tools": ["Meta Tag Generator"],
    "Document Tools": ["Resume Generator"],
    "Math Tools": ["Percentage Calculator", "Ratio Calculator"],
    "Personal Tools": ["BMI Calculator"],
    "Productivity Tools": ["To-do List (Local)", "Pomodoro Timer"],
    "Developer Tools": ["JSON Formatter", "URL Encoder", "URL Decoder"],
    "Utility Tools": ["QR Code Generator"],
    "Creator Tools": ["YouTube Title Generator"],
    "Study Tools": ["Flashcards (Local Storage)"],
  };

  const toolNames = catalog[name] || ["Coming Soon Tool 1", "Coming Soon Tool 2"];

  document.getElementById("catNameBread").textContent = name;
  document.getElementById("catNameTitle").textContent = name;
  document.getElementById("catDescription").textContent =
    `${name} page template with reusable SaaS card structure and SEO-friendly sections.`;
  document.title = `${name} - Qwickton`;

  const grid = document.getElementById("templateToolGrid");
  toolNames.forEach((tool) => {
    const card = document.createElement("article");
    card.className = "tool-card";
    card.innerHTML = `
      <h3>${tool}</h3>
      <p class="small">Template slot ready for frontend-only implementation.</p>
      <button class="btn btn-secondary" type="button" disabled>Implementation Slot</button>
    `;
    grid.appendChild(card);
  });
})();
