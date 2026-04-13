const checkbox = document.getElementById("enabled");
const switchBtn = document.getElementById("switch-btn");

const ssoCheckbox = document.getElementById("sso-enabled");
const ssoSwitchBtn = document.getElementById("sso-switch-btn");

// Load existing setting
chrome.storage.local.get(["autoClickEnabled", "ssoEnabled"], (result) => {
  // Default to true if never set
  checkbox.checked = result.autoClickEnabled !== false;
  switchBtn.setAttribute("aria-checked", checkbox.checked);

  ssoCheckbox.checked = result.ssoEnabled !== false;
  ssoSwitchBtn.setAttribute("aria-checked", ssoCheckbox.checked);
});

// Save setting on change
checkbox.addEventListener("change", () => {
  chrome.storage.local.set({ autoClickEnabled: checkbox.checked });
  switchBtn.setAttribute("aria-checked", checkbox.checked);
});

switchBtn.addEventListener("click", () => {
  const isChecked = switchBtn.getAttribute("aria-checked") === "true";
  switchBtn.setAttribute("aria-checked", !isChecked);
  checkbox.checked = !isChecked;
  // Trigger change event for popup.js
  checkbox.dispatchEvent(new Event("change"));
});

// Save SSO setting on change
ssoCheckbox.addEventListener("change", () => {
  chrome.storage.local.set({ ssoEnabled: ssoCheckbox.checked });
  ssoSwitchBtn.setAttribute("aria-checked", ssoCheckbox.checked);
});

ssoSwitchBtn.addEventListener("click", () => {
  const isChecked = ssoSwitchBtn.getAttribute("aria-checked") === "true";
  ssoSwitchBtn.setAttribute("aria-checked", !isChecked);
  ssoCheckbox.checked = !isChecked;
  // Trigger change event
  ssoCheckbox.dispatchEvent(new Event("change"));
});
