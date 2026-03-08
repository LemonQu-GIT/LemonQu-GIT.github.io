let cvReady = false;

// Elements
const imageUpload = document.getElementById("imageUpload");
const workspace = document.getElementById("workspace");
const sourceCanvas = document.getElementById("sourceCanvas");
const resultCanvas = document.getElementById("resultCanvas");
const resultImage = document.getElementById("resultImage");
const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const thresholdSlider = document.getElementById("thresholdSlider");
const thresholdValueLabel = document.getElementById("thresholdValue");
const imageNav = document.getElementById("imageNav");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const imageCounter = document.getElementById("imageCounter");
const loadingOverlay = document.getElementById("loadingOverlay");

let ctxSrc = sourceCanvas.getContext("2d");
let ctxRes = resultCanvas.getContext("2d");

let images = []; // Array to store { file, originalImg, srcMat, ... }
let currentIndex = -1;

// Drag state
let corners = [];
let draggingPoint = -1;
let hoverPoint = -1;
const pointRadius = 15;

function onOpenCvReady() {
  cvReady = true;
  loadingOverlay.style.display = "none";
}

// Upload Images
imageUpload.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  images = [];
  currentIndex = 0;

  workspace.style.display = "flex";
  if (files.length > 1) {
    imageNav.style.display = "flex";
  } else {
    imageNav.style.display = "none";
  }

  let loadedCount = 0;
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        images[index] = { file: file, img: img, processedDataUrl: null };
        loadedCount++;
        if (loadedCount === files.length) {
          loadImageIndex(currentIndex);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
});

function loadImageIndex(index) {
  if (index < 0 || index >= images.length) return;
  currentIndex = index;
  imageCounter.textContent = `${currentIndex + 1} / ${images.length}`;

  const img = images[currentIndex].img;
  let canvasWidth = img.width;
  let canvasHeight = img.height;

  // Optional scale down for canvas rendering to fit viewport logically if needed
  // But working with original resolution ensures better output
  sourceCanvas.width = canvasWidth;
  sourceCanvas.height = canvasHeight;
  ctxSrc.drawImage(img, 0, 0);

  // Initial Corners (10% padding)
  const padX = canvasWidth * 0.1;
  const padY = canvasHeight * 0.1;

  corners = [
    { x: padX, y: padY }, // Top-Left
    { x: canvasWidth - padX, y: padY }, // Top-Right
    { x: canvasWidth - padX, y: canvasHeight - padY }, // Bottom-Right
    { x: padX, y: canvasHeight - padY }, // Bottom-Left
  ];

  drawCanvas();

  downloadBtn.disabled = true;
  ctxRes.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  if (resultImage) {
    resultImage.style.display = "none";
    resultImage.src = "";
  }
}

// Navigation
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) loadImageIndex(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < images.length - 1) loadImageIndex(currentIndex + 1);
});

