import styles from '../components/ArenaMap.module.scss';
import type { Arena } from '../../../shared/types';

export function createArenaMarker(
  map: google.maps.Map,
  arena: Arena,
  selected: boolean,
  onSelect: (arena: Arena) => void,
) {
  // OverlayView supports locally styled maps without a Cloud Map ID or legacy Marker API.
  class ArenaMarker extends google.maps.OverlayView {
    private readonly button = document.createElement('button');
    constructor() {
      super();
      this.button.type = 'button';
      this.button.className = `${styles.marker} position-absolute translate-middle d-flex align-items-center justify-content-center border border-3 border-white rounded-circle bg-primary text-white shadow p-0`;
      this.button.setAttribute('aria-label', `Ver quadra: ${arena.address}`);
      this.button.setAttribute('aria-pressed', String(selected));
      this.button.title = arena.address;
      this.button.innerHTML =
        '<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="26" height="20" rx="2"/><path d="M16 6v20M3 12h5v8H3m26-8h-5v8h5"/><circle cx="16" cy="16" r="4"/></svg>';
      this.button.onclick = () => onSelect(arena);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.button);
      this.setMap(map);
    }
    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(this.button);
    }
    draw() {
      const position = this.getProjection()?.fromLatLngToDivPixel(
        new google.maps.LatLng(Number(arena.lat), Number(arena.longitude)),
      );
      if (!position) return;
      this.button.style.left = `${position.x}px`;
      this.button.style.top = `${position.y}px`;
    }
    onRemove() {
      this.button.remove();
      this.button.onclick = null;
    }
  }
  return new ArenaMarker();
}
