const frames = [];
const button = document.getElementById('play-btn');
const select = document.querySelector('select');
const offscreenCanvas = new OffscreenCanvas(100, 100);
const offscreenCtx = offscreenCanvas.getContext('2d', {
  willReadFrequently: true,
});
const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d', {
  willReadFrequently: true,
});

/**
 * main function to process video after upload
 */
const processVideoTrack = async () => {
  if (window.MediaStreamTrackProcessor) {
    console.log('processing video...');
    const video = document.getElementById('video');
    const track = await getVideoTrack(video);
    const processor = new MediaStreamTrackProcessor(track);
    readChunk(processor);
    // button.onclick = (evt) => (stopped = true);
    // button.textContent = 'stop';
  } else {
    alert(
      "Your browser doesn't support this API yet, try other Chromium browsers"
    );
  }
};

/**
 * reads VideoFrame recursively by frame
 */
function readChunk(processor) {
  const reader = processor.readable.getReader();
  let hasWarned = false;
  reader.read().then(async function processFrames({ done, value }) {
    if (value) {
      const bitmap = await createImageBitmap(value);
      const lapVar = getLaplacianVar(bitmap);
      if (lapVar == 0 && !hasWarned) {
        hasWarned = true;
        alert('Video too big or completed, unable to process remaining frames');
      }
      const index = frames.length;

      frames.push(bitmap);
      select.append(new Option(`Frame #${index + 1} lapVar: ${lapVar}`, index));
      value.close();
    }
    if (!done) {
      reader.read().then(processFrames);
    } else {
      reader.releaseLock();
      processor.readable.cancel();
      select.disabled = false;
      console.log(`video processed: ${frames.length} frames`);
    }
  });
}

/**
 * draw selected frame on OffscreenCanvas
 * @param {ImageBitmap} bitmap of VideoFrame
 */
function drawCanvas(bitmap) {
  offscreenCanvas.width = bitmap.width;
  offscreenCanvas.height = bitmap.height;
  offscreenCtx.drawImage(bitmap, 0, 0);
}

/** [TEMP] update canvas from user's frame selection */
select.onchange = (evt) => {
  const frame = frames[select.value];
  canvas.width = frame.width;
  canvas.height = frame.height;
  ctx.drawImage(frame, 0, 0);
};

/**
 * get MediaStream Video Tracks from upload
 * @param {HTMLElement} video created from user's file upload
 * @returns array of MediaStreamTrack
 */
async function getVideoTrack(video) {
  // 'https://va.media.tumblr.com/tumblr_rwuc149ydj1a6n417_720.mp4';
  // need demuxer/converter for .mov etc
  await video.play();
  // TODO create and put in mute button in controls
  const [track] = video.captureStream().getVideoTracks();
  video.onended = () => {
    track.stop();
    video.remove();
  };
  return track;
}

/**
 * to calculate laplacian variance per video frame
 * https://stackoverflow.com/a/72288032
 * @param {ImageBitmap} bitmap of VideoFrame
 * @returns laplacian variance float, higher = clearer
 */
function getLaplacianVar(bitmap) {
  drawCanvas(bitmap);
  try {
    /* opencv starts */
    const pixelValConfig = cv.CV_16S;
    const cvImage = cv.imread(offscreenCanvas);

    const grayImage = new cv.Mat();
    const laplacianMat = new cv.Mat();

    cv.cvtColor(cvImage, grayImage, cv.COLOR_RGBA2GRAY);
    cv.Laplacian(grayImage, laplacianMat, pixelValConfig);

    const mean = new cv.Mat(1, 4, pixelValConfig);
    const standardDeviationMat = new cv.Mat(1, 4, pixelValConfig);

    cv.meanStdDev(laplacianMat, mean, standardDeviationMat);

    const standardDeviation = standardDeviationMat.doubleAt(0, 0);
    return standardDeviation * standardDeviation;
  } catch (e) {
    if (typeof e === 'number') {
      return 0;
    }
  }
}

// https://stackoverflow.com/questions/32699721/javascript-extract-video-frames-reliably
