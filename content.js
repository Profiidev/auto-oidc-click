const clickedElements = new WeakSet();

const processPage = () => {
  if (!chrome.runtime?.id) {
    if (typeof observer !== "undefined") observer.disconnect();
    return;
  }

  try {
    chrome.storage.local.get(["autoClickEnabled", "clickRules"], (result) => {
      if (result.autoClickEnabled === false) return;

      const rules = result.clickRules || [];
      const currentUrl = window.location.href;

      for (const rule of rules) {
        if (rule.url && rule.selector && currentUrl.includes(rule.url)) {
          try {
            const elements = document.querySelectorAll(rule.selector);
            if (elements.length === 0) {
              console.log("Auto OIDC Click: No elements found for selector:", rule.selector);
            }
            for (const el of elements) {
              if (!clickedElements.has(el)) {
                const elText = (el.innerText || 
                               el.value || 
                               el.getAttribute("aria-label") || 
                               el.getAttribute("name") || 
                               "")
                  .trim()
                  .split("\n")[0]
                  .slice(0, 50);
                
                const matchesText = !rule.text || 
                                  elText.includes(rule.text) || 
                                  rule.text.includes(elText) ||
                                  el.textContent.includes(rule.text);

                if (matchesText) {
                  console.log("Auto OIDC Click: Clicking element", el, "based on rule", rule);
                  el.click();
                  clickedElements.add(el);
                } else {
                  console.log("Auto OIDC Click: Text mismatch. Expected:", rule.text, "Found:", elText);
                }
              }
            }
          } catch (e) {
            console.warn("Auto OIDC Click: Invalid selector or error", rule.selector, e);
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
