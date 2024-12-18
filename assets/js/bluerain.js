import Util from './util.js';

const ws = new WebSocket(
  "wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
);

const cornerButtons = document.querySelector(".corner-buttons");
const settingsDialog = document.getElementById("settings-dialog");
const skeetDialog = document.getElementById("skeet-dialog");
const showButton = document.getElementById("showSettings");
const settingsCloseButton = document.getElementById("settingsCloseButton");
const skeetCloseButton = document.getElementById("skeetCloseButton");
const toggleFullscreenButton = document.getElementById("toggleFullscreen");
const fullscreenButtonContainer = document.getElementById("fullscreenButtonContainer");
const pauseButton = document.getElementById("pauseButton");
const showEmojisButton = document.getElementById("showEmojisButton");
const toggleTextShadowButton = document.getElementById(
  "toggleTextShadowButton"
);
const firefoxShadowWarning = document.getElementById("firefoxShadowWarning")
const fontDropdown = document.getElementById("fontDropdown");
const colorDropdown = document.getElementById("colorDropdown");

let cornerButtonsTimeout;
let pauseAnimation = false;

const colors = [
  "#0ae2ff", // blue
  "#0aff0a", // green
  "#ff0a0a", // red
  "#ff700a", // orange
  "#ff0ac6", // pink
  "#ffff0a", // yellow
  "#ffffff", // white
];

let rainColor = colors[0];

const animationSpeed = [5, 10, 20, 30, 60];
let choosenSpeed = animationSpeed[2];
let animationInterval = 1000 / choosenSpeed;

let startTime = performance.now();
let previousTime = startTime;

let currentTime = 0;
let deltaTime = 0;

const rainFonts = [
  "monospace",
  "Chicago",
  "Matrix Code NFI",
  "Courier New",
  "DatCub-Bold",
  "WhiteRabbit",
  "Space Mono"
];

let showEmojis = true;
let showTextShadow = false;

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fontSize = 17,
  columns = Math.floor(canvas.width / fontSize);

ctx.font = `${fontSize}px ${rainFonts[0]}`;

const skeets = Array(columns).fill({ post: '', url: '', index: 0, drop: 1 });

const sanitizeForEmojis = (string) =>
  [...new Intl.Segmenter().segment(string)].map((x) => x.segment);

const stripEmojis = (str) => str.replace(/\p{Emoji}/gu, "");

const writeCharacter = (color, character, x, y) => {
  if (showTextShadow) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillText(character, x, y);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = color;
    ctx.fillText(character, x, y);
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const newColumns = Math.floor(canvas.width / fontSize);

  const oldSkeets = [...skeets];

  skeets.length = newColumns;

  for (let i = 0; i < newColumns; i++) {
    if (oldSkeets[i] === undefined) {
      skeets[i] = {
        post: '',
        url: '',
        index: 0,
        drop: 1
      }
    } else {
      skeets[i] = {
        post: oldSkeets[i].post,
        url: oldSkeets[i].url,
        index: oldSkeets[i].index,
        drop: oldSkeets[i].drop
      }
    }
  }

  ctx.font = `${fontSize}px ${rainFonts[fontDropdown.selectedIndex]}`;
}

function animateRain() {
  // Add fade effect to the canvas
  ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < skeets.length; i++) {
    const characters = showEmojis
      ? sanitizeForEmojis(skeets[i].post)
      : stripEmojis(skeets[i].post);
    const character = characters[skeets[i].index];

    if (character) {
      // Render the current character in white
      writeCharacter("#ffffff", character, i * fontSize, skeets[i].drop * fontSize);

      // Render the previous character in the rain color if applicable
      if (skeets[i].drop >= 2) {
        const oldCharacter = characters[skeets[i].index - 1];
        if (oldCharacter) {
          writeCharacter(
            rainColor,
            oldCharacter,
            i * fontSize,
            (skeets[i].drop - 1) * fontSize
          );
        }
      }

      skeets[i].drop++;
      skeets[i].index++;
    }

    if (skeets[i].drop * fontSize > canvas.height) {
      // color the last character on the grid otherwise they stay white
      writeCharacter(
        rainColor,
        character,
        i * fontSize,
        (skeets[i].drop - 1) * fontSize
      );

      skeets[i].drop = 1;
    }

    if (skeets[i].index >= characters.length) {
      skeets[i] = { post: '', url: '', index: 0, drop: 1 };
    }
  }
}

