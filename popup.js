const checkbox = document.getElementById("enabled");
const switchBtn = document.getElementById("switch-btn");
const addRuleBtn = document.getElementById("add-rule-btn");
const rulesList = document.getElementById("rules-list");
const errorMsg = document.getElementById("error-message");

let rules = [];

// Load existing settings
chrome.storage.sync.get(["autoClickEnabled", "clickRules"], (result) => {
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
  chrome.storage.sync.set({ autoClickEnabled: checkbox.checked });
  switchBtn.setAttribute("aria-checked", checkbox.checked);
});

switchBtn.addEventListener("click", () => {
  const isChecked = switchBtn.getAttribute("aria-checked") === "true";
  switchBtn.setAttribute("aria-checked", !isChecked);
  checkbox.checked = !isChecked;
  // Trigger change event
  checkbox.dispatchEvent(new Event("change"));
});

addRuleBtn.addEventListener("click", async () => {
  errorMsg.style.display = "none";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (
    tab &&
    (tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("https://chrome.google.com/webstore") ||
      tab.url.startsWith("https://chromewebstore.google.com/"))
  ) {
    errorMsg.textContent = "Cannot add rules on restricted browser pages.";
    errorMsg.style.display = "block";
    return;
  }
  const newIndex = rules.length;
  rules.push({ url: "", selector: "", text: "" });
  saveRules();
  await startSelecting(newIndex);
});

function saveRules() {
  chrome.storage.sync.set({ clickRules: rules });
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
  errorMsg.style.display = "none";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("https://chrome.google.com/webstore") ||
    tab.url.startsWith("https://chromewebstore.google.com/")
  ) {
    errorMsg.textContent =
      "Cannot select elements on restricted browser pages.";
    errorMsg.style.display = "block";
    return;
  }

  await chrome.scripting.executeScript({
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
        const getElementIdentifier = (element) => {
          if (element.id) return `#${CSS.escape(element.id)}`;

          const testId = element.getAttribute("data-testid");
          if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

          let identifier = element.tagName.toLowerCase();
          const nameAttr = element.getAttribute("name");
          const ariaLabel = element.getAttribute("aria-label");
          const role = element.getAttribute("role");

          if (nameAttr) return `${identifier}[name="${CSS.escape(nameAttr)}"]`;
          if (ariaLabel)
            return `${identifier}[aria-label="${CSS.escape(ariaLabel)}"]`;
          if (role) return `${identifier}[role="${CSS.escape(role)}"]`;

          // Only use simple, stable-looking classes
          if (element.className && typeof element.className === "string") {
            const classes = element.className
              .split(/\s+/)
              .filter((c) => c && /^[a-zA-Z0-9_-]+$/.test(c)) // Avoid colons, brackets, etc.
              .filter(
                (c) =>
                  !c.includes("hover") &&
                  !c.includes("focus") &&
                  !c.includes("active"),
              )
              .slice(0, 2); // Only take the first 2 classes
            if (classes.length > 0) identifier += `.${classes.join(".")}`;
          }
          return identifier;
        };

        const paths = [];
        let current = el;
        let depth = 0;
        while (current && current !== document.body && depth < 4) {
          paths.unshift(getElementIdentifier(current));
          current = current.parentElement;
          depth++;
        }
        return paths.join(" > ");
      };

      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        document.removeEventListener("mousemove", moveHandler, true);
        document.removeEventListener("click", clickHandler, true);

        const target = document.elementFromPoint(e.clientX, e.clientY);
        overlay.remove();

        if (!target) return;

        const selector = getSelector(target);
        const url = window.location.hostname;
        const text = (
          target.innerText ||
          target.value ||
          target.getAttribute("aria-label") ||
          target.getAttribute("name") ||
          ""
        )
          .trim()
          .split("\n")[0]
          .slice(0, 50);

        chrome.storage.sync.get(["clickRules"], (result) => {
          let rulesStorage = result.clickRules || [];
          if (rulesStorage[ruleIndex]) {
            rulesStorage[ruleIndex].selector = selector;
            rulesStorage[ruleIndex].url = url;
            rulesStorage[ruleIndex].text = text;
            chrome.storage.sync.set({ clickRules: rulesStorage }, () => {
              // Update local state and render
              rules = rulesStorage;
              renderRules();
            });
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

    const infoContainer = document.createElement("div");
    infoContainer.className = "rule-info";

    const urlEl = document.createElement("div");
    urlEl.className = "rule-url";
    urlEl.textContent = rule.url || "Select website";
    urlEl.title = rule.url || "";

    const textEl = document.createElement("div");
    textEl.className = "rule-text";
    textEl.textContent = rule.text ? `Btn: ${rule.text}` : "Select button";
    textEl.title = rule.selector || "";

    infoContainer.appendChild(urlEl);
    infoContainer.appendChild(textEl);

    const actionsEl = document.createElement("div");
    actionsEl.className = "rule-actions";

    const selectBtn = document.createElement("button");
    selectBtn.className = "btn btn-ghost icon-btn";
    selectBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
    `;
    selectBtn.title = "Reselect";
    selectBtn.addEventListener("click", () => startSelecting(index));

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-ghost btn-destructive icon-btn";
    removeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    `;
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => removeRule(index));

    actionsEl.appendChild(selectBtn);
    actionsEl.appendChild(removeBtn);

    ruleEl.appendChild(infoContainer);
    ruleEl.appendChild(actionsEl);

    rulesList.appendChild(ruleEl);
  });
}
