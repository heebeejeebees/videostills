const frames = [];
const button = document.querySelector('button');
const select = document.querySelector('select');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

button.onclick = async (evt) => {
  // TODO create and move into vid processor on load
  if (window.MediaStreamTrackProcessor) {
    let stopped = false;
    const track = await getVideoTrack();
    const processor = new MediaStreamTrackProcessor(track);
    const reader = processor.readable.getReader();
    readChunk();

    function readChunk() {
      reader.read().then(async ({ done, value }) => {
        if (value) {
          const bitmap = await createImageBitmap(value);
          const index = frames.length;
          frames.push(bitmap);
          select.append(new Option(`Frame #${index + 1}`, index));
          value.close();
        }
        if (!done && !stopped) {
          readChunk();
        } else {
          select.disabled = false;
        }
      });
    }
    button.onclick = (evt) => (stopped = true);
    button.textContent = 'stop';
  } else {
    console.error("your browser doesn't support this API yet");
    // only chromium browsers
  }
};

select.onchange = (evt) => {
  const frame = frames[select.value];
  canvas.width = frame.width;
  canvas.height = frame.height;
  ctx.drawImage(frame, 0, 0);

  // TODO create and move into vid processor on load
  // get laplacian variation per context
  const cvImage = cv.imread(canvas);
  const grayImage = new cv.Mat();
  const laplacianMat = new cv.Mat();

  cv.cvtColor(cvImage, grayImage, cv.COLOR_RGBA2GRAY, 0);
  cv.Laplacian(grayImage, laplacianMat, cv.CV_64F);

  const mean = new cv.Mat(1, 4, cv.CV_64F);
  const standardDeviationMat = new cv.Mat(1, 4, cv.CV_64F);

  cv.meanStdDev(laplacianMat, mean, standardDeviationMat);

  const standardDeviation = standardDeviationMat.doubleAt(0, 0);
  const laplacianVar = standardDeviation * standardDeviation;

  console.log(`lap: ${laplacianVar}`);
};

async function getVideoTrack() {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = 'https://va.media.tumblr.com/tumblr_rwuc149ydj1a6n417_720.mp4';
  // only .webm and .mp4, not .mov
  document.body.append(video);
  // TODO create and put in mute button in controls
  video.muted = true;
  await video.play();
  const [track] = video.captureStream().getVideoTracks();
  video.onended = (evt) => track.stop();
  return track;
}

// https://stackoverflow.com/questions/32699721/javascript-extract-video-frames-reliably
