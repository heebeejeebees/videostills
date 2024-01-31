const utilTitle = document.getElementById('drag-area-header'),
  utilMsg = document.getElementById('drag-area-span'),
  utilBtn = document.getElementById('browse-btn'),
  utilArea = document.getElementById('drag-area');

/* work in progress */
const customErrorMessage = (title, message) => {
  utilArea.style.display = 'flex';
  utilTitle.textContent = title;
  utilMsg.textContent = message;
  utilBtn.style.display = 'none';
};
