import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Basically createContext is used here so that we donot have to insert onAuthStateChanged() in every component
// { children } is all the components, under Authcontext
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // logged-in user or null
  const [loading, setLoading] = useState(true); // true until first check completes
  const [error, setError] = useState(null);

  useEffect(() => {
    // listens for login/logout/refresh, keeps user state synced
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setError(null);
        setLoading(false);
      },
      (authError) => {
        console.error("Firebase auth state error:", authError);
        setUser(null);
        setError(authError);
        setLoading(false);
      },
    );
    return unsub; // cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}; // hook to access auth anywhere



