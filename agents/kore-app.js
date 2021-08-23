import DefaultLayout from "./layouts/default-layout.js";

export default class KoreApp {
  constructor (settings) {
    this.settings = settings;
    this.canvasFill = settings.theme.darkMode ? settings.theme.colors.dark : settings.theme.colors.light;
    this.refillBackground = true;
    document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    if (!settings) {
      this.settings = {};
    }

    this.layout = settings.layout || new DefaultLayout(this, settings);

    if (!settings.cachedAssetPath) {
      this.settings.cachedAssetPath = 'assets';
    }

    this.props = {
      canvas: false,
      container: false,
    };
    this.state = {
      lastUpdate: 0,
      layers: [],
      //meter: new Kieryn.Components.PerformanceMeter(10),
      showMeter: false,
    };
  }

  addLayer(layer) {
    this.state.layers.push(layer);
  }

  cachedAssetUrl(path) {
    return `${this.settings.cachedAssetPath}/${path}`
  }

  assetUrl(path) {
    return `${this.settings.version}/${path}`
  }

  loadImage(url) {
    var img = new Image();
    img.src = url;
    return img;
  };

  run(settings = {}, callback) {
    const cssFile = `/${settings.version}/assets/main.css`;
    var fileref=document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", cssFile);
    document.getElementsByTagName("head")[0].appendChild(fileref);
    this.settings = Object.assign(this.settings, settings);
    
    if (!this.init) {
      this.init = () => { };
    }
    setTimeout(() => {
      this.init();
      this.start(this.settings.layers);
      if (window.gaEventSetup) {
        window.gaEventSetup();
        window.gtag('event', 'page_view', {
          'event_category' : 'internal',
          'event_label': window.location.href,
        });
      };
      console.log(this, 'Application started.');
    }, 200);
  }

  tk(event, tag) {
    if (window.gtag) {
      window.gtag('event', event, {
        'event_category' : 'internal',
        'event_label': tag,
      });
    }
  }
  
  start(initialLayers = []) {
    this.updateCanvasDimensions();
    const { container, canvas } = this.props;
    this.state.layers.push(...initialLayers);
    this.renderFlag = true;
    window.requestAnimationFrame(this.loop.bind(this));
    setInterval(() => {
      this.update(0);
    }, 30);
    canvas.addEventListener('touchstart', (e) => this.handleEvent(e), { passive: true });
    canvas.addEventListener("touchend", (e) => this.handleEvent(e));
    canvas.addEventListener("touchmove", (e) => this.handleEvent(e), { passive: true });
    window.addEventListener('resize', (e) => this.handleEvent(e));
    window.addEventListener('orientationchange', (e) => {
      document.body.style.visibility = 'hidden';
      document.body.style.opacity = 0;
      window.location.reload();
    });
    canvas.addEventListener("click", (e) => this.handleEvent(e));
    canvas.addEventListener('mousemove', (e) => this.handleEvent(e));
    canvas.addEventListener('mouseup', (e) => this.handleEvent(e));
    canvas.addEventListener('mousedown', (e) => this.handleEvent(e));
    canvas.addEventListener('contextmenu', (e) => this.handleEvent(e));
    canvas.addEventListener('wheel', (e) => this.handleEvent(e), { passive: true });
    document.addEventListener('keydown', (e) => this.handleEvent(e));
  }

  handleEvent(e) {
    //console.log(e);
    this.renderFlag = true;
    const { canvas } = this.props;
    const rect = canvas.getBoundingClientRect();
    if (!this.mouse) {
      this.mouse = {
        clientX: 0,
        clientY: 0,
        movementX: 0,
        movementY: 0,
      }
    }
    if (e.clientY) {
      this.mouse.clientX = e.clientX - rect.x;
      this.mouse.clientY = e.clientY - rect.y;
      if (e.type == 'mousemove') {
        this.mouse.movementX = e.movementX * 1.0;
        this.mouse.movementY = e.movementY * 1.0;
      }
    }
    if (e.touches && e.touches.length > 0) {
      const oldX = this.mouse.clientX;
      const oldY = this.mouse.clientY;
      this.mouse.clientX = e.touches[0].clientX - rect.x;
      this.mouse.clientY = e.touches[0].clientY - rect.y;
      this.mouse.movementX = (this.mouse.clientX - oldX) * 1.0;
      this.mouse.movementY = (this.mouse.clientY - oldY) * 1.0;
      if (Math.abs(this.mouse.movementX) > 100) {
        this.mouse.movementX = 0;
      }
      if (Math.abs(this.mouse.movementY) > 100) {
        this.mouse.movementY = 0;
      }
    }
    
    var handled = false;
    this.state.layers.forEach((layer) => {
      if (!handled && layer.handleEvent) {
        if (layer.handleEvent(e)) {
          handled = true;
        }
      }
    });
    if (!handled) {
      if (e.type == 'resize') {
        this.layout.refresh();
        this.updateCanvasDimensions();
      }
      if (e.type == 'keydown') {
        if (e.key == 'Space') {
          this.state.showMeter = !this.state.showMeter;
        }
      }
    }
    if (handled) {
      e.preventDefault();
    }
    return handled;
  }

  getKoreAppViewport() {
    const elm = document.querySelectorAll('#appPanel, #appHeader, #appFooter');
    const dh = Array.prototype.slice.call(elm).map(a => a.clientHeight).reduce((a,b) => a + b);
    const w = this.layout.appContainer.clientWidth;
    const h = (this.layout.appContainer.clientHeight - dh);

    if (this.settings.view.maximized) {
      return { x: 0, y: 0, w: w, h: h };
    }

    const maxDim = Math.min(w, h);
    const dim = Math.floor(maxDim / 8) * 8;
    return { x: 0, y: 0, w: dim, h: dim };
  }

  updateCanvasDimensions() {
    if (!this.props.container) {
      this.props.container = document.getElementById('koreApp');
    }
    this.viewPort = this.getKoreAppViewport();
    if (!this.props.canvas) {
        var newCanvas = document.createElement('canvas');
        this.props.container.appendChild(newCanvas);
        this.props.canvas = newCanvas;
    }
    
    const { canvas, container } = this.props;
    if (canvas.width != this.viewPort.w) {
      canvas.width  = this.viewPort.w;
      container.style.width = this.viewPort.w;
    }
    if (canvas.height != this.viewPort.h) {
      canvas.height = this.viewPort.h;
      container.style.height = this.viewPort.h;
    }
    this.refillBackground = true;
  }

  update(progress) {
    const { showMeter, meter } = this.state;
    if (showMeter && meter) {
      meter.update(progress);
      if (meter.alert()) {
        this.state.showMeter = true;
      }
    }
    this.state.layers.forEach((layer) => {
      if (layer.update) {
        layer.update(progress);
      }
    });
  }

  draw(progress = 0) {
    const { canvas, container } = this.props;
    if (!canvas) {
      return;
    }
    const { showMeter, meter } = this.state;
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.fillStyle = this.canvasFill;
    if (this.refillBackground) {
      ctx.fillStyle = this.canvasFill;
      ctx.fillRect(0,0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0,0, canvas.width, canvas.height);
    }

    //console.log('drawing')
    this.state.layers.forEach((layer) => {
      ctx.save();
      if (layer.render) {
        layer.render(canvas, ctx, progress);
      }
      ctx.restore();
    });

    

    if (this.mouse && false) {
      ctx.beginPath();
      ctx.moveTo(this.mouse.clientX - 10, this.mouse.clientY);
      ctx.lineTo(this.mouse.clientX + 10, this.mouse.clientY);
      ctx.moveTo(this.mouse.clientX, this.mouse.clientY - 10);
      ctx.lineTo(this.mouse.clientX, this.mouse.clientY + 10);
      ctx.stroke();
    }

    //tx.closePath();
    // if (showMeter) meter.render(canvas, ctx, progress);
    ctx.restore();
    this.refillBackground = false;
  }

  loop(timestamp) {
    const { container } = this.props;
    const { lastUpdate } = this.state;
    var progress = Math.max(timestamp - lastUpdate, 1);
    this.state.lastUpdate = timestamp;
    if (this.renderFlag) {
      this.draw(progress);
      this.renderFlag = false;
    }
    setTimeout(() => {
      window.requestAnimationFrame(this.loop.bind(this));
    }, 30);
  }
}
