import { supabase } from "../config/supabase.js";

/**
 * Middleware to verify Supabase JWT token from Authorization header.
 * Attaches user and profile to req.user and req.profile.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Akses ditolak. Token autentikasi tidak ditemukan." });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Sesi tidak valid atau telah kadaluarsa." });
    }

    // Get user profile including role and status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Profil pengguna tidak ditemukan." });
    }

    if (profile.status === "inactive") {
      return res.status(403).json({ error: "Akun Anda berstatus nonaktif. Silakan hubungi Admin." });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal pada verifikasi autentikasi." });
  }
}

/**
 * Middleware to enforce Admin role.
 */
export function requireAdmin(req, res, next) {
  if (req.profile?.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak. Fitur ini hanya untuk Admin." });
  }
  next();
}

/**
 * Middleware to enforce Operator or Admin role.
 */
export function requireOperatorOrAdmin(req, res, next) {
  if (req.profile?.role !== "admin" && req.profile?.role !== "operator") {
    return res.status(403).json({ error: "Akses ditolak. Hak akses tidak mencukupi." });
  }
  next();
}
