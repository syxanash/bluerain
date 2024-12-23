import Util from './util.js';
import SoundControl from './SoundContro.js';

const ws = new WebSocket(
  "wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
);

const cornerButtons = document.querySelector(".corner-buttons");
const settingsDialog = document.getElementById("settings-dialog");
const settingsButton = document.getElementById("showSettings");
const settingsCloseButton = document.getElementById("settingsCloseButton");
const skeetDialog = document.getElementById("skeet-dialog");
const skeetCloseButton = document.getElementById("skeetCloseButton");
const filterDialog = document.getElementById("filter-dialog");
const filterButton = document.getElementById("showFilter");
const aboutFilterButton = document.getElementById("aboutFilters");
const filterCloseButton = document.getElementById("filterCloseButton");
const toggleFullscreenButton = document.getElementById("toggleFullscreen");
const fullscreenButtonContainer = document.getElementById("fullscreenButtonContainer");
const pauseButton = document.getElementById("pauseButton");
const showEmojisButton = document.getElementById("showEmojisButton");
const toggleTextShadowButton = document.getElementById(
  "toggleTextShadowButton"
);
const wordsWarningWrapper = document.getElementById("wordsWarning");
const filterInput = document.getElementById("filterInput");
const filterSubmit = document.getElementById("filterSubmit");
const firefoxShadowWarning = document.getElementById("firefoxShadowWarning")
const fontDropdown = document.getElementById("fontDropdown");
const colorDropdown = document.getElementById("colorDropdown");
const toggleSoundButton = document.getElementById('toggleSound');

const rainSound = new SoundControl('assets/sounds/rain.mp3', true);
const pauseSound = new SoundControl('assets/sounds/paused.mp3');
const changeSound = new SoundControl('assets/sounds/change.mp3');
const selectionSound = new SoundControl('assets/sounds/selection.mp3');
const pressingSound = new SoundControl('assets/sounds/pressing.mp3');

let soundsEnabled = false;
let cornerButtonsTimeout;
let animationPaused = false;

const wordsToFilter = [];
let wordsWarningTimeout;

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
  "OCRAStd",
  "Matrix Code NFI",
  "Courier New",
  "DatCub-Bold",
  "WhiteRabbit",
  "Space Mono"
];

const fontSizes = [10, 15, 17, 20, 25];
let fontSize = fontSizes[2];

let showEmojis = true;
let showTextShadow = false;

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const columns = Math.floor(canvas.width / fontSize);

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
  ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
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

    if (!animationPaused) animateRain();
  }

  // Request the next frame
  requestAnimationFrame(loop);
}

function addPost(postMessage, postUrl) {
  const emptyColumns = [];

  for (let j = 0; j < skeets.length; j++) {
    if (skeets[j].index === 0 && skeets[j].post === "") {
      emptyColumns.push(j);
    }
  }

  const randomColumn = emptyColumns[Math.floor(Math.random() * emptyColumns.length)];

  skeets[randomColumn] = { post: postMessage, url: postUrl, index: 0, drop: 1 };
}

function toggleSound() {
  if (soundsEnabled) {
    rainSound.stop();
    toggleSoundButton.innerText = "Play Rain Sound";
    toggleSoundButton.classList.remove("active");
  } else {
    if (!animationPaused)
      rainSound.play();

    toggleSoundButton.innerText = "Mute Rain Sound";
    toggleSoundButton.classList.add("active");
  }

  soundsEnabled = !soundsEnabled;
}