function loop(timestamp) {
  currentTime = timestamp;
  deltaTime = currentTime - previousTime;

  if (deltaTime >= animationInterval) {
    previousTime = currentTime - (deltaTime % animationInterval);

    if (!pauseAnimation) animateRain();
  }

  // Request the next frame
  requestAnimationFrame(loop);
}

function addPost(postMessage, postUrl) {
  for (let j = 0; j < skeets.length; j++) {
    if (skeets[j].index === 0 && skeets[j].post === "") {
      skeets[j] = { post: postMessage, url: postUrl, index: 0, drop: 1 };

      break;
    }
  }
}

function toggleActiveButton(button, state) {
  if (state) {
    button.classList.add("active");
  } else {
    button.classList.remove("active");
  }
}

function hideButtons() {
  cornerButtons.classList.remove("fade-in");
  cornerButtons.classList.add("fade-out");
}

function showButtons() {
  cornerButtons.classList.remove("fade-out");
  cornerButtons.classList.add("fade-in");
}

ws.addEventListener("message", async (event) => {
  if (pauseAnimation) return;

  const message = JSON.parse(event.data);
  if (message?.commit && message?.commit.operation === "create") {
    const postMessage = message?.commit.record.text;

    const did = message?.did;
    const postId = message?.commit.rkey;
    const postUrl = `https://bsky.app/profile/${did}/post/${postId}`;

    addPost(postMessage, postUrl);
  }
});

window.onresize = () => {
  resizeCanvas();
};

document.addEventListener("mousemove", () => {
  clearTimeout(cornerButtonsTimeout);

  showButtons();

  cornerButtonsTimeout = setTimeout(hideButtons, 1500);
});

if (showEmojis) showEmojisButton.classList.add("active");
if (Util.isMobile()) fullscreenButtonContainer.style.display = "none";
if (Util.isFirefox()) firefoxShadowWarning.style.display = "inline";

toggleTextShadowButton.addEventListener("click", () => {
  showTextShadow = !showTextShadow;
  toggleActiveButton(toggleTextShadowButton, showTextShadow);
});

showEmojisButton.addEventListener("click", () => {
  showEmojis = !showEmojis;
  toggleActiveButton(showEmojisButton, showEmojis);
});

toggleFullscreenButton.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    settingsDialog.close();

    toggleActiveButton(toggleFullscreenButton, true);
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    toggleActiveButton(toggleFullscreenButton, false);
  }
});

document.querySelectorAll("button[id^='speedBtn']").forEach((speedButton) => {
  speedButton.addEventListener("click", (event) => {
    const buttonNumber = event.target.id.match(/\d+$/)?.[0];

    if (animationSpeed[buttonNumber - 1]) {
      choosenSpeed = animationSpeed[buttonNumber - 1];
      animationInterval = 1000 / choosenSpeed;
    }

    document.querySelectorAll("button[id^='speedBtn']").forEach((button) => {
      button.classList.remove("active");
    });

    speedButton.classList.add("active");
  });
});

pauseButton.addEventListener("click", () => {
  pauseAnimation = !pauseAnimation;
  toggleActiveButton(pauseButton, pauseAnimation);
});

fontDropdown.addEventListener("change", () => {
  const selectedFont = fontDropdown.selectedIndex;

  if (rainFonts[selectedFont])
    ctx.font = `${fontSize}px ${rainFonts[selectedFont]}`;
});

colorDropdown.addEventListener("change", () => {
  const selectedColor = colorDropdown.selectedIndex;

  if (colors[selectedColor]) rainColor = colors[selectedColor];
});

canvas.addEventListener("mousedown", function (e) {
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  const gridColumns = Math.floor(canvas.width / fontSize)

  const skeetMessageSpan = document.getElementById("skeetMessage");
  const skeetUrlSpan = document.getElementById("skeetUrl");

  const selectedColumn = Math.floor(x / Math.floor(canvas.width / gridColumns));

  if (skeets[selectedColumn].post) {
    skeetMessageSpan.innerText = skeets[selectedColumn].post;
    skeetUrlSpan.innerHTML = `<a href="${skeets[selectedColumn].url}" target="_blank">${skeets[selectedColumn].url}</a>`;

    skeetDialog.showModal();
  }
});

showButton.addEventListener("click", () => {
  settingsDialog.showModal();
});

settingsCloseButton.addEventListener("click", () => {
  settingsDialog.close();
});

skeetCloseButton.addEventListener("click", () => {
  skeetDialog.close();
});

console.log("%chttps://github.com/syxanash/bluerain", "font-size: medium");

requestAnimationFrame(loop);
