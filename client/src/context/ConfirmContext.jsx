import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger", // "danger" | "warning" | "info"
    resolve: null,
  });

  const confirm = useCallback(({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const getVariantStyles = () => {
    switch (confirmState.variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/10 border-red-500/20 text-red-400",
          btnBg: "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          btnBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50",
        };
      case "info":
      default:
        return {
          iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          btnBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirmation Modal Overlay */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative animate-scaleUp"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Cross Button */}
            <button
              onClick={() => handleClose(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 pt-1 pr-6">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer ${variantStyles.btnBg}`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};