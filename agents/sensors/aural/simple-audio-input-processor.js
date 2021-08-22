class SimpleAudioInputProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
  }

  simplePassThrough(inputs, outputs) {
    inputs.forEach((inputChannels, i) => {
      inputChannels.forEach((inputChannel, ic) => {
        outputs[i][ic].set(inputChannel,0);
      });
    });
  }

  mergeAll(inputs) {
    const channelCount = inputs.reduce((a, b) => {
        return a + b.length;
    }, 0);
    const frameLength = inputs[0][0].length;
    var merged = new Float32Array(frameLength);
    inputs.forEach((inputChannels, i) => {
      inputChannels.forEach((inputChannel, ic) => {
        merged = merged.map((x, ix) => x + inputChannel[ix] / channelCount)
      });
    });
    return merged;
  }

  process(inputs, outputs, parameters) {
    if (!this.initized) {
      this.initized = true;
      console.log('SimpleAudioInputProcessor - processing started', {
        inputs, outputs, parameters
      });
    }
    this.simplePassThrough(inputs, outputs)
    const merged = this.mergeAll(inputs)
    this.port.postMessage(merged)
    return true
  }
}
registerProcessor('kore.events.aural.in.SimpleAudioInputProcessor', AudioInputEventProcessor)
