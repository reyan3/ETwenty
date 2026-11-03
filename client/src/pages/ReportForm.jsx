import { lazy, Suspense, useState, useMemo, useEffect } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { State } from "country-state-city";
import { Link } from "react-router-dom";
import api from "../api/api";
import REPORT_ISSUE_TYPES from "../constants/reportIssueTypes";
import {
  MapPin,
  Car,
  AlertTriangle,
  IndianRupee,
  Gauge,
  Send,
  CheckCircle2,
  ArrowRight,
  Info,
  Building2,
  Loader2,
  Receipt,
  Upload,
  X,
} from "lucide-react";

const libraries = ["places"];
const GasStationMap = lazy(() => import("../components/GasStationMap"));
const COUNTRY_CODE = "IN";
const VEHICLE_YEARS = Array.from({ length: 10 }, (_, i) => 2017 + i);
const RECEIPT_IMAGE_TYPES = ["image/png", "image/jpeg"];

const ReportForm = () => {
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const { showToast } = useToast();

  const { user } = useAuth();
  const [autocomplete, setAutocomplete] = useState(null);
  const [station, setStation] = useState(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // New state for receipt file and preview
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }; // unmounts URL also when cancelling the uploaded pic
  }, [previewUrl]);

  const [form, setForm] = useState({
    issueType: "mileage_drop",
    vehicleType: "car",
    mileageDropPercent: "",
    description: "",
    repairCost: "",
    vehicleYear: "",
  });

  const states = useMemo(() => {
    return State.getStatesOfCountry(COUNTRY_CODE).map((state) => ({
      name: state.name,
      isoCode: state.isoCode,
    }));
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;
    input.value = "";

    if (!RECEIPT_IMAGE_TYPES.includes(file.type)) {
      showToast("Please upload a valid image file (PNG, JPG, JPEG)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    setReceiptFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setPreviewUrl("");
  };

  const handleStateChange = (e) => {
    const isoCode = e.target.value;
    const selectedObj = states.find((s) => s.isoCode === isoCode);

    setSelectedStateCode(isoCode);
    setSelectedStateName(selectedObj ? selectedObj.name : "");

    if (station && station.stateCode !== isoCode) {
      setStation(null);
      setSearch("");
      setSelectedDistrict("");
      showToast(
        "The selected petrol station is outside this state. Please select a station in the chosen state.",
        "error",
      );
    }
  };

  const selectStationPlace = (place) => {
    if (!place || !place.geometry) {
      showToast(
        "Please select a valid station from the dropdown suggestions.",
        "info",
      );
      return;
    }

    if (!place.types?.includes("gas_station")) {
      setStation(null);
      setSelectedDistrict("");
      showToast("Please select a gas station from the suggestions.", "error");
      return;
    }

    const placeState = place.address_components?.find((component) =>
      component.types.includes("administrative_area_level_1"),
    );
    if (!placeState?.short_name) {
      showToast(
        "Could not verify the petrol station's state. Please select another result.",
        "error",
      );
      return;
    }

    if (selectedStateCode && placeState.short_name !== selectedStateCode) {
      setSearch("");
      setStation(null);
      setSelectedDistrict("");
      showToast(
        "This petrol station is in a different state. Please select a station in the chosen state.",
        "error",
      );
      return;
    }

    const placeDistrict = place.address_components?.find((component) =>
      component.types.includes("administrative_area_level_2"),
    )?.long_name;

    setSearch(`${place.name}`);
    setSelectedDistrict(placeDistrict || "");

    setStation({
      placeId: place.place_id,
      name: place.name || "Unknown Station",
      address: place.formatted_address || "",
      stateCode: placeState.short_name,
      district: placeDistrict || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
    selectStationPlace(autocomplete.getPlace());
  };

  const findNearbyStations = () => {
    if (!navigator.geolocation) {
      showToast("Location access is not available in this browser.", "error");
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(location);
        map?.panTo(location);
        map?.setZoom(14);

        const service = new window.google.maps.places.PlacesService(
          map || document.createElement("div"),
        );
        service.nearbySearch(
          { location, radius: 5000, type: "gas_station" },
          (results, status) => {
            setNearbyLoading(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              setNearbyStations(results);
              if (results.length === 0) {
                showToast("No nearby gas stations were found.", "info");
              }
              return;
            }

            if (
              status ===
              window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              setNearbyStations([]);
              showToast("No nearby gas stations were found.", "info");
              return;
            }

            showToast("Could not search for nearby gas stations.", "error");
          },
        );
      },
      (error) => {
        setNearbyLoading(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Allow location access to find nearby gas stations."
            : "Could not get your location. Please try again.";
        showToast(message, "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectNearbyStation = (placeId) => {
    const service = new window.google.maps.places.PlacesService(
      map || document.createElement("div"),
    );
    service.getDetails(
      {
        placeId,
        fields: [
          "address_components",
          "geometry",
          "name",
          "place_id",
          "formatted_address",
          "types",
        ],
      },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          showToast("Could not load the selected station.", "error");
          return;
        }
        selectStationPlace(place);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      return showToast(
        "Authentication required. Please sign in to submit reports.",
        "info",
      );
    }
    if (!station) {
      return showToast(
        "Please search and select a specific petrol station location.",
        "info",
      );
    }
    if (!selectedStateCode || station.stateCode !== selectedStateCode) {
      return showToast(
        "Please select a petrol station that matches the chosen state.",
        "error",
      );
    }

    if (!receiptFile) {
      showToast("Please Upload Proof!", "info");
      return;
    }

    try {
      setSubmitting(true);

      // Use FormData to support multipart file upload alongside text fields
      const formData = new FormData();
      formData.append("issueType", form.issueType);
      formData.append("vehicleType", form.vehicleType);
      formData.append("mileageDropPercent", form.mileageDropPercent);
      formData.append("description", form.description);
      formData.append("repairCost", form.repairCost);
      formData.append("vehicleYear", form.vehicleYear);
      formData.append("state", selectedStateName);
      formData.append("district", selectedDistrict);

      // Append petrol station nested fields or JSON string depending on backend expectations
      formData.append("petrolStation[placeId]", station.placeId);
      formData.append("petrolStation[name]", station.name);
      formData.append("petrolStation[address]", station.address);

      // GeoJSON coordinates (Longitude, Latitude)
      formData.append("location[type]", "Point");
      formData.append("location[coordinates][0]", station.lng);
      formData.append("location[coordinates][1]", station.lat);

      formData.append("receipt", receiptFile);

      await api.post("/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Form Submitted Successfully!", "success");
      setSearch("");
      setStation(null);
      setSelectedStateCode("");
      setSelectedStateName("");
      setSelectedDistrict("");
      setReceiptFile(null);
      setPreviewUrl("");
      setForm({
        issueType: "mileage_drop",
        vehicleType: "car",
        mileageDropPercent: "",
        description: "",
        repairCost: "",
        vehicleYear: "",
      });
    } catch (err) {
      showToast("Submission Failed!", "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="relative min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <div
          role="alert"
          className="relative z-10 max-w-3xl mx-auto rounded-3xl bg-slate-900/50 border border-red-500/20 p-6 sm:p-8 text-center"
        >
          <h1 className="text-xl font-bold text-white">
            Map services couldn’t be loaded
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            The report form needs Google Maps to select a petrol station. Check
            your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Skeleton structure
  if (!isLoaded) {
    return (
      <div
        aria-busy="true"
        className="relative min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-200 overflow-hidden font-sans"
      >
        <span className="sr-only">Loading report form...</span>
        <div
          aria-hidden="true"
          className="relative z-10 max-w-3xl mx-auto animate-pulse"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="h-9 w-52 rounded-xl bg-slate-800/70" />
          </div>
          <div className="mb-8 space-y-3">
            <div className="h-9 w-72 sm:w-96 rounded-lg bg-slate-800/80" />
            <div className="h-4 w-60 sm:w-80 rounded-md bg-slate-800/50" />
          </div>
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl">
            <div className="h-44 w-full rounded-2xl bg-slate-800/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Background Ambient Lights & Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-200 h-125 bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-10 w-md h-md bg-teal-500/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, #10b981 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-center mb-8">
          <Link
            to="/my-reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-400/40 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-all shadow-lg group"
          >
            <span>My Submitted Reports</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Title Card */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Report E20 Fuel Impact
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Report real issues regarding E20 fuel quality problems at local
            petrol pumps
          </p>
        </div>

        {/* Main Form Container */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl"
        >
          {/* Section 1: Fuel Station Location */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>
                1. Petrol Station Identification{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>

            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: "in" },
                fields: [
                  "address_components",
                  "geometry",
                  "name",
                  "place_id",
                  "formatted_address",
                  "types",
                ],
                types: ["gas_station"],
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and select petrol station..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setStation(null);
                    setSelectedDistrict("");
                  }}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </Autocomplete>

            <button
              type="button"
              onClick={findNearbyStations}
              disabled={nearbyLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {nearbyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {nearbyLoading
                ? "Finding nearby stations..."
                : "Show nearby gas stations"}
            </button>

            {userLocation && (
              <Suspense
                fallback={
                  <div
                    aria-label="Loading nearby gas station map"
                    className="h-90 animate-pulse rounded-2xl border border-white/10 bg-slate-800/50"
                  />
                }
              >
                <GasStationMap
                  userLocation={userLocation}
                  nearbyStations={nearbyStations}
                  station={station}
                  onMapLoad={setMap}
                  onSelectStation={selectNearbyStation}
                />
              </Suspense>
            )}

            {station && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">
                    {station.name}
                  </span>
                  <span className="text-[11px] text-emerald-400/80">
                    {station.address}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Select the exact fueling station where you experienced issues
                and having fuel receipt
              </span>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Section 2: Regional Location */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>
                2. State & Region <span className="text-red-500">*</span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <select
                  name="state"
                  value={selectedStateCode}
                  onChange={handleStateChange}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                  required
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {states.map((s) => (
                    <option
                      key={s.isoCode}
                      value={s.isoCode}
                      className="bg-slate-900 text-white"
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  name="district"
                  type="text"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedStateCode}
                  placeholder={
                    selectedStateCode
                      ? "District from station or enter manually"
                      : "Select State First"
                  }
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all disabled:opacity-40"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Section 3: Vehicle Specs */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>
                3. Vehicle Profile <span className="text-red-500">*</span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  onChange={handleChange}
                  value={form.vehicleType}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                >
                  <option value="car" className="bg-slate-900">
                    Car
                  </option>
                  <option value="motorcycle" className="bg-slate-900">
                    Motorcycle
                  </option>
                  <option value="scooter" className="bg-slate-900">
                    Scooter
                  </option>
                  <option value="commercial" className="bg-slate-900">
                    Commercial Vehicle
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                  Manufacturing Year
                </label>
                <select
                  name="vehicleYear"
                  value={form.vehicleYear}
                  onChange={handleChange}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                  required
                >
                  <option value="" disabled>
                    Select Year
                  </option>
                  {VEHICLE_YEARS.map((y) => (
                    <option key={y} value={y} className="bg-slate-900">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Section 4: Diagnostics & Costs */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              <span>4. Diagnostic Metrics</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                  Primary Issue <span className="text-red-500">*</span>
                </label>
                <select
                  name="issueType"
                  onChange={handleChange}
                  value={form.issueType}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none transition-all"
                  required
                >
                  {REPORT_ISSUE_TYPES.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                  Mileage Drop (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="mileageDropPercent"
                    placeholder="e.g. 15"
                    type="number"
                    min="0"
                    max="100"
                    value={form.mileageDropPercent}
                    onChange={handleChange}
                    className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-3 pr-8 py-3 text-xs text-white focus:outline-none transition-all"
                    required
                  />
                  <Gauge className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                  Repair Cost (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="repairCost"
                    placeholder="e.g. 3500"
                    type="number"
                    min="0"
                    value={form.repairCost}
                    onChange={handleChange}
                    className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-3 pr-8 py-3 text-xs text-white focus:outline-none transition-all"
                    required
                  />
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                Detailed Diagnostic Description
              </label>
              <textarea
                name="description"
                rows="3"
                placeholder="Elaborate on symptoms (e.g., erratic idling, acceleration lag, engine misfires after fueling)..."
                onChange={handleChange}
                value={form.description}
                className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl p-4 text-[11px] sm:text-xs text-white focus:outline-none transition-all resize-none min-h-23"
              />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Section 5: Receipt / Evidence Upload */}
          <div className="space-y-3">
            <label className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2 flex-wrap">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>
                5. Fuel Receipt / Evidence Proof{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full min-h-32 border-2 border-dashed border-white/10 hover:border-emerald-400/50 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all group p-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed">
                    Click to upload receipt or drag & drop
                    <p className="text-red-400 text-center text-[10px]">
                      Please upload a valid image file (PNG, JPG, JPEG) and file
                      size must be less than 5MB.
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950/80 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <img
                    src={previewUrl}
                    alt="Receipt Preview"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-white block truncate">
                      {receiptFile?.name || "receipt_image.jpg"}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Ready for automated verification
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer self-center sm:self-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(52,211,153,0.3)] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying and Submitting Report ...</span>
              </>
            ) : (
              <div className="px-2 flex items-center gap-2 text-[10px] sm:text-xs">
                <Send className="w-4 h-4" />
                <span>Submit Diagnostic Report</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
