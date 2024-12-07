// WARNING code is ugly I just wanted to make
// something fast to see if I could do it lol

let pauseAnimation = false;

const colors = {
  r: "#ff0a0a", // red
  b: "#0ae2ff", // blue
  g: "#0aff0a", // green
  y: "#ffff0a", // yellow
  p: "#ff0ac6", // pink
};

let rainColorTouch = 1;
let rainColor = colors.b;

const animationSpeed = [300, 100, 50, 20, 10];
let choosenSpeed = animationSpeed[2];

const rainFonts = ["monospace", "Chicago Plain", "Matrix Code NFI", "Courier New"];
let rainFontNumber = 0;
let showEmojis = true;
let showTextShadow = false;

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fontSize = 17,
  columns = Math.floor(canvas.width / fontSize);

ctx.font = `${fontSize}px ${rainFonts[rainFontNumber]}`;

const drops = Array(columns).fill(1);
const skeets = Array(columns).fill("");
const skeetsIndex = Array(columns).fill(0);

const sanitizeForEmojis = (string) => [...new Intl.Segmenter().segment(string)].map(x => x.segment);

const stripEmojis = (str) => str.replace(/\p{Emoji}/gu, '');

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
};

function animateRain() {
  // Add fade effect to the canvas
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < drops.length; i++) {
    if (i < skeets.length) {
      const characters = showEmojis ? sanitizeForEmojis(skeets[i]) : stripEmojis(skeets[i]);
      const character = characters[skeetsIndex[i]];

      if (character) {
        // Render the current character in white
        writeCharacter("#ffffff", character, i * fontSize, drops[i] * fontSize);

        // Render the previous character in the rain color if applicable
        if (drops[i] >= 2) {
          const oldCharacter = characters[skeetsIndex[i] - 1];
          if (oldCharacter) {
            writeCharacter(rainColor, oldCharacter, i * fontSize, (drops[i] - 1) * fontSize);
          }
        }

        drops[i]++;
        skeetsIndex[i]++;
      }

      if (drops[i] * fontSize > canvas.height) {
        // color the last character on the grid otherwise they stay white
        writeCharacter(rainColor, character, i * fontSize, (drops[i] - 1) * fontSize);

        drops[i] = 1;
      }

      if (skeetsIndex[i] >= characters.length) {
        skeetsIndex[i] = 0;
        skeets[i] = "";
        drops[i] = 1;
      }
    }
  }
}

function loop() {
  if (!pauseAnimation) {
    animateRain();
  }

  setTimeout(() => {
    requestAnimationFrame(loop);
  }, choosenSpeed);
}

function addWord(word) {
  for (let j = 0; j < drops.length; j++) {
    if (skeetsIndex[j] === 0 && skeets[j] === "") {
      skeets[j] = word;
      skeetsIndex[j] = 0;
      drops[j] = 1;

      break;
    }
  }
}

// WebSocket connection for live words
const ws = new WebSocket(
  "wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
);

ws.addEventListener("message", async (event) => {
  if (pauseAnimation) return;

  const message = JSON.parse(event.data);
  if (message?.commit && message?.commit.operation === "create") {
    addWord(message?.commit.record.text);
  }
});

// Adjust canvas size on window resize
window.onresize = () => location.reload();

// Keyboard and touch controls
addEventListener("keydown", (event) => {
  if (event.code === "Space") pauseAnimation = !pauseAnimation;

  if (animationSpeed[event.key - 1]) {
    choosenSpeed = animationSpeed[event.key - 1];
  }

  if (colors[event.key.toLowerCase()]) rainColor = colors[event.key.toLowerCase()];

  if (event.code === "KeyE") showEmojis = !showEmojis;

  if (event.code === "KeyS") showTextShadow = !showTextShadow;

  if (event.code === "KeyF") {
    rainFontNumber = (rainFontNumber + 1) % rainFonts.length;
    ctx.font = `${fontSize}px ${rainFonts[rainFontNumber]}`;
  }
});

addEventListener("touchstart", () => {
  rainColorTouch = (rainColorTouch + 1) % Object.keys(colors).length;
  rainColor = colors[Object.keys(colors)[rainColorTouch]];
});

const helpText = `%cKEYBOARD CONTROLS:
SPACE - pause/play animation
1, 2, 3, 4, 5 - change rain speed (3 default)
G, R, B, Y, P - change rain color (green, red, blue, yellow, pink)
E - toggle show/hide emojis
F - change rain font
S - toggle text shadow (might slow down your browser!)
`;

console.log(helpText, "font-size: small");
console.log("%chttps://github.com/syxanash/bluerain", "font-size: medium");

loop();