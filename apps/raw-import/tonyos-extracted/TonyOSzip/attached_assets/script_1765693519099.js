// Simple tab switching for Natoli dashboard

function activateTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  const buttons = document.querySelectorAll(".tab-button");

  tabs.forEach(t => {
    if (t.id === tabId) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  buttons.forEach(btn => {
    const target = btn.getAttribute("data-tab");
    if (target === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// set up click handlers
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      if (target) {
        activateTab(target);
      }
    });
  });
});
