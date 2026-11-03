import { GoogleMap, Marker } from "@react-google-maps/api";

const GasStationMap = ({
  userLocation,
  nearbyStations,
  station,
  onMapLoad,
  onSelectStation,
}) => (
  <div className="overflow-hidden rounded-2xl border border-white/10">
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "360px" }}
      center={userLocation}
      zoom={14}
      onLoad={onMapLoad}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      <Marker
        position={userLocation}
        title="Your location"
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }}
      />
      {nearbyStations.map((place) => {
        const position = place.geometry?.location;
        if (!position || !place.place_id) return null;
        return (
          <Marker
            key={place.place_id}
            position={position}
            title={place.name}
            onClick={() => onSelectStation(place.place_id)}
          />
        );
      })}
      {station && (
        <Marker
          position={{ lat: station.lat, lng: station.lng }}
          title={station.name}
        />
      )}
    </GoogleMap>
    <p className="bg-slate-950/80 px-3 py-2 text-[11px] text-slate-400">
      Showing gas stations within 5 km. Select a marker to choose a station.
    </p>
  </div>
);

export default GasStationMap;
