document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("revopsBtn");
  const modal = document.getElementById("revopsModal");
  const scrim = modal ? modal.querySelector(".revops-scrim") : null;
  const closeBtn = document.getElementById("revopsCloseBtn");
  const printBtn = document.getElementById("revopsPrintBtn");
  const expandAllBtn = document.getElementById("revopsExpandAll");
  const accordion = document.getElementById("revopsAccordion");

  if (!btn || !modal || !scrim || !closeBtn) {
    console.log("RevOps modal: Missing elements", { btn: !!btn, modal: !!modal, scrim: !!scrim, closeBtn: !!closeBtn });
    return;
  }

  console.log("RevOps modal initialized");

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    btn.focus();
  }

  btn.addEventListener("click", function(e) {
    e.preventDefault();
    console.log("RevOps button clicked");
    openModal();
  });

  closeBtn.addEventListener("click", closeModal);

  scrim.addEventListener("click", function(e) {
    if (e.target && e.target.dataset && e.target.dataset.close) closeModal();
  });

  document.addEventListener("keydown", function(e) {
    const isOpen = modal.getAttribute("aria-hidden") === "false";
    if (!isOpen) return;
    if (e.key === "Escape") closeModal();
  });

  if (printBtn) {
    printBtn.addEventListener("click", function() {
      if (accordion) {
        const details = accordion.querySelectorAll("details");
        details.forEach(d => d.setAttribute("open", ""));
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "";
      window.print();
      document.body.style.overflow = prevOverflow;
    });
  }

  if (expandAllBtn && accordion) {
    let allExpanded = false;
    expandAllBtn.addEventListener("click", function() {
      const details = accordion.querySelectorAll("details");
      allExpanded = !allExpanded;
      details.forEach(d => {
        if (allExpanded) {
          d.setAttribute("open", "");
        } else {
          d.removeAttribute("open");
        }
      });
      expandAllBtn.textContent = allExpanded ? "Collapse All Steps" : "Expand All Steps";
    });
  }
});
