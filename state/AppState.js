class AppState {
  constructor() {
    this.activeLocation = {
      id_lokasi: null,
      latitude: null,
      longitude: null,
    };
  }

  updateLocation(newLocation) {
    this.activeLocation = {
      id_lokasi: newLocation.id_lokasi,
      latitude: parseFloat(newLocation.latitude),
      longitude: parseFloat(newLocation.longitude),
    };
    console.log('[STATE] Location updated:', this.activeLocation);
  }

  clearLocation() {
    this.activeLocation = {
      id_lokasi: null,
      latitude: null,
      longitude: null,
    };
    console.log('[STATE] Location cleared');
  }

  getLocation() {
    return this.activeLocation;
  }
}

module.exports = new AppState();
