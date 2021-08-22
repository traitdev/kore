export default class DefaultLayout {
  constructor () {
    this.appContainer = this.getAppContainer();
    this.detectScreenType();
    if (this.screen.isMobile) {
      this.layoutElement = this.createForMobile();
    } else {
      this.layoutElement = this.createForDesktop();
    }
    this.layoutElement.style.visibility = 'hidden';
    this.layoutElement.style.opacity = 0;
    this.appContainer.appendChild(this.layoutElement);
    
    this.btnFullScreen = document.getElementById('btnFullScreen');
    this.btnReloadPage = document.getElementById('btnReloadPage');
    this.btnFullScreen.onclick = () => {
      const le = this.layoutElement;
      if (this.screen.isMobile) {
        this.btnReloadPage.style.visibility = 'visible';
      }
      this.btnFullScreen.style.visibility = 'hidden';
      
      if (le.requestFullscreen) {
        le.requestFullscreen();
      } else if (le.webkitRequestFullscreen) { /* Safari */
        le.webkitRequestFullscreen();
      }
    }
    this.btnReloadPage.onclick = () => {
      window.location.reload();
    }
  }
  
  update() {
    if (this.isFullScreen()) {
      if (this.screen.isMobile) {
        this.btnReloadPage.style.visibility = 'visible';
      }
      this.btnFullScreen.style.visibility = 'hidden';
    } else {
      this.btnReloadPage.style.visibility = 'hidden';
      this.btnFullScreen.style.visibility = 'visible';
    }
    
    this.layoutElement.style.animation = 'fadeIn 2s';
    this.layoutElement.style.opacity = 1;
    this.layoutElement.style.visibility = 'visible';
  }

  htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  isFullScreen() {
    return (window.fullScreen) ||
      (window.innerWidth == screen.width && window.innerHeight == screen.height);
  }

  detectScreenType() {
    if (!this.dpi) {
      this.dpi = this.htmlToElement('<div id="dpi" style="height: 1in; width: 1in; left: 100%; position: fixed; top: 100%;"></div>');
      document.body.appendChild(this.dpi);
    }
    var dpi_x = this.dpi.offsetWidth;
    var dpi_y = this.dpi.offsetHeight;
    var width = screen.width / dpi_x;
    var height = screen.height / dpi_y;
    const size = Math.min(width, height);
    this.screen = {
      size: { unit: 'inch', width, height },
      dpi: {
        x: dpi_x,
        y: dpi_y,
      },
      isMobile: (size < 7),
      scaleCompensationFactor: (2 + 5 / size),
    }
  }

  setPanel(html) {
    if (this.panel) {
      while (this.panel.firstChild) {
        this.panel.removeChild(this.panel.lastChild);
      }
    }
    this.panel = document.getElementById('appPanel');
    this.panel.appendChild(this.htmlToElement(html));
  };

  createForMobile(viewport) {
    return this.htmlToElement(`
      <div id="layout" class="layout layout-mobile">
        <header id="appHeader" class="app-header">
          <button id="btnSettings" class="material-icons">settings</button>
          <h1>&#9679; miran &#9679;</h1>
          <button id="btnFullScreen" class="material-icons">
            fullscreen
          </button>
          <button id="btnReloadPage" class="material-icons">
            restore_page
          </button>
        </header>
        <div id="koreAppContainer">
          <div id="koreApp"></div>
          <div id="appPanel"></div>
        </div>
        <footer id="appFooter" class="app-footer">
          <p>&#169; 2021 M.C.P.</script></p>
        </footer>
      </div>
    `);
  }

  createForDesktop() {
    return this.htmlToElement(`
      <div id="layout" class="layout layout-desktop">
        <header id="appHeader" class="app-header">
          <button id="btnSettings" class="material-icons">settings</button>
          <h1>&#9679; miran &#9679;</h1>
          <button id="btnFullScreen" class="material-icons">
            fullscreen
          </button>
          <button id="btnReloadPage" class="material-icons">
            restore_page
          </button>
        </header>
        <div id="koreAppContainer">
          <div id="koreApp"></div>
          <div id="appPanel"></div>
        </div>
        <footer id="appFooter" class="app-footer">
          <p>&#169; 2021 M.C.P.</script></p>
        </footer>
      </div>
    `);
  }

  getAppContainer() {
    const ac = document.getElementById('app-container');
    return (ac || document.body);
  }
}