// Canvas Interactions
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX = evt.clientX;
  let clientY = evt.clientY;

  // Handle touch events
  if (evt.touches && evt.touches.length > 0) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else if (evt.changedTouches && evt.changedTouches.length > 0) {
    clientX = evt.changedTouches[0].clientX;
    clientY = evt.changedTouches[0].clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function handlePointerDown(e) {
  const pos = getMousePos(sourceCanvas, e);
  for (let i = 0; i < 4; i++) {
    const dist = Math.sqrt(
      (pos.x - corners[i].x) ** 2 + (pos.y - corners[i].y) ** 2,
    );
    // Using a generous hit radius relative to scale or fixed for easier touch
    const hitRadius =
      pointRadius *
      2 * // make touch area slightly larger
      (sourceCanvas.width / sourceCanvas.getBoundingClientRect().width);

    if (dist <= hitRadius) {
      draggingPoint = i;
      if (e.cancelable) e.preventDefault(); // prevent scrolling
      break;
    }
  }
}

function handlePointerMove(e) {
  const pos = getMousePos(sourceCanvas, e);

  // Check hover
  hoverPoint = -1;
  const hitRadius =
    pointRadius *
    2 *
    (sourceCanvas.width / sourceCanvas.getBoundingClientRect().width);
  for (let i = 0; i < 4; i++) {
    const dist = Math.sqrt(
      (pos.x - corners[i].x) ** 2 + (pos.y - corners[i].y) ** 2,
    );
    if (dist <= hitRadius) {
      hoverPoint = i;
      sourceCanvas.style.cursor = "move";
      break;
    }
  }
  if (hoverPoint === -1 && draggingPoint === -1) {
    sourceCanvas.style.cursor = "crosshair";
  }

  if (draggingPoint !== -1) {
    corners[draggingPoint].x = Math.max(0, Math.min(sourceCanvas.width, pos.x));
    corners[draggingPoint].y = Math.max(
      0,
      Math.min(sourceCanvas.height, pos.y),
    );
    drawCanvas();
    if (e.cancelable) e.preventDefault(); // prevent scrolling while dragging
  }
}

function handlePointerUp() {
  draggingPoint = -1;
}

sourceCanvas.addEventListener("mousedown", handlePointerDown);
sourceCanvas.addEventListener("mousemove", handlePointerMove);
sourceCanvas.addEventListener("mouseup", handlePointerUp);
sourceCanvas.addEventListener("mouseleave", handlePointerUp);

// Touch events for mobile
sourceCanvas.addEventListener("touchstart", handlePointerDown, {
  passive: false,
});
sourceCanvas.addEventListener("touchmove", handlePointerMove, {
  passive: false,
});
sourceCanvas.addEventListener("touchend", handlePointerUp);
sourceCanvas.addEventListener("touchcancel", handlePointerUp);

function drawCanvas() {
  const img = images[currentIndex].img;
  ctxSrc.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  ctxSrc.drawImage(img, 0, 0);

  // Draw Polygon
  ctxSrc.beginPath();
  ctxSrc.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 4; i++) ctxSrc.lineTo(corners[i].x, corners[i].y);
  ctxSrc.closePath();
  ctxSrc.lineWidth =
    4 * (sourceCanvas.width / sourceCanvas.getBoundingClientRect().width);
  ctxSrc.strokeStyle = "rgba(0, 255, 0, 0.7)";
  ctxSrc.stroke();
  ctxSrc.fillStyle = "rgba(0, 255, 0, 0.2)";
  ctxSrc.fill();

  // Draw Points
  const r =
    pointRadius *
    (sourceCanvas.width / sourceCanvas.getBoundingClientRect().width);
  for (let i = 0; i < 4; i++) {
    ctxSrc.beginPath();
    ctxSrc.arc(corners[i].x, corners[i].y, r, 0, 2 * Math.PI);
    ctxSrc.fillStyle =
      i === hoverPoint || i === draggingPoint
        ? "rgba(255, 0, 0, 1)"
        : "rgba(0, 0, 255, 1)";
    ctxSrc.fill();
    ctxSrc.lineWidth = r / 5;
    ctxSrc.strokeStyle = "white";
    ctxSrc.stroke();
  }
}

// Processing
thresholdSlider.addEventListener("input", (e) => {
  thresholdValueLabel.textContent = e.target.value;
});

