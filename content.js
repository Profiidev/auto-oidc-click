const clickOidcButton = () => {
  chrome.storage.local.get(['autoClickEnabled'], (result) => {
    // Exit if the user turned the toggle off
    if (result.autoClickEnabled === false) return;

    const buttons = document.querySelectorAll('button, a');
    for (const btn of buttons) {
      if (btn.textContent.includes('OpenID Connect') || btn.innerText.includes('OIDC')) {
        btn.click();
        // Stop observing once we've succeeded
        observer.disconnect();
        break;
      }
    }
  });
};

// Start observing the page
const observer = new MutationObserver(clickOidcButton);
observer.observe(document.body, { childList: true, subtree: true });

// Initial check
clickOidcButton();
