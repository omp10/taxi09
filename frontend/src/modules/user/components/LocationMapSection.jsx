import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle, LocateFixed } from 'lucide-react';
import { GoogleMap } from '@react-google-maps/api';
import { HAS_VALID_GOOGLE_MAPS_KEY, useAppGoogleMapsLoader } from '../../admin/utils/googleMaps';
import { getSavedLocation, saveLocation } from '../services/locationStore';
const DEFAULT_CENTER = { lat: 17.385, lon: 78.4867 };
const DEFAULT_ZOOM = 16;
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const areCentersNearlyEqual = (first, second, threshold = 0.00001) => (
  Math.abs(Number(first?.lat ?? 0) - Number(second?.lat ?? 0)) < threshold &&
  Math.abs(Number(first?.lon ?? 0) - Number(second?.lon ?? 0)) < threshold
);

const LocationMapSection = () => {
  const [coords, setCoords] = useState(null);
  const [centerCoords, setCenterCoords] = useState(DEFAULT_CENTER);
  const [status, setStatus] = useState('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [map, setMap] = useState(null);
  const isDraggingRef = useRef(false);
  const requestedLocationRef = useRef(false);
  const { isLoaded, loadError } = useAppGoogleMapsLoader();

  const persistCoords = (next) => {
    setCoords(next);
    setCenterCoords(next);
    setStatus('ready');
    saveLocation({
      ...next,
      updatedAt: Date.now(),
    });
  };

  const persistAddress = (address) => {
    saveLocation({ address: String(address || '').trim() });
  };

  useEffect(() => {
    const saved = getSavedLocation();
    if (typeof saved?.lat === 'number' && typeof saved?.lon === 'number') {
      persistCoords({ lat: saved.lat, lon: saved.lon });
    }

    const shouldRefreshCurrentLocation =
      !saved
      || typeof saved?.lat !== 'number'
      || typeof saved?.lon !== 'number'
      || !saved?.updatedAt
      || (Date.now() - saved.updatedAt) > AUTO_REFRESH_INTERVAL_MS;

    if (shouldRefreshCurrentLocation && !requestedLocationRef.current) {
      requestedLocationRef.current = true;
      requestLocation();
    }
  }, []);

  useEffect(() => {
    if (coords && map) {
      map.panTo({ lat: coords.lat, lng: coords.lon });
      map.setZoom(DEFAULT_ZOOM);
    }
  }, [coords, map]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        persistCoords(next);
        if (map) {
          map.panTo({ lat: next.lat, lng: next.lon });
          map.setZoom(DEFAULT_ZOOM);
        }

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: next.lat, lng: next.lon } }, (results, geocodeStatus) => {
            if (geocodeStatus === 'OK' && results?.[0]?.formatted_address) {
              try {
                persistAddress(results[0].formatted_address);
              } catch {
                // ignore
              }
            }
          });
        }
      },
      (error) => {
        if (error?.code === 1) {
          setStatus('denied');
          return;
        }
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const helperText = (() => {
    if (status === 'loading') return 'Pinning your current location...';
    if (status === 'denied') return 'Location permission denied. Tap to try again.';
    if (status === 'error') return 'Unable to fetch location. Tap to retry.';
    if (isDragging) return 'Move the map to set the pin.';
    if (status === 'ready') return 'Drag the map to fine-tune. Tap Update to refresh';
    return 'Drag the map to fine-tune. Tap Update to refresh';
  })();

  return (
    <div className="px-5 mt-2">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white/70 backdrop-blur-md rounded-[28px] p-4 shadow-sm border border-white/80"
      >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#FFC107]">MAP</p>
          <h3 className="mt-1 flex items-baseline gap-1 text-[18px] font-black tracking-tight text-slate-800">
            <span className="truncate">Pin your location on map</span>
            {status === 'loading' && (
              <span className="inline-flex" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="inline-block"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                      duration: 1.05,
                      delay: dot * 0.18,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    .
                  </motion.span>
                ))}
              </span>
            )}
          </h3>
          <p className="mt-1 truncate text-[13px] font-medium text-slate-500">{helperText}</p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-[14px] border-[1.5px] border-[#FFC107] bg-white px-4 py-2 text-[14px] font-bold text-[#FFC107] shadow-sm transition-all active:bg-[#FFC107]/5"
        >
          <div className="relative">
            <LocateFixed 
              size={18} 
              strokeWidth={2.5} 
              className={`transition-colors ${status === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
          <span>Update</span>
        </motion.button>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[24px] bg-white shadow-lg">
        <div className="relative z-10 w-full h-[180px]">
          {!HAS_VALID_GOOGLE_MAPS_KEY && (
            <div className="flex h-full w-full items-center justify-center px-5 text-center bg-slate-50">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Google Maps key missing</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Add `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.</p>
              </div>
            </div>
          )}

          {HAS_VALID_GOOGLE_MAPS_KEY && loadError && (
            <div className="flex h-full w-full items-center justify-center px-5 text-center bg-slate-50">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Map failed to load</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Check your Google Maps browser key restrictions.</p>
              </div>
            </div>
          )}

          {HAS_VALID_GOOGLE_MAPS_KEY && !loadError && !isLoaded && (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
              <div className="flex items-center gap-2 rounded-[16px] bg-white/90 px-4 py-3 shadow-sm">
                <LoaderCircle size={18} className="animate-spin text-slate-500" />
                <span className="text-[12px] font-medium text-slate-700">Loading map</span>
              </div>
            </div>
          )}

          {HAS_VALID_GOOGLE_MAPS_KEY && !loadError && isLoaded && (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={{ lat: centerCoords.lat, lng: centerCoords.lon }}
              zoom={DEFAULT_ZOOM}
              onLoad={(nextMap) => setMap(nextMap)}
              onUnmount={() => setMap(null)}
              onDragStart={() => {
                isDraggingRef.current = true;
                setIsDragging(true);
              }}
              onDragEnd={() => {
                isDraggingRef.current = false;
                setIsDragging(false);
                if (!map) {
                  return;
                }

                const center = map.getCenter();
                if (!center) {
                  return;
                }

                persistCoords({ lat: center.lat(), lon: center.lng() });
                if (window.google?.maps?.Geocoder) {
                  const geocoder = new window.google.maps.Geocoder();
                  geocoder.geocode(
                    { location: { lat: center.lat(), lng: center.lng() } },
                    (results, geocodeStatus) => {
                      if (geocodeStatus === 'OK' && results?.[0]?.formatted_address) {
                        persistAddress(results[0].formatted_address);
                      }
                    },
                  );
                }
              }}
              onIdle={() => {
                if (!map) {
                  return;
                }

                const center = map.getCenter();
                if (!center) {
                  return;
                }

                const next = { lat: center.lat(), lon: center.lng() };

                if (areCentersNearlyEqual(centerCoords, next)) {
                  return;
                }

                setCenterCoords(next);

                if (!isDraggingRef.current && status === 'ready') {
                  saveLocation(next);
                }
              }}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                clickableIcons: false,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeControl: false,
                gestureHandling: 'greedy',
                styles: [
                  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
                  { elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
                  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
                  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
                  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
                  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
                  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
                  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
                  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
                  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
                  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
                  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
                  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
                  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
                  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
                  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
                  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
                  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
                ]
              }}
            />
          )}

          {/* The Pinpoint */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2">
            {/* Point Shadow - anchored at the map center */}
            <motion.div
              initial={false}
              animate={{
                scale: isDragging ? [1, 1.22, 1.15] : 1,
                opacity: isDragging ? 0.28 : 0.55,
                y: isDragging ? 7 : 0,
              }}
              className="absolute left-1/2 top-0 h-[3px] w-3.5 -translate-x-1/2 rounded-[100%] bg-slate-900/40 blur-[1.5px]"
            />

            {/* Pin Body */}
            <motion.div
              initial={false}
              animate={{
                y: isDragging ? -31 : -2,
                scale: isDragging ? 1.04 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: isDragging ? 450 : 350,
                damping: 25,
              }}
              className="relative flex flex-col items-center -translate-y-full"
            >
              <div className="relative h-[48px] w-[32px] drop-shadow-[0_10px_18px_rgba(255,193,7,0.3)]">
                <svg
                  viewBox="0 0 32 48"
                  className="h-full w-full overflow-visible"
                  aria-hidden="true"
                >
                  <path
                    d="M16 2C9.1 2 4 7.21 4 13.88c0 9.54 8.58 18.76 11.13 28.42.18.69.58 1.7.87 2.7.29-1 .69-2.01.87-2.7C19.42 32.64 28 23.42 28 13.88 28 7.21 22.9 2 16 2Z"
                    fill="#FFC107"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="14" r="6" fill="#ffffff" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </motion.section>
    </div>
  );
};

export default LocationMapSection;
