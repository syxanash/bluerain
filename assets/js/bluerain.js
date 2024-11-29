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

const animationSpeed = [200, 100, 50, 20, 10]; //fps

const keyToSpeed = {
  1: animationSpeed[0],
  2: animationSpeed[1],
  3: animationSpeed[2],
  4: animationSpeed[3],
  5: animationSpeed[4],
};

const rainFonts = ["monospace", "Chicago Plain", "Matrix Code NFI", "Courier New"];
let rainFontNumber = 0;

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fontSize = 17,
  columns = canvas.width / fontSize;

ctx.font = `${fontSize}px ${rainFonts[rainFontNumber]}`;

const drops = [];
const skeets = [];
const skeetsIndex = [];

for (let i = 0; i < columns; i++) {
  drops[i] = 1;
  skeets[i] = "";
  skeetsIndex[i] = 0;
}

function loop() {
  if (pauseAnimation) return;

  ctx.fillStyle = "rgba(0, 0, 0, .05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < drops.length; i++) {
    if (i < skeets.length) {
      const characters = Array.from(skeets[i]); // used to fix emoji encoding
      const text = characters[skeetsIndex[i]];
      let oldText = '';

      if (drops[i] >= 2) {
        oldText = characters[skeetsIndex[i] - 1];
      }

      if (text) {
        // font color is white only for the last newest rendered character
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] >= 2) {
          // color the previously rendered characters
          ctx.fillStyle = "#000000";
          ctx.fillText(oldText, i * fontSize, (drops[i] - 1) * fontSize);
          ctx.fillStyle = rainColor;
          ctx.fillText(oldText, i * fontSize, (drops[i] - 1) * fontSize);
        }

        drops[i]++;
        skeetsIndex[i]++;
      }

      if (drops[i] * fontSize > canvas.height) {
        // color the last character on the grid otherwise they stay white

        ctx.fillStyle = "#000000";
        ctx.fillText(text, i * fontSize, (drops[i] - 1) * fontSize);
        ctx.fillStyle = rainColor;
        ctx.fillText(text, i * fontSize, (drops[i] - 1) * fontSize);

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

let intervalId = setInterval(loop, animationSpeed[2]);

window.onresize = () => location.reload();

addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    pauseAnimation = !pauseAnimation;
  }

  if (keyToSpeed[event.key]) {
    clearInterval(intervalId);
    intervalId = setInterval(loop, keyToSpeed[event.key]);
  }

  if (colors[event.key.toLocaleLowerCase()]) {
    rainColor = colors[event.key.toLocaleLowerCase()];
  }

  if (event.code === "KeyF") {
    rainFontNumber = (rainFontNumber + 1) % rainFonts.length;
    ctx.font = `${fontSize}px ${rainFonts[rainFontNumber]}`;
  }
});

addEventListener("touchstart", () => {
  rainColorTouch = (rainColorTouch + 1) % Object.keys(colors).length;

  rainColor = colors[Object.keys(colors)[rainColorTouch]];
});