processBtn.addEventListener("click", () => {
  if (!cvReady || !images[currentIndex]) return;

  const img = images[currentIndex].img;
  let srcMat = cv.imread(img);

  // Calculate dimensions of the output image based on corner distances
  const tl = corners[0],
    tr = corners[1],
    br = corners[2],
    bl = corners[3];

  const widthA = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
  const widthB = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
  const maxWidth = Math.max(parseInt(widthA), parseInt(widthB));

  const heightA = Math.sqrt((tr.x - br.x) ** 2 + (tr.y - br.y) ** 2);
  const heightB = Math.sqrt((tl.x - bl.x) ** 2 + (tl.y - bl.y) ** 2);
  const maxHeight = Math.max(parseInt(heightA), parseInt(heightB));

  let dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    maxWidth - 1,
    0,
    maxWidth - 1,
    maxHeight - 1,
    0,
    maxHeight - 1,
  ]);

  let srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x,
    tl.y,
    tr.x,
    tr.y,
    br.x,
    br.y,
    bl.x,
    bl.y,
  ]);

  let M = cv.getPerspectiveTransform(srcPoints, dstPoints);
  let warpedMat = new cv.Mat();
  cv.warpPerspective(srcMat, warpedMat, M, new cv.Size(maxWidth, maxHeight));

  // Convert to grayscale
  let grayMat = new cv.Mat();
  cv.cvtColor(warpedMat, grayMat, cv.COLOR_RGBA2GRAY);

  // High contrast & black point
  let enhancedMat = new cv.Mat();
  let thresholdVal = parseInt(thresholdSlider.value);
  let alpha = 5.0; // High contrast multiplier (adjust for more/less contrast)
  let beta = -(thresholdVal * alpha); // Push black point based on threshold

  // Apply the transformation
  cv.convertScaleAbs(grayMat, enhancedMat, alpha, beta);

  // Invert
  let invertedMat = new cv.Mat();
  cv.bitwise_not(enhancedMat, invertedMat);

  // Show result
  resultCanvas.width = maxWidth;
  resultCanvas.height = maxHeight;
  cv.imshow("resultCanvas", invertedMat);

  // Save state for download (using JPEG to support EXIF injected data)
  let dataUrl = resultCanvas.toDataURL("image/jpeg", 0.95);

  // Inject fake EXIF data
  if (typeof piexif !== "undefined") {
    try {
      let zeroth = {};
      let exif = {};

      zeroth[piexif.ImageIFD.Make] = "Apple";
      zeroth[piexif.ImageIFD.Model] = "iPhone 16 Pro";

      exif[piexif.ExifIFD.LensModel] = "Scanner Camera -- 0.1mm f22";
      exif[piexif.ExifIFD.ISOSpeedRatings] = 1; // ISO 1
      exif[piexif.ExifIFD.FocalLength] = [1, 10]; // 0.1mm
      exif[piexif.ExifIFD.ExposureBiasValue] = [0, 1]; // 0 ev
      exif[piexif.ExifIFD.FNumber] = [22, 1]; // f/22 logic (22/1)
      exif[piexif.ExifIFD.ExposureTime] = [30, 1]; // 30s

      let exifObj = { "0th": zeroth, Exif: exif, GPS: {} };
      let exifStr = piexif.dump(exifObj);
      dataUrl = piexif.insert(exifStr, dataUrl);
    } catch (err) {
      console.error("Failed to inject EXIF data:", err);
    }
  }

  images[currentIndex].processedDataUrl = dataUrl;

  // Show image via <img> tag so iOS/Android users can long-press to save
  resultImage.src = dataUrl;
  resultImage.style.display = "block";

  downloadBtn.disabled = false;

  let allProcessed = images.every((im) => im.processedDataUrl !== null);
  if (allProcessed) downloadAllBtn.disabled = false;

  // Cleanup
  srcMat.delete();
  srcPoints.delete();
  dstPoints.delete();
  M.delete();
  warpedMat.delete();
  grayMat.delete();
  enhancedMat.delete();
  invertedMat.delete();
});

// Downloads
downloadBtn.addEventListener("click", () => {
  if (!images[currentIndex].processedDataUrl) return;
  // Make sure it downloads as a .jpg to preserve EXIF
  let filename = `processed-${images[currentIndex].file.name}`.replace(
    /\.[^/.]+$/,
    ".jpg",
  );
  downloadImg(images[currentIndex].processedDataUrl, filename);
});

downloadAllBtn.addEventListener("click", () => {
  images.forEach((imgData) => {
    if (imgData.processedDataUrl) {
      let filename = `processed-${imgData.file.name}`.replace(
        /\.[^/.]+$/,
        ".jpg",
      );
      downloadImg(imgData.processedDataUrl, filename);
    }
  });
});

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function downloadImg(dataUrl, filename) {
  try {
    const blob = dataURItoBlob(dataUrl);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    // Fallback method
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
