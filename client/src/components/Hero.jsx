import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const Hero = ({ children }) => {
  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-base-900 text-white py-12 lg:py-0">
      {/* 1. Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105"
        >
          <source src="/herotemp.webm" type="video/webm" />
        </video>

        {/* Dark Overlays for Readability */}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* 2. Hero Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
          {/* Left Column: Text & Buttons */}
          <div className="space-y-6 text-left pt-30">
            {/* Minimal Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Environmental Monitoring
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
              Know before <br className="hidden sm:inline" />
              <span className="text-emerald-400">you fuel up.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200/90 max-w-xl font-normal leading-relaxed">
              Is your vehicle E20 safe? Check compatibility instantly, report
              real issues, and explore crowdsourced complaint data from drivers
              across India.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/report"
                className="btn btn-emerald bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold border-none px-6 rounded-xl shadow-lg transition-all gap-2"
              >
                <span>Report an Issue</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <Link
                to="/heatmap"
                className="btn btn-ghost text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6"
              >
                Explore Live Map
              </Link>
            </div>
          </div>

          {/* Right Column: Full-Width & Responsive Form Slot */}
          {children && (
            <div className="lg:col-span-6 w-full flex flex-col justify-center items-center pt-36 lg:pb-20">
              <div className="w-full">{children}</div>
            </div>
          )}
      </div>
    </section>
  );
};

export default Hero;
