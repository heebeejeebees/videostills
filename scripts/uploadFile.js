const dropArea = document.getElementById('drag-area'),
  dragText = document.getElementById('drag-drop-header'),
  browseBtn = document.getElementById('browse-btn'),
  input = document.getElementById('file-input'),
  vidControls = document.getElementById('controls');

let file;

browseBtn.onclick = () => {
  input.click();
};

input.addEventListener('change', async function () {
  file = this.files[0];
  dropArea.classList.add('active');
  await validateFile();
});

//If user Drag File Over DropArea
dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('active');
  dragText.textContent = 'Release to Upload File';
});

//If user leave dragged File from DropArea
dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('active');
  dragText.textContent = 'drag & drop to upload video';
});

//If user drop File on DropArea
dropArea.addEventListener('drop', async (event) => {
  event.preventDefault();
  file = event.dataTransfer.files[0];
  await validateFile();
});

async function validateFile() {
  let fileType = file.type;
  // TODO limiter on video lengths
  let vidExts = ['video/mp4', 'video/ogg', 'video/webm'];
  let imgExts = ['image/jpeg', 'image/jpg', 'image/png'];
  if (vidExts.includes(fileType)) {
    let fileReader = new FileReader();
    fileReader.onload = async () => {
      const videoDiv = document.getElementById('video-frame');
      const video = document.createElement('video');
      video.id = 'video';
      video.crossOrigin = 'anonymous';
      video.src = fileReader.result;
      video.type = fileType;
      videoDiv.append(video);
      video.muted = true;
      await video.play();
      // TODO add progress bar:
      // https://www.codingnepalweb.com/file-upload-with-progress-bar-html-javascript/
      processVideoTrack();
      // TODO allow user to remove/replace current file
      dropArea.remove();
      videoDiv.style.display = 'grid';
      vidControls.style.display = 'grid';
    };

    fileReader.readAsDataURL(file);
  } else if (imgExts.includes(fileType)) {
    // TODO calculate as one frame
  } else {
    alert('This is not a video file');
    dropArea.classList.remove('active');
    dragText.textContent = 'drag & drop to upload video';
  }
}
// https://www.codingnepalweb.com/drag-drop-file-upload-feature-javascript/