function playActionSound(sound) {
  if (soundsEnabled) {
    if (sound.isPlaying()) {
      sound.stop();
      sound.play();
    } else {
      sound.play();
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

function displayFilteredWords() {
  const wordsListFiltered = document.getElementById('wordsListFiltered');
  wordsListFiltered.innerHTML = '';

  if (wordsToFilter.length > 0) {
    filterButton.style.color = '#0ae2ff';
  } else {
    filterButton.style.color = '';
  }

  wordsToFilter.forEach((word, index) => {
    const wordDiv = document.createElement('div');
    wordDiv.style.display = 'flex';
    wordDiv.style.alignItems = 'center';

    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    wordSpan.className = 'filtered-word';

    const removeButton = document.createElement('button');
    removeButton.textContent = '✕';
    removeButton.style.marginRight = '10px';
    removeButton.style.width = '25px';
    removeButton.addEventListener('click', () => {
      wordsToFilter.splice(index, 1);
      wordsListFiltered.className = 'filtered-list';
      wordsWarningWrapper.style.display = "none";
      playActionSound(pressingSound);
      displayFilteredWords();
    });

    wordDiv.appendChild(removeButton);
    wordDiv.appendChild(wordSpan);
    wordsListFiltered.appendChild(wordDiv);
    wordsListFiltered.className = 'filtered-list raised padding';
  });
}

if (showEmojis) showEmojisButton.classList.add("active");
if (Util.isMobile()) fullscreenButtonContainer.style.display = "none";
if (Util.isFirefox()) firefoxShadowWarning.style.display = "inline";

ws.addEventListener("message", async (event) => {
  if (animationPaused) return;

  const message = JSON.parse(event.data);
  if (message?.commit && message?.commit.operation === "create") {
    const postMessage = message?.commit.record.text;

    const did = message?.did;
    const postId = message?.commit.rkey;
    const postUrl = `https://bsky.app/profile/${did}/post/${postId}`;

    if (wordsToFilter.length === 0) {
      addPost(postMessage, postUrl);
    } else {
      const normalizedPost = postMessage.toLowerCase();
      const normalizedWords = wordsToFilter.map((word) => word.toLowerCase());

      const match = normalizedWords.some((word) => normalizedPost.split(" ").includes(word));

      if (match) {
        clearTimeout(wordsWarningTimeout);
        wordsWarningWrapper.style.display = "none";

        addPost(postMessage, postUrl);
      }
    }
  }
});

document.getElementById('filterInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    document.getElementById('filterSubmit').click();
  }
});

window.onresize = () => {
  resizeCanvas();
};

window.addEventListener("keydown", function (e) {
  if ((e.ctrlKey && e.key.toLowerCase() === 'f') ||
    (e.metaKey && e.key.toLowerCase() === 'f')) {
    if (!filterDialog.open) {
      e.preventDefault();
      playActionSound(selectionSound);
      filterDialog.showModal();
    }
  }
});

document.addEventListener("mousemove", () => {
  clearTimeout(cornerButtonsTimeout);

  showButtons();

  cornerButtonsTimeout = setTimeout(hideButtons, 1500);
});

toggleSoundButton.addEventListener('click', toggleSound);

toggleTextShadowButton.addEventListener("click", () => {
  showTextShadow = !showTextShadow;

  toggleTextShadowButton.innerText = showTextShadow ? "Disable Text Shadow" : "Enable Text Shadow";

  if (!animationPaused)
    playActionSound(changeSound);

  toggleActiveButton(toggleTextShadowButton, showTextShadow);
});

showEmojisButton.addEventListener("click", () => {
  showEmojis = !showEmojis;

  showEmojisButton.innerText = showEmojis ? "Hide Emojis" : "Display Emojis";

  toggleActiveButton(showEmojisButton, showEmojis);
});

toggleFullscreenButton.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    settingsDialog.close();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});

document.querySelectorAll("button[id^='speedBtn']").forEach((speedButton) => {
  speedButton.addEventListener("click", (event) => {
    const buttonNumber = event.target.id.match(/\d+$/)?.[0];

    if (animationSpeed[buttonNumber - 1]) {
      choosenSpeed = animationSpeed[buttonNumber - 1];
      animationInterval = 1000 / choosenSpeed;

      playActionSound(pressingSound);
    }

    document.querySelectorAll("button[id^='speedBtn']").forEach((button) => {
      button.classList.remove("active");
    });

    speedButton.classList.add("active");
  });
});


document.querySelectorAll("button[id^='fontSizeBtn']").forEach((fontSizeButton) => {
  fontSizeButton.addEventListener("click", (event) => {
    const buttonNumber = event.target.id.match(/\d+$/)?.[0];

    if (fontSizes[buttonNumber - 1]) {
      fontSize = fontSizes[buttonNumber - 1];
      resizeCanvas();
      playActionSound(pressingSound);
    }

    document.querySelectorAll("button[id^='fontSizeBtn']").forEach((button) => {
      button.classList.remove("active");
    });

    fontSizeButton.classList.add("active");
  });
});

pauseButton.addEventListener("click", () => {
  animationPaused = !animationPaused;

  pauseButton.innerText = animationPaused ? "Resume" : "Pause";

  if (soundsEnabled) {
    if (animationPaused) {
      if (rainSound.isPlaying()) {
        rainSound.stop();

        playActionSound(pauseSound);
      }
    } else {
      rainSound.play();
    }
  }

  toggleActiveButton(pauseButton, animationPaused);
});

fontDropdown.addEventListener("change", () => {
  const selectedFont = fontDropdown.selectedIndex;

  if (!animationPaused)
    playActionSound(changeSound);

  if (rainFonts[selectedFont])
    ctx.font = `${fontSize}px ${rainFonts[selectedFont]}`;
});

colorDropdown.addEventListener("change", () => {
  const selectedColor = colorDropdown.selectedIndex;

  if (!animationPaused)
    playActionSound(changeSound);

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

    playActionSound(selectionSound);

    skeetDialog.showModal();
  }
});

filterSubmit.addEventListener("click", () => {
  const filterValue = filterInput.value;

  if (filterValue && !wordsToFilter.includes(filterValue)) {
    wordsToFilter.push(filterValue);
    filterInput.value = "";

    wordsWarningTimeout = setTimeout(() => {
      wordsWarningWrapper.style.display = "block";
    }, 5000);

    playActionSound(pressingSound);
    displayFilteredWords();

    for (let i = 0; i < skeets.length; i++) {
      skeets[i] = { post: '', url: '', index: 0, drop: 1 };
    }
  }
});

filterButton.addEventListener("click", () => {
  playActionSound(selectionSound);

  filterDialog.showModal();
});

aboutFilterButton.addEventListener("click", () => {
  alert('This filter allows you to display only posts containing specific words on screen as people write them in real time, so you need to be patient!');
});

filterCloseButton.addEventListener("click", () => {
  wordsWarningWrapper.style.display = "none";
  filterDialog.close();
});

settingsButton.addEventListener("click", () => {
  playActionSound(selectionSound);

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
