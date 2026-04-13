const checkbox = document.getElementById("enabled");
const switchBtn = document.getElementById("switch-btn");
const addRuleBtn = document.getElementById("add-rule-btn");
const rulesList = document.getElementById("rules-list");

let rules = [];

// Load existing settings
chrome.storage.local.get(["autoClickEnabled", "clickRules"], (result) => {
  // Default to true if never set
  checkbox.checked = result.autoClickEnabled !== false;
  switchBtn.setAttribute("aria-checked", checkbox.checked);

  if (result.clickRules && Array.isArray(result.clickRules)) {
    rules = result.clickRules;
  } else {
    rules = [];
  }
  renderRules();
});

// Save global setting on change
checkbox.addEventListener("change", () => {
  chrome.storage.local.set({ autoClickEnabled: checkbox.checked });
  switchBtn.setAttribute("aria-checked", checkbox.checked);
});

switchBtn.addEventListener("click", () => {
  const isChecked = switchBtn.getAttribute("aria-checked") === "true";
  switchBtn.setAttribute("aria-checked", !isChecked);
  checkbox.checked = !isChecked;
  // Trigger change event
  checkbox.dispatchEvent(new Event("change"));
});

addRuleBtn.addEventListener("click", () => {
  rules.push({ url: "", selector: "" });
  saveRules();
  renderRules();
});

function saveRules() {
  chrome.storage.local.set({ clickRules: rules });
}

function removeRule(index) {
  rules.splice(index, 1);
  saveRules();
  renderRules();
}

function updateRule(index, field, value) {
  rules[index][field] = value;
  saveRules();
}

function renderRules() {
  rulesList.innerHTML = "";

  rules.forEach((rule, index) => {
    const ruleEl = document.createElement("div");
    ruleEl.className = "rule-item";

    const urlInput = document.createElement("input");
    urlInput.className = "rule-input";
    urlInput.type = "text";
    urlInput.placeholder = "URL match (e.g. dash.cloudflare.com)";
    urlInput.value = rule.url || "";
    urlInput.addEventListener("input", (e) =>
      updateRule(index, "url", e.target.value),
    );

    const selectorInput = document.createElement("input");
    selectorInput.className = "rule-input";
    selectorInput.type = "text";
    selectorInput.placeholder = "CSS Selector (e.g. button#login)";
    selectorInput.value = rule.selector || "";
    selectorInput.addEventListener("input", (e) =>
      updateRule(index, "selector", e.target.value),
    );

    const actionsEl = document.createElement("div");
    actionsEl.className = "rule-actions";

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeRule(index));

    actionsEl.appendChild(removeBtn);

    ruleEl.appendChild(urlInput);
    ruleEl.appendChild(selectorInput);
    ruleEl.appendChild(actionsEl);

    rulesList.appendChild(ruleEl);
  });
}
