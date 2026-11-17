import { arenaMapStyle } from './arena-map-style';
interface RetainedArenaMap {
  element: HTMLDivElement;
  map: google.maps.Map;
  viewportKey?: string;
}
let retained: RetainedArenaMap | undefined;

// One map per document: route navigation moves the same DOM node instead of creating a billable map load.
export function retainArenaMap(host: HTMLElement): RetainedArenaMap {
  if (!retained) {
    const element = document.createElement('div');
    element.style.width = '100%';
    element.style.height = '100%';
    host.appendChild(element);
    const map = new google.maps.Map(element, {
      center: { lat: -14.235, lng: -51.9253 },
      zoom: 4,
      styles: arenaMapStyle,
      renderingType: google.maps.RenderingType.RASTER,
      clickableIcons: false,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: 'cooperative',
      fullscreenControl: true,
    });
    retained = { element, map };
  }
  host.replaceChildren(retained.element);
  return retained;
}
