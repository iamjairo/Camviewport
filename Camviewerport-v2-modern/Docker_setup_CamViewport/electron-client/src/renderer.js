class CameraGrid {
  constructor() {
    this.cameras = [];
    this.layout = { rows: 2, cols: 2 };
    this.serverUrl = 'http://localhost:8080';
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.setupEventListeners();
    this.render();
  }

  async loadConfig() {
    try {
      const config = await window.electronAPI.getConfig();
      this.serverUrl = config.serverUrl || 'http://localhost:8080';
      this.cameras = config.cameras || [];
      this.layout = config.layout || { rows: 2, cols: 2 };
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  setupEventListeners() {
    // Listen for layout changes from menu
    window.electronAPI.onSetLayout((layout) => {
      this.setLayout(layout);
    });

    // Listen for settings dialog
    window.electronAPI.onOpenSettings(() => {
      this.openSettings();
    });

    // Listen for custom layout dialog
    window.electronAPI.onOpenCustomLayout(() => {
      this.openCustomLayout();
    });

    // Listen for about dialog
    window.electronAPI.onShowAbout(() => {
      this.showAbout();
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  render() {
    const container = document.getElementById('camera-grid');
    container.innerHTML = '';
    
    // Set grid layout
    container.style.gridTemplateColumns = `repeat(${this.layout.cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${this.layout.rows}, 1fr)`;

    const totalCells = this.layout.rows * this.layout.cols;

    // Create camera cells
    for (let i = 0; i < totalCells; i++) {
      const cell = this.createCameraCell(i);
      container.appendChild(cell);
    }
  }

  createCameraCell(index) {
    const cell = document.createElement('div');
    cell.className = 'camera-cell';
    cell.dataset.index = index;

    const camera = this.cameras[index];

    if (camera) {
      cell.innerHTML = `
        <div class="camera-header">
          <span class="camera-name">${camera.name}</span>
          <div class="camera-controls">
            <button class="btn-reconnect" data-index="${index}" title="Reconnect">
              <span>⟳</span>
            </button>
            <button class="btn-remove" data-index="${index}" title="Remove">
              <span>✕</span>
            </button>
          </div>
        </div>
        <div class="video-container">
          ${this.createVideoElement(camera, index)}
        </div>
        <div class="camera-status" data-index="${index}">
          <span class="status-indicator"></span>
          <span class="status-text">Connecting...</span>
        </div>
      `;

      // Add event listeners
      const reconnectBtn = cell.querySelector('.btn-reconnect');
      const removeBtn = cell.querySelector('.btn-remove');

      reconnectBtn.addEventListener('click', () => this.reconnectCamera(index));
      removeBtn.addEventListener('click', () => this.removeCamera(index));

    } else {
      cell.innerHTML = `
        <div class="empty-cell">
          <button class="btn-add-camera" data-index="${index}">
            <span>+</span>
            <span>Add Camera</span>
          </button>
        </div>
      `;

      const addBtn = cell.querySelector('.btn-add-camera');
      addBtn.addEventListener('click', () => this.addCamera(index));
    }

    return cell;
  }

  createVideoElement(camera, index) {
    // Support multiple protocols
    const protocol = camera.protocol || 'webrtc';

    switch (protocol) {
      case 'webrtc':
        return `
          <video 
            id="video-${index}" 
            class="camera-video" 
            autoplay 
            playsinline 
            muted
            data-camera-id="${camera.id}"
            data-stream-url="${camera.streamUrl}"
          ></video>
        `;
      
      case 'hls':
        return `
          <video 
            id="video-${index}" 
            class="camera-video" 
            controls 
            autoplay 
            playsinline 
            muted
          >
            <source src="${camera.streamUrl}" type="application/x-mpegURL">
          </video>
        `;
      
      case 'mjpeg':
        return `
          <img 
            id="video-${index}" 
            class="camera-video" 
            src="${camera.streamUrl}" 
            alt="${camera.name}"
          />
        `;
      
      default:
        return `
          <iframe 
            id="video-${index}" 
            class="camera-video" 
            src="${camera.streamUrl}" 
            frameborder="0" 
            allow="autoplay; fullscreen"
          ></iframe>
        `;
    }
  }

  setLayout(layout) {
    this.layout = layout;
    window.electronAPI.saveLayout(layout);
    this.render();
  }

  async addCamera(index) {
    const modal = this.createCameraModal(index);
    document.body.appendChild(modal);
  }

  createCameraModal(index) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add Camera</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="camera-form">
            <div class="form-group">
              <label>Camera Name</label>
              <input type="text" id="camera-name" placeholder="e.g., Front Door" required>
            </div>
            <div class="form-group">
              <label>Stream URL</label>
              <input type="text" id="stream-url" placeholder="e.g., rtsp://camera-ip/stream" required>
            </div>
            <div class="form-group">
              <label>Protocol</label>
              <select id="protocol">
                <option value="webrtc">WebRTC (Recommended)</option>
                <option value="hls">HLS</option>
                <option value="rtsp">RTSP</option>
                <option value="mjpeg">MJPEG</option>
                <option value="iframe">Embed (iframe)</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary modal-cancel">Cancel</button>
              <button type="submit" class="btn-primary">Add Camera</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#camera-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const camera = {
        id: Date.now().toString(),
        name: document.getElementById('camera-name').value,
        streamUrl: document.getElementById('stream-url').value,
        protocol: document.getElementById('protocol').value
      };

      this.cameras[index] = camera;
      await window.electronAPI.saveCameras(this.cameras);
      this.render();
      modal.remove();
    });

    return modal;
  }

  async removeCamera(index) {
    if (confirm('Are you sure you want to remove this camera?')) {
      this.cameras.splice(index, 1);
      await window.electronAPI.saveCameras(this.cameras);
      this.render();
    }
  }

  reconnectCamera(index) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    const video = cell.querySelector('.camera-video');
    
    if (video && video.tagName === 'VIDEO') {
      video.load();
    } else if (video && video.tagName === 'IMG') {
      const src = video.src;
      video.src = '';
      setTimeout(() => video.src = src, 100);
    }
  }

  openSettings() {
    // Implementation for settings dialog
    console.log('Open settings');
  }

  openCustomLayout() {
    // Implementation for custom layout dialog
    console.log('Open custom layout');
  }

  showAbout() {
    alert('CamViewport Desktop v1.0.0\nIP Camera Video Wall Application');
  }

  handleResize() {
    // Handle window resize if needed
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CameraGrid();
});