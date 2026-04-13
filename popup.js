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

async function startSelecting(index) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (ruleIndex) => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "999999";
      overlay.style.backgroundColor = "rgba(0, 120, 255, 0.4)";
      overlay.style.border = "2px solid #0078ff";
      overlay.style.transition = "all 0.1s ease";
      overlay.style.display = "none";
      document.body.appendChild(overlay);

      const moveHandler = (e) => {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (
          target &&
          target !== document.body &&
          target !== document.documentElement
        ) {
          const rect = target.getBoundingClientRect();
          overlay.style.top = rect.top + "px";
          overlay.style.left = rect.left + "px";
          overlay.style.width = rect.width + "px";
          overlay.style.height = rect.height + "px";
          overlay.style.display = "block";
        } else {
          overlay.style.display = "none";
        }
      };

      const getSelector = (el) => {
        if (el.id) return `#${el.id}`;
        if (el.className && typeof el.className === "string") {
          const classes = el.className.trim().split(/\s+/).join(".");
          if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
        }
        return el.tagName.toLowerCase();
      };

      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        document.removeEventListener("mousemove", moveHandler, true);
        document.removeEventListener("click", clickHandler, true);

        const target = document.elementFromPoint(e.clientX, e.clientY);
        overlay.remove();

        const selector = target ? getSelector(target) : "";
        const url = window.location.hostname;

        chrome.storage.local.get(["clickRules"], (result) => {
          let rules = result.clickRules || [];
          if (rules[ruleIndex]) {
            if (selector) rules[ruleIndex].selector = selector;
            if (url && !rules[ruleIndex].url) rules[ruleIndex].url = url;
            chrome.storage.local.set({ clickRules: rules });
          }
        });
      };

      document.addEventListener("mousemove", moveHandler, true);
      document.addEventListener("click", clickHandler, true);
    },
    args: [index],
  });
  window.close();
}

function renderRules() {
  rulesList.innerHTML = "";

  rules.forEach((rule, index) => {
    const ruleEl = document.createElement("div");
    ruleEl.className = "rule-item";

    const urlInput = document.createElement("div");
    urlInput.className = "rule-input";
    urlInput.textContent = rule.url || "URL: Not selected";

    const selectorInput = document.createElement("div");
    selectorInput.className = "rule-input";
    selectorInput.textContent = rule.selector || "Selector: Not selected";

    const actionsEl = document.createElement("div");
    actionsEl.className = "rule-actions";

    const selectBtn = document.createElement("button");
    selectBtn.className = "select-btn";
    selectBtn.textContent = "Select";
    selectBtn.addEventListener("click", () => startSelecting(index));

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeRule(index));

    actionsEl.appendChild(selectBtn);
    actionsEl.appendChild(removeBtn);

    ruleEl.appendChild(urlInput);
    ruleEl.appendChild(selectorInput);
    ruleEl.appendChild(actionsEl);

    rulesList.appendChild(ruleEl);
  });
}
