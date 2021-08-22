export default class DefaultLayout {
  constructor (settings) {
    this.settings = settings;
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
  
  refresh() {
    this.loadTheme();
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

  loadTheme() {
    const theme = this.settings.theme;
    const colors = theme.colors;
    var css = `
      <style>
.bg1 {
  background-color: ${colors.primary};
}
.bg2 {
  background-color: ${colors.secondary};
}
.bgh {
  background-color: ${colors.highlight};
}
.bgdark {
  background-color: ${colors.dark};
}
.bgdarker {
  background-color: ${colors.darker};
}
.bgmedium {
  background-color: ${colors.medium};
}
.bglighter {
  background-color: ${colors.lighter};
}
.bglight {
  background-color: ${colors.light};
}
.fg1 {
  color: ${colors.primary};
}
.fg2 {
  color: ${colors.secondary};
}
.fgh {
  color: ${colors.highlight};
}
.fgdark {
  color: ${colors.dark};
}
.fgdarker {
  color: ${colors.darker};
}
.fgmedium {
  color: ${colors.medium};
}
.fglighter {
  color: ${colors.lighter};
}
.fglight {
  color: ${colors.light};
}

.overlay {
  background: ${colors.darker};
}
div.rotate-overlay {
  background: ${colors.darker};
}
div.rotate-overlay .large-icon {
  background: ${colors.dark};
}
body {
  color: ${colors.dark};
  background-color: ${colors.light};
}
* {
  color: ${colors.darker};
}

button {
  background-color: ${colors.darker};
  color: ${colors.light};
}
button:hover {
  background-color: ${colors.highlight};
  color: ${colors.darker};
  cursor: pointer;
}
button:disabled {
  background-color: ${colors.medium};
  color: ${colors.lighter};
  cursor: default;
}
input {
  background-color: ${colors.light};
  border: 0.1em solid ${colors.dark};
}
input[type="text"], textarea {
  border: 0.1em solid ${colors.dark};
  background: ${colors.light};
  color: ${colors.dark};
}
input[type="text"]:hover {
  border: 0.1em solid ${colors.medium};
}
input[type="text"]:focus, input[type="text"]:hover + input[type="text"]:focus {
  border: 0.1em solid ${colors.highlight};
}
input[type="range"] {
  background: ${colors.medium};
}
input[type="range"]::-webkit-slider-thumb {
  background: ${colors.dark};
}
.slider {
  background-color: ${colors.medium};
}
.slider:before {
  background-color: ${colors.dark};
}
input:checked + .slider {
  background-color: ${colors.highlight};
}
input:focus + .slider {
  box-shadow: 0 0 1px ${colors.highlight};
}

label.toggle-side input:checked + .slider {
  background-color: ${colors.medium};
}
label.toggle-side .slider:before {
  background-color: ${colors.light};
}
label.toggle-side input:checked + .slider:before {
  background-color: ${colors.dark};;
}
footer.app-footer {
  background-color: ${colors.darker};
}
#app-container {
  background-color: ${colors.medium};
}
input {
  background-color: ${colors.darker};
}
button.nav-button > span {
  color: ${colors.darker};
}
#appHeader {
  background-color: ${colors.primary};
}
#appHeader button {
  background-color: ${colors.dark};
}
#appHeader button:hover {
  background-color: ${colors.medium};
}
#appHeader h1 {
  font-size: 2rem;
  color: ${colors.dark};
}
.sidenav {
  background-color: ${colors.lighter};
}

      </style>
    `;
    document.head.appendChild(this.htmlToElement(css));
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
          <h1>${this.settings.appTitle}</h1>
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
          <p>&#169; 2021 ${this.settings.copyright}.</script></p>
        </footer>
      </div>
    `);
  }

  createForDesktop() {
    return this.htmlToElement(`
      <div id="layout" class="layout layout-desktop">
        <header id="appHeader" class="app-header">
          <button id="btnSettings" class="material-icons">settings</button>
          <h1>${this.settings.appTitle}</h1>
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
          <p>&#169; 2021 ${this.settings.copyright}</script></p>
        </footer>
      </div>
    `);
  }

  getAppContainer() {
    const ac = document.getElementById('app-container');
    return (ac || document.body);
  }
}