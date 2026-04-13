const clickOidcButton = () => {
  chrome.storage.local.get(["autoClickEnabled", "ssoEnabled"], (result) => {
    const buttons = document.querySelectorAll("button, a");

    for (const btn of buttons) {
      // Cloudflare Access OIDC button
      if (
        result.autoClickEnabled !== false &&
        (btn.textContent.includes("OpenID Connect") ||
          btn.innerText.includes("OIDC"))
      ) {
        btn.click();
        observer.disconnect();
        return;
      }

      // Cloudflare Dash SSO button
      if (
        result.ssoEnabled !== false &&
        (btn.textContent.includes("Log in with SSO") ||
          btn.innerText.includes("Log in with SSO"))
      ) {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput && emailInput.value) {
          btn.click();
          observer.disconnect();
          return;
        }
      }
    }

    if (
      result.ssoEnabled !== false &&
      window.location.hostname === "dash.cloudflare.com"
    ) {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      if (emailInput && emailInput.value && passwordInput) {
        passwordInput.style.display = "none";
        if (passwordInput.parentElement) {
          passwordInput.parentElement.style.display = "none";
        }
      }
    }
  });
};

// Start observing the page
const observer = new MutationObserver(clickOidcButton);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});

// Initial check
clickOidcButton();
