const clickedElements = new WeakSet();

const processPage = () => {
  if (!chrome.runtime?.id) {
    if (typeof observer !== "undefined") observer.disconnect();
    return;
  }

  try {
    chrome.storage.local.get(["autoClickEnabled", "clickRules"], (result) => {
      // Exit if the global toggle is off
      if (result.autoClickEnabled === false) return;

      const rules = result.clickRules || [];
      const currentUrl = window.location.href;

      // Process generalized click rules
      for (const rule of rules) {
        if (rule.url && rule.selector && currentUrl.includes(rule.url)) {
          try {
            const elements = document.querySelectorAll(rule.selector);
            for (const el of elements) {
              if (!clickedElements.has(el)) {
                el.click();
                clickedElements.add(el);
              }
            }
          } catch (e) {
            // Ignore invalid CSS selectors
            console.warn("Auto OIDC Click: Invalid selector", rule.selector);
          }
        }
      }
    });
  } catch (e) {
    if (
      e.message.includes("Extension context invalidated") &&
      typeof observer !== "undefined"
    ) {
      observer.disconnect();
    }
  }
};

// Start observing the page for dynamic changes
const observer = new MutationObserver(processPage);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});

// Initial check
processPage();

// Interval check as a fallback for some SPA navigations
//setInterval(processPage, 500);
