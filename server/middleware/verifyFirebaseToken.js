import { auth } from "../config/firebaseAdmin.js";

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return res.status(401).json({ error: "No token provided" });
  }

  const idToken = authHeader.replace(/^Bearer\s+/i, "");

  try {
    const decoded = await auth.verifyIdToken(idToken);

    req.firebaseUid = decoded.uid;
    req.email = decoded.email;
    req.emailVerified = decoded.email_verified === true;

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default verifyFirebaseToken;