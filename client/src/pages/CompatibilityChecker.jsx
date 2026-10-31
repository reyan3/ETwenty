import { useState, useRef, useEffect } from "react";
import api from "../api/api";
import Hero from "../components/Hero";
import {
  AlertTriangle,
  Search,
  RotateCcw,
  Fuel,
  Sparkles,
  ChevronDown,
  Check,
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  Gauge,
  FileSearch,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

// Categorized dataset ensuring strict isolation between vehicle categories
const VEHICLE_DATA = {
  car: {
    label: "Car",
    makes: {
      Maruti: [
        "Swift",
        "Baleno",
        "WagonR",
        "Dzire",
        "Brezza",
        "Ertiga",
        "Alto",
        "Ciaz",
        "Fronx",
        "Grand Vitara",
      ],
      Hyundai: [
        "i20",
        "Creta",
        "Venue",
        "Verna",
        "Grand i10 Nios",
        "Aura",
        "Alcazar",
        "Exter",
      ],
      Honda: ["City", "Amaze", "Elevate", "Civic", "Jazz"],
      Tata: ["Nexon", "Punch", "Harrier", "Tiago", "Altroz", "Safari", "Tigor"],
      Mahindra: [
        "Thar",
        "XUV700",
        "Scorpio-N",
        "Scorpio Classic",
        "Bolero",
        "XUV300",
      ],
      Toyota: [
        "Fortuner",
        "Innova Crysta",
        "Innova Hycross",
        "Glanza",
        "Camry",
      ],
      Kia: ["Seltos", "Sonet", "Carens", "EV6"],
      Volkswagen: ["Virtus", "Taigun", "Polo"],
      Skoda: ["Slavia", "Kushaq", "Octavia"],
    },
  },
  motorcycle: {
    label: "Motorcycle",
    makes: {
      Hero: [
        "Splendor Plus",
        "HF Deluxe",
        "Passion Pro",
        "Glamour",
        "Xpulse 200 4V",
        "Karizma XMR",
      ],
      TVS: [
        "Apache RTR 160",
        "Apache RTR 200 4V",
        "Raider 125",
        "Ronin",
        "Sport",
        "Star City Plus",
      ],
      Honda: ["Shine 125", "Unicorn", "SP 125", "CB350", "Hornet 2.0"],
      Bajaj: [
        "Pulsar 150",
        "Pulsar NS200",
        "Avenger 220",
        "Platina 110",
        "Dominar 400",
      ],
      "Royal Enfield": [
        "Classic 350",
        "Bullet 350",
        "Hunter 350",
        "Meteor 350",
        "Himalayan 450",
        "Continental GT 650",
      ],
      Yamaha: ["MT-15 V2", "R15 V4", "FZ-S V4", "FZ-X"],
      KTM: ["Duke 200", "Duke 390", "RC 200", "Adventure 390"],
      Suzuki: ["Gixxer 150", "Gixxer SF 250"],
    },
  },
  scooter: {
    label: "Scooter",
    makes: {
      Honda: ["Activa 6G", "Activa 125", "Dio", "Dio 125"],
      TVS: ["Jupiter", "Jupiter 125", "Ntorq 125", "Scooty Zest", "iQube"],
      Suzuki: ["Access 125", "Burgman Street", "Avenis"],
      Hero: ["Maestro Edge 125", "Pleasure Plus", "Xoom 110"],
      Yamaha: ["RayZR 125", "Fascino 125", "Aerox 155"],
      Ather: ["450X", "450S", "Rizta"],
      Ola: ["S1 Pro", "S1 Air", "S1 X"],
    },
  },
  commercial: {
    label: "Commercial",
    makes: {
      "Tata Motors": [
        "Ace Gold",
        "Intra V30",
        "Yodha Pickup",
        "407 Gold",
        "Prima",
      ],
      "Ashok Leyland": ["Dost+", "BADA DOST", "Partner", "Ecomet"],
      Mahindra: [
        "Bolero Maxx Pik-Up",
        "Supro Profit Truck",
        "Jeeto",
        "Treo Zor",
      ],
      Eicher: ["Pro 2049", "Pro 3015", "Pro 2110"],
    },
  },
};

const CATEGORY_OPTIONS = Object.values(VEHICLE_DATA).map(({ label }) => label);
const YEARS_OPTIONS = Array.from({ length: 10 }, (_, i) => String(2017 + i));

const normalizeValue = (value) => String(value ?? "").trim();

const findMatchingKey = (value, options = [], getOptionValue = (option) => option) => {
  const normalized = normalizeValue(value).toLowerCase();

  if (!normalized || !options.length) return null;

  return (
    options.find(
      (option) =>
        normalizeValue(getOptionValue(option)).toLowerCase() === normalized,
    ) || null
  );
};

// Status styling for the result card
const STATUS = {
  E20_CERTIFIED: {
    label: "E20 Certified",
    Icon: ShieldCheck,
    text: "text-emerald-300",
    bar: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    glow: "from-emerald-500/20",
    border: "border-emerald-500/30",
  },
  NOT_E20_CERTIFIED: {
    label: "Not E20 Certified",
    Icon: ShieldX,
    text: "text-rose-300",
    bar: "bg-rose-400",
    badge: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    glow: "from-rose-500/20",
    border: "border-rose-500/30",
  },
  UNCERTAIN: {
    label: "Uncertain",
    Icon: ShieldQuestion,
    text: "text-amber-300",
    bar: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    glow: "from-amber-500/20",
    border: "border-amber-500/30",
  },
};

// Accepts "high" | "medium" | "low", 0-1, or 0-100 and returns 0-100
const confidenceToPercent = (value) => {
  if (typeof value === "number") return value <= 1 ? value * 100 : value;
  const v = String(value ?? "").toLowerCase();
  if (v.includes("high")) return 90;
  if (v.includes("med")) return 60;
  if (v.includes("low")) return 30;
  const n = parseFloat(v);
  if (!Number.isNaN(n)) return n <= 1 ? n * 100 : n;
  return 0;
};

// E20 result card shown below the form
const E20ResultCard = ({ ai }) => {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    setFilled(false);
    const t = setTimeout(() => setFilled(true), 80);
    return () => clearTimeout(t);
  }, [ai]);

  if (!ai) return null;

  const s = STATUS[ai.status] ?? STATUS.UNCERTAIN;
  const pct = Math.max(0, Math.min(100, confidenceToPercent(ai.confidence)));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${s.border} bg-slate-900/70 backdrop-blur`}
    >
      {/* Soft status glow */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b ${s.glow} to-transparent`}
      />

      <div className="relative space-y-5 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <Sparkles className="h-4 w-4 text-amber-400" />
          AI compatibility check
        </div>

        {/* Verdict */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800/80 ring-1 ring-inset ring-slate-700">
            <s.Icon className={`h-8 w-8 ${s.text}`} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className={`text-2xl font-bold leading-tight ${s.text}`}>
              {s.label}
            </p>
            <p className="text-sm text-slate-400">
              E20 fuel (20% ethanol blend)
            </p>
          </div>
        </div>

        {/* Confidence meter */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="h-4 w-4" />
              Confidence
            </span>
            <span className="font-semibold text-slate-100">
              {typeof ai.confidence === "string"
                ? ai.confidence
                : `${Math.round(pct)}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${s.bar} transition-[width] duration-700 ease-out motion-reduce:transition-none`}
              style={{ width: filled ? `${pct}%` : "0%" }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Confidence"
            />
          </div>
        </div>

        {/* Reason */}
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Why this result
          </p>
          <p className="text-sm leading-relaxed text-slate-300">{ai.reason}</p>
        </div>

        {/* Evidence */}
        {ai.evidence_type && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FileSearch className="h-4 w-4" />
            <span>Based on</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.badge}`}
            >
              {String(ai.evidence_type).replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
        )}

        {/* Recommendation */}
        {ai.recommendation && (
          <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                What to do next
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                {ai.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Searchable Input component with dynamic autocomplete suggestions
const SearchableInput = ({
  name,
  label,
  stepNumber,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Filter options based on user input
  const filteredOptions = options.filter((opt) =>
    String(opt)
      .toLowerCase()
      .includes(String(value || "").toLowerCase()),
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name, value: String(val) } });
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 pl-1 block">
        {stepNumber}. {label}
      </label>
      <div className="relative ">
        <input
          type="text"
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-text disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none placeholder:text-slate-500"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4 opacity-70" />
        </div>

        {isOpen && !disabled && filteredOptions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 text-sm text-slate-200 divide-y divide-slate-700/50 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredOptions.map((opt) => {
              const isSelected =
                String(value).toLowerCase() === String(opt).toLowerCase();
              return (
                <li
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                      : ""
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const CompatibilityChecker = () => {
  const [form, setForm] = useState({
    vehicleType: "",
    make: "",
    model: "",
    year: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getVehicleKey = (typeVal) => {
    const vehicleKeys = Object.keys(VEHICLE_DATA);

    return (
      findMatchingKey(typeVal, vehicleKeys, (key) => key) ||
      findMatchingKey(typeVal, vehicleKeys, (key) => VEHICLE_DATA[key].label)
    );
  };

  const currentVehicleKey = getVehicleKey(form.vehicleType);

  const availableMakes = currentVehicleKey
    ? Object.keys(VEHICLE_DATA[currentVehicleKey].makes)
    : [];

  const getMakeKey = (makeVal) => findMatchingKey(makeVal, availableMakes);

  const currentMakeKey = getMakeKey(form.make);

  // Dynamically compute available Models based on chosen Make & Category
  const availableModels =
    currentVehicleKey && currentMakeKey
      ? VEHICLE_DATA[currentVehicleKey].makes[currentMakeKey] || []
      : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset dependent fields when higher hierarchy values change
    if (name === "vehicleType") {
      setForm({ vehicleType: value, make: "", model: "", year: "" });
    } else if (name === "make") {
      setForm((prev) => ({ ...prev, make: value, model: "", year: "" }));
    } else if (name === "model") {
      setForm((prev) => ({ ...prev, model: value, year: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get("/vehicles/check", { params: form });
      const payload = res?.data;

      if (payload?.aiResponse) {
        setResult(payload);
        return;
      }

      if (payload && typeof payload.status === "string") {
        setResult({ aiResponse: payload });
        return;
      }

      setResult({
        status: "error",
        message: "Failed to check vehicle compatibility. Please try again.",
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to check vehicle compatibility. Please check connection and try again.";

      setResult({
        status: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ vehicleType: "", make: "", model: "", year: "" });
    setResult(null);
    setLoading(false);
  };

  const isFormComplete =
    form.vehicleType.trim() &&
    form.make.trim() &&
    form.model.trim() &&
    form.year.trim();

  return (
    <Hero>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-20 pb-16">
        {/* Main Card */}
        <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-emerald-950/20 ">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-10">
            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                <Fuel className="w-3.5 h-3.5" />
                E20 Fuel Verification
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Check Your Engine's Compatibility
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Type or select your vehicle details below to verify ethanol
                blend safety.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleCheck} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Field 1: Vehicle Category */}
                <SearchableInput
                  name="vehicleType"
                  label="Vehicle Category"
                  stepNumber="1"
                  value={form.vehicleType}
                  onChange={handleChange}
                  options={CATEGORY_OPTIONS}
                  placeholder="Type or select category (e.g. Car)"
                />

                {/* Field 2: Make / Manufacturer */}
                <SearchableInput
                  name="make"
                  label="Manufacturer / Make"
                  stepNumber="2"
                  value={form.make}
                  onChange={handleChange}
                  options={availableMakes}
                  placeholder="Type or select brand (e.g. Maruti)"
                  disabled={!form.vehicleType.trim()}
                />

                {/* Field 3: Model */}
                <SearchableInput
                  name="model"
                  label="Model"
                  stepNumber="3"
                  value={form.model}
                  onChange={handleChange}
                  options={availableModels}
                  placeholder="Type or select model (e.g. Swift)"
                  disabled={!form.make.trim()}
                />

                {/* Field 4: Manufacturing Year */}
                <SearchableInput
                  name="year"
                  label="Manufacturing Year"
                  stepNumber="4"
                  value={form.year}
                  onChange={handleChange}
                  options={YEARS_OPTIONS}
                  placeholder="Type or select year (e.g. 2023)"
                  disabled={!form.model.trim()}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                {(form.vehicleType || result) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto h-12 px-5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !isFormComplete}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span className="cursor-pointer">Check Compatibility</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error message */}
            {result?.status === "error" && (
              <div
                role="alert"
                className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                <p className="text-sm leading-relaxed text-rose-100">
                  {result.message}
                </p>
              </div>
            )}

            {/* E20 Result */}
            {result?.aiResponse && (
              <div className="mt-8">
                <E20ResultCard ai={result.aiResponse} />
              </div>
            )}
          </div>
        </div>
      </main>
    </Hero>
  );
};

export default CompatibilityChecker;