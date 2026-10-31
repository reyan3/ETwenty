import { Link } from "react-router-dom"
const ErrorPage = () => {
  return (
    <div>
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center text-slate-200">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                      Error 404
                    </p>
                    <h1 className="mt-2 text-3xl font-black text-white">
                      Page not found
                    </h1>
                    <p className="mt-3 text-sm text-slate-400">
                      The page you’re looking for doesn’t exist or may have moved.
                    </p>
                    <Link
                      to="/"
                      className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300"
                    >
                      Go to home
                    </Link>
                  </main>
    </div>
  )
}

export default ErrorPage
