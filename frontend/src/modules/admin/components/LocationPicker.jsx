import React, { useState } from 'react';
import { GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import {
  useAppGoogleMapsLoader,
  HAS_VALID_GOOGLE_MAPS_KEY,
  INDIA_CENTER,
  getLatLng,
} from '../utils/googleMaps';

/**
 * Pick a coordinate by searching, clicking the map, or dragging the pin.
 *
 * The lat/lng inputs next to it stay editable and remain the source of truth -
 * this only writes into them, so a hand-typed pair is never overridden.
 *
 * The map's own centre is deliberately kept in local state rather than driven
 * by the coordinate: re-centring on every click would yank the map out from
 * under whoever is fine-tuning a pin.
 */

const round6 = (value) => Number(Number(value).toFixed(6));

const isPoint = (lat, lng) =>
  lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

const shell = 'overflow-hidden rounded-xl border border-slate-200';

const LocationPicker = ({ latitude, longitude, onPick, height = 260 }) => {
  const { isLoaded, loadError } = useAppGoogleMapsLoader();
  const [autocomplete, setAutocomplete] = useState(null);

  const marked = isPoint(latitude, longitude);
  const point = marked ? getLatLng({ lat: latitude, lng: longitude }) : null;

  // Only the initial view - searching moves it, clicking does not.
  const [view, setView] = useState(() => ({ center: point || INDIA_CENTER, zoom: marked ? 15 : 5 }));

  const pick = (latLng) => onPick({ latitude: round6(latLng.lat()), longitude: round6(latLng.lng()) });

  const onPlaceChanged = () => {
    const place = autocomplete?.getPlace();
    if (!place?.geometry?.location) return; // free text with no suggestion chosen
    pick(place.geometry.location);
    setView({ center: getLatLng(place.geometry.location.toJSON()), zoom: 16 });
  };

  if (!HAS_VALID_GOOGLE_MAPS_KEY || loadError) {
    return (
      <div className={`${shell} bg-slate-50 px-4 py-6 text-center text-[12.5px] text-slate-500`}>
        {loadError ? 'Google Maps failed to load.' : 'No Google Maps key configured.'} Type the
        coordinates by hand, or set <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to pick
        them visually.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`${shell} animate-pulse bg-slate-100`} style={{ height }} />;
  }

  return (
    <div className="space-y-2">
      <Autocomplete
        onLoad={setAutocomplete}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: 'in' }, fields: ['geometry'] }}
      >
        <input
          type="text"
          placeholder="Search a place, then click the map or drag the pin to fine-tune…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400"
          // Enter would otherwise submit the hotel form instead of choosing a suggestion.
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
      </Autocomplete>

      <div className={shell} style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={view.center}
          zoom={view.zoom}
          onClick={(e) => pick(e.latLng)}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {marked ? <MarkerF position={point} draggable onDragEnd={(e) => pick(e.latLng)} /> : null}
        </GoogleMap>
      </div>

      <p className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
        <MapPin size={13} className={marked ? 'text-emerald-600' : 'text-slate-400'} />
        {marked
          ? `Pinned at ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
          : 'No pin yet — click the map to place one. Without it the hotel is left out of nearby search.'}
      </p>
    </div>
  );
};

export default LocationPicker;
