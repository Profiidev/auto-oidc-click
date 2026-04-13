const checkbox = document.getElementById("enabled");

// Load existing setting
chrome.storage.local.get(["autoClickEnabled"], (result) => {
  // Default to true if never set
  checkbox.checked = result.autoClickEnabled !== false;
});

// Save setting on change
checkbox.addEventListener("change", () => {
  chrome.storage.local.set({ autoClickEnabled: checkbox.checked });
});
