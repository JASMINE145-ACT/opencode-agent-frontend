import "jsvectormap/dist/jsvectormap.min.css";
import "flatpickr/dist/flatpickr.min.css";
import "dropzone/dist/dropzone.css";
import "../css/style.css";

import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import flatpickr from "flatpickr";
import Dropzone from "dropzone";

Alpine.plugin(persist);
window.Alpine = Alpine;
Alpine.start();

flatpickr(".datepicker", {
  mode: "range",
  static: true,
  monthSelectorType: "static",
  dateFormat: "M j",
  defaultDate: [new Date().setDate(new Date().getDate() - 6), new Date()],
  prevArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  nextArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  onReady: (selectedDates, dateStr, instance) => {
    instance.element.value = dateStr.replace("to", "-");
    const customClass = instance.element.getAttribute("data-class");
    if (customClass) instance.calendarContainer.classList.add(customClass);
  },
  onChange: (selectedDates, dateStr, instance) => {
    instance.element.value = dateStr.replace("to", "-");
  },
});

const dropzoneArea = document.querySelectorAll("#demo-upload");
if (dropzoneArea.length) {
  new Dropzone("#demo-upload", { url: "/file/post" });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  const copyInput = document.getElementById("copy-input");
  const copyButton = document.getElementById("copy-button");
  const copyText = document.getElementById("copy-text");
  const websiteInput = document.getElementById("website-input");
  if (copyInput && copyButton && copyText && websiteInput) {
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(websiteInput.value).then(() => {
        copyText.textContent = "Copied";
        setTimeout(() => { copyText.textContent = "Copy"; }, 2000);
      });
    });
  }
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  if (searchInput && searchButton) {
    function focusSearchInput() { searchInput.focus(); }
    searchButton.addEventListener("click", focusSearchInput);
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); focusSearchInput(); }
      if (e.key === "/" && document.activeElement !== searchInput) { e.preventDefault(); focusSearchInput(); }
    });
  }
});
