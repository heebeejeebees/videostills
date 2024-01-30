const frames = [];
const button = document.getElementById('play-btn');
const select = document.querySelector('select');
const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const processVideoTrack = () => {
  if (window.MediaStreamTrackProcessor) {
    console.log('processing video...');
    const video = document.getElementById('video');
    const track = getVideoTrack(video);
    const processor = new MediaStreamTrackProcessor(track);
    const reader = processor.readable.getReader();

    (function readChunk() {
      reader.read().then(async ({ done, value }) => {
        console.log(`done: ${done}, value: ${value}`);
        if (value) {
          const bitmap = await createImageBitmap(value);
          const index = frames.length;
          console.log(`bitmap: ${bitmap}, index: ${index}`);
          const laps = getLaplacianVar(bitmap);

          frames.push(bitmap);
          select.append(new Option(`Frame #${index + 1} laps: ${laps}`, index));
          value.close();
        }
        if (!done) {
          // reader.read().then(processFrames);
          readChunk();
        } else {
          select.disabled = false;
          // video.remove();
          console.log('processing completed');
        }
      });
    })();
    // button.onclick = (evt) => (stopped = true);
    // button.textContent = 'stop';
  } else {
    console.error("your browser doesn't support this API yet");
    // only chromium browsers
  }
};

function drawCanvas(frame) {
  canvas.width = frame.width;
  canvas.height = frame.height;
  ctx.drawImage(frame, 0, 0);
}

select.onchange = (evt) => {
  const frame = frames[select.value];
  drawCanvas(frame);
};

function getVideoTrack(video) {
  // 'https://va.media.tumblr.com/tumblr_rwuc149ydj1a6n417_720.mp4';
  // not .mov
  // TODO create and put in mute button in controls
  const [track] = video.captureStream().getVideoTracks();
  video.onended = () => {
    track.stop();
    video.remove();
  };
  return track;
}

function getLaplacianVar(bitmap) {
  drawCanvas(bitmap);
  // https://stackoverflow.com/a/72288032
  try {
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const cvImage = cv.matFromImageData(imgData);

    const grayImage = new cv.Mat();
    const laplacianMat = new cv.Mat();

    cv.cvtColor(cvImage, grayImage, cv.COLOR_RGBA2GRAY, 0);
    cv.Laplacian(grayImage, laplacianMat, cv.CV_64F);

    const mean = new cv.Mat(1, 4, cv.CV_64F);
    const standardDeviationMat = new cv.Mat(1, 4, cv.CV_64F);

    cv.meanStdDev(laplacianMat, mean, standardDeviationMat);

    const standardDeviation = standardDeviationMat.doubleAt(0, 0);
    return standardDeviation * standardDeviation;
  } catch (e) {
    console.log(`[ERROR]: ${e}, TYPE: ${typeof e}`);
    // FIXME only 197/305 frames due to memory leakage
  }
}

// https://stackoverflow.com/questions/32699721/javascript-extract-video-frames-reliably
