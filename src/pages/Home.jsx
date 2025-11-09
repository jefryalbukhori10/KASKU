import { Link } from "react-router-dom";
import { FaListUl, FaHistory } from "react-icons/fa";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* 🌈 Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 animate-gradient-x"></div>

      {/* ✨ Overlay Glass Effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* 🔥 Content */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {/* Card 1 */}
        {user &&
          (user.email === "admin@madin.com" ||
            user.email === "jefryalbukhori23@gmail.com") && (
            <Link
              to="/kas-madin"
              className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center py-16 hover:scale-105"
            >
              <FaListUl className="text-5xl text-blue-300 mb-4 group-hover:text-white transition-colors" />
              <h2 className="text-xl font-semibold text-white tracking-wide">
                KAS MADIN
              </h2>
            </Link>
          )}

        {/* Card 2 */}
        {user &&
          (user.email === "admin@banjari.com" ||
            user.email === "jefryalbukhori23@gmail.com") && (
            <Link
              to="/kas-banjari"
              className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center py-16 hover:scale-105"
            >
              <FaHistory className="text-5xl text-green-300 mb-4 group-hover:text-white transition-colors" />
              <h2 className="text-xl font-semibold text-white tracking-wide">
                KAS BANJARI
              </h2>
            </Link>
          )}

        {/* Card 3 */}
        {user &&
          (user.email === "admin@upzis.com" ||
            user.email === "jefryalbukhori23@gmail.com") && (
            <Link
              to="/kas-upzis"
              className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center py-16 hover:scale-105"
            >
              <FaHistory className="text-5xl text-yellow-300 mb-4 group-hover:text-white transition-colors" />
              <h2 className="text-xl font-semibold text-white tracking-wide">
                KAS UPZIS
              </h2>
            </Link>
          )}
      </div>
    </div>
  );
}
