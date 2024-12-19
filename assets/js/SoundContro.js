export default class SoundControl {
  constructor(audioAsset, loop = false) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioBuffer = null;
    this.sourceNode = null;
    this.looped = loop;

    fetch(audioAsset)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(buffer => {
        this.audioBuffer = buffer;
      })
      .catch(error => console.error('Error loading audio file:', error));
  }

  play() {
    if (this.sourceNode) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this.looped;
    this.sourceNode.connect(this.audioContext.destination);
    this.sourceNode.start();
  }

  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  isPlaying() {
    return this.sourceNode !== null;
  }
}
