const checkbox = document.getElementById("enabled");
const switchBtn = document.getElementById("switch-btn");

// Load existing setting
chrome.storage.local.get(["autoClickEnabled"], (result) => {
  // Default to true if never set
  checkbox.checked = result.autoClickEnabled !== false;
  switchBtn.setAttribute("aria-checked", checkbox.checked);
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
