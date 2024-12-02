# Bluerain

Bluesky firehose visualized in a Matrix-style rain

![bluerain](assets/images/bluerain.gif)

# What is this?

The social network Bluesky is built on a protocol called the AT Protocol. This protocol enables real-time access to all _skeets_ (Bluesky's equivalent of tweets) as they're written by users. This service is called [Firehose](https://docs.bsky.app/docs/advanced-guides/firehose). Firehose messages can be decoded using a simple WebSocket listener on a [Jetstream server](https://docs.bsky.app/blog/jetstream), which handles JSON encoding, bandwidth reduction, and other useful tasks.

tl;dr: What you see on the screen is a live feed of skeets written by Bluesky users, displayed in real time as a Matrix-style rain animation.

## Controls

<kbd>Space</kbd> Pause the animation (if you want to read some skeet)<br>

<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd> change rain speed animation (default 3)<br>

<kbd>B</kbd> change rain color to blue (default color)<br>
<kbd>G</kbd> change rain color to green<br>
<kbd>R</kbd> change rain color to red<br>
<kbd>Y</kbd> change rain color to yellow<br>
<kbd>P</kbd> change rain color to pink<br>

<kbd>E</kbd> toggle show/hide emojis<br>
<kbd>F</kbd> change rain font<br>
<kbd>S</kbd> toggle text shadow (⚠️ might slow down your browser!)
