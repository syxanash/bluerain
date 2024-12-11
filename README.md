# Bluerain

Bluesky firehose visualized in a Matrix-style rain

![bluerain](assets/images/bluerain.gif)

# What is this?

The social network Bluesky is built on a protocol called the AT Protocol. This protocol enables real-time access to all _skeets_ (Bluesky's equivalent of tweets) as they're written by users. This service is called [Firehose](https://docs.bsky.app/docs/advanced-guides/firehose). Firehose messages can be decoded using a simple WebSocket listener on a [Jetstream server](https://docs.bsky.app/blog/jetstream), which handles JSON encoding, bandwidth reduction, and other useful tasks.

tl;dr: What you see on the screen is a live feed of skeets written by Bluesky users, displayed in real time as a Matrix-style rain animation.

# Credits

Originally forked from this [codepen](https://codepen.io/yaclive/pen/EayLYO)<br>
CDE theme: [classic-stylesheets](https://nielssp.github.io/classic-stylesheets/)
