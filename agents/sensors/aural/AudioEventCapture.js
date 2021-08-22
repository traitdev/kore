export class AudioEventCapture {
  constructor() {
    this.chain = [];
    this.renderers = [];
    this.chainLength = 512; //512;
    this.fftBandSize = 2048;
    this.fftBandLimit = 512;
    this.colors = new Kieryn.Drawing.Colors();

    const modPath = './simple-audio-input-processor.js'

    //context.audioWorklet.addModule(modPath).then((result) => {
      //console.log('mule');
    //  const eventNode = new AudioWorkletNode(context, 'audio-input-event-processor')
    //  eventNode.connect(context.destination);
    // capture.events = eventNode;
    //});

    const mediaRequest = { audio: true, video: false };
    navigator.mediaDevices.getUserMedia(mediaRequest).then(
      (stream) => this.onMediaGranted(this, stream)
    ).then((capture) => {
      //console.log('fooo??');
      const { context } = capture;

      //console.log(capture);
      context.audioWorklet.addModule(modPath).then(() => {
        //console.log('moose??');
        context.events = new AudioWorkletNode(context, 'audio-input-event-processor');
        //console.log(context.events);
        context.events.port.onmessage = (message) => {
          //console.log('this');
          capture.onEvent(capture, message)
        };
        //.connect(context.source);
        capture.source.connect(context.events);
        context.events.connect(context.destination);
      });
      //
    });
  }

  onEvent(capture, messageEvent) {
    const { context, analyser, chain, chainLength, fftBandSize, fftBandLimit, renderers } = capture;


    if (!analyser) {
      return;
    }

    //console.log(messageEvent);

    var fftData = new Uint8Array(fftBandLimit);
    analyser.getByteFrequencyData(fftData);
    //fftData = Object.values(fftData).slice(0, fftBandSize);
    const rawData = messageEvent.data;

    const energyTotal = rawData.map((x, i) =>
      (i == 0) ? 0 : Math.abs(x - rawData[i-1])).reduce((a,v) => a+v, 0);
    const energyPerSample = energyTotal / rawData.length;


    const event = {
      context: context,
      rawData: rawData,
      energy: energyPerSample,
      fftData: fftData,
      fftBand: Object.values(fftData).map(x => x * 1.0),
      age: 0,
    };

    const latest = chain[chain.length-1];

    if (latest) {
      event.deltaBand = event.fftBand.map(x => (x) * Math.sqrt(energyTotal));
      const damper = 0.01;
      // event.deltaBand = event.fftBand.map((x, i) =>
      //  1 * (
      //    0.98 * latest.deltaBand[i] +
      //    0.01 * Math.abs(x - latest.fftBand[i]) * latest.fftBand[i]
      //  )
      // );
    } else {
      event.deltaBand = event.fftBand.map(x => 0);
    }

    for (var i = 0; i < chain.length; i++) {
      // chain[i].fftBand = chain[i].fftBand.map((x, i) => x + damper * (event.fftBand[i] - x));
      //chain[i].deltaBand = chain[i].deltaBand.map((x, i) => x + damper * (event.deltaBand[i] - x));
      chain[i].age = chain[i].age + 1;
    }

    capture.chain.push(event);

    if (capture.chain.length > chainLength) {
      capture.chain.shift();
    } else {
      const vCanvas = document.createElement('canvas');
      vCanvas.width = 1;// Math.floor(width) -  1;
      vCanvas.height = fftBandSize;
      const vCtx  = vCanvas.getContext('2d');

      renderers.push({
        vCanvas: vCanvas,
        vCtx: vCtx,
      });
    }
  }

  update() {

  }

  render2(target, ctx, progress) {
    //return;
    const { chain, chainLength, analyser, fftBand } = this;
    if (!analyser) {
      return;
    }

    const latest = chain[chain.length-1];

    if (latest) {
      const color = this.colors.heat(latest.energy * 0.05, 50);
      this.renderSeg(target, ctx, [latest.fftBand], 0, 0, 0.005, color, 8);
      this.renderSeg(target, ctx, [latest.deltaBand], 0, 0, 0.01, "rgb(0, 200, 0)", 1);
      //this.renderSeg(target, ctx, [fftBand], 0, 0, 0.005, "rgb(50, 0, 0)");
      //this.renderSeg(target, ctx, [latest.frequencyData], 0, 0, 0.005, "rgb(0, 50, 0)");
    }

    //ctx.fillText(`Chain=${chain.length}`, 15, 120);
    if (latest) {
      ctx.fillText(`energy=${latest.energy}`, 35, 120);
    }

    const segs = chain; //.slice(0,10);
    for (var i = 0; i < segs.length; i++) {
      const iSeg = (chainHead + i) % segs.length;
      let color = this.colors.heat(0.03 * Math.pow(segs[iSeg].energy, 0.2), 250);
      if (i > segs.length-2) {
        color = "rgb(200, 200, 0)";
      }
      if (segs[iSeg].energy > 0.0) {
        this.renderSeg(target, ctx, segs.map(s => [0, -s.energy*10, 0, s.energy*0.03]), iSeg, i, 0.5, color, 16);
      }
      //segs[iSeg] = fftData;
      //this.renderSeg(target, ctx, segs, iSeg, i);
    }
  }

  render(target, ctx, progress) {
    const { chain, chainLength, analyser, renderers } = this;

    if (!analyser) {
      return;
    }

    if (chain.length < 1) {
      return;
    }

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 10);
    ctx.stroke();

    //const segs = chain; //.sort((s1, s2) => s1.age - s2.age); //.slice(0, 50);

    var sliceWidth = Math.floor((target.width * 1.0 / chain.length)) + 1;

    const latest = chain[chain.length-1];

    const nextRenderer = renderers.shift();
    this.renderSeg1(nextRenderer, latest, sliceWidth);
    renderers.push(nextRenderer);

    for (var i = 10; i < chain.length; i++) {
      const seg = chain[i];
      const baseY = target.height;
      const peakY = target.height / 2;
      //const segLength = values.length;
      //var sliceHeight = (peakY - baseY) / segLength;
      var x = (i-50) * sliceWidth;
      ctx.drawImage(renderers[i].vCanvas, Math.floor(x), 0);
    }



  }

  renderSeg1(renderer, seg, width) {
    renderer.vCanvas.width = Math.floor(width) + 1;
    const ctx = renderer.vCtx;

    seg.deltaBand.forEach((v, y) => {
      ctx.beginPath();
      ctx.strokeStyle = this.colors.heat(v * 0.0001, 250);
      ctx.moveTo(0, y);
      ctx.lineTo(width+1, y);
      ctx.stroke();
    });
  }

  renderSeg(target, ctx, segs, iSegIndex, iSeg, vScale = 1.0, color = "rgb(50, 50, 50)", res=1) {
    const { context, analyser } = this;
    let seg = segs[iSegIndex];
    if (!seg) return;
    if (!analyser) return;

    if ( res > 1 && seg.length > res * 4) {
      seg = [...Array(seg.length / res - 1).keys()].map(i => seg[i*res]);
    }

    let dataArray = seg;

    const bufferLength = dataArray.length;

    //dataArray.map(n => Math.abs(n)).reduce
    ctx.strokeStyle = color;

    var sliceWidth = (target.width * 1.0 / (segs.length * bufferLength));
    var x = Math.floor(sliceWidth * bufferLength * iSeg);

    const step = 1;
    ctx.beginPath();
    ctx.lineWidth = 2;
    for (var i = 0; i < bufferLength; i += step) {
      var v = dataArray[i] * vScale;
      var y = v * target.height / 2;

      if (i === 0) {
        ctx.moveTo(x, target.height / 2);
      } else {
        ctx.lineTo(x, target.height / 2 + y);
      }

      x += sliceWidth * step;
    }
    ctx.stroke();
    //ctx.lineTo(target.width, target.height / 2);
  }

  setUpWorklet() {

  }

  onMediaGranted(capture, stream) {
    const context = new AudioContext({
      sampleRate: 48000,
    });
    capture.context = context;
    capture.stream = stream;
    capture.source = context.createMediaStreamSource(stream);
    //capture.source.connect(context.destination);
    capture.analyser = context.createAnalyser();
    capture.analyser.fftSize = capture.fftBandSize;
    capture.analyser.smoothingTimeConstant = 0.1;
    //console.log(context.events);
    //capture.source.connect(context.events, 0);
    capture.source.connect(capture.analyser, 0);
    console.log('onMediaGranted -> capture',capture);
    return capture;
  }
};
