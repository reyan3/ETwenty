import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

const Footer = () => {
  return (
    <footer  className="relative z-1000 w-full bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800 py-6 " >
      
      {/* Subtle Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-8 pb-10 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                E
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Twenty<span className="text-emerald-400">.</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Know before you fuel.
            </p>

            <div className="inline-flex items-center gap-2 text-slate-400 text-xs pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Community Verified Data</span>
            </div>
          </div>

          {/* Column 1: Navigation Links */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors">
                  Report Issue
                </Link>
              </li>
              <li>
                <Link to="/heatmap" className="hover:text-emerald-400 transition-colors">
                  Live Heatmap
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-emerald-400 transition-colors">
                  Browse Reports
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Social Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="flex items-center gap-1 text-center sm:text-left">
            © {new Date().getFullYear()} ETwenty.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Twitter"
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-slate-950 transition-all text-slate-300"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>

            <a
              href="https://github.com/reyan3"
              target='_blank'
              aria-label="GitHub"
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-slate-950 transition-all text-slate-300"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer