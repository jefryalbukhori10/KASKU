import { Link } from "react-router-dom";
import { FaWallet, FaArrowRight } from "react-icons/fa";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

import { motion } from "framer-motion";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    {
      title: "Kas Madin",
      desc: "Laporan keuangan Madin",
      link: "/kas-madin",
      color: "from-emerald-500 to-emerald-600",
      allowed:
        user &&
        (user.email === "admin@madin.com" ||
          user.email === "jefryalbukhori23@gmail.com"),
    },

    {
      title: "Kas Banjari",
      desc: "Laporan keuangan Banjari",
      link: "/kas-banjari",
      color: "from-blue-500 to-indigo-600",
      allowed:
        user &&
        (user.email === "admin@banjari.com" ||
          user.email === "jefryalbukhori23@gmail.com"),
    },

    {
      title: "Kas UPZIS",
      desc: "Laporan keuangan UPZIS",
      link: "/kas-upzis",
      color: "from-orange-500 to-amber-500",
      allowed:
        user &&
        (user.email === "admin@upzis.com" ||
          user.email === "jefryalbukhori23@gmail.com"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />

        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 py-10 md:py-16">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white shadow-lg border border-black/5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#111827] to-[#1f2937] flex items-center justify-center text-white text-lg">
              💎
            </div>

            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111827]">
                Dashboard Kas
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Sistem laporan keuangan organisasi
              </p>
            </div>
          </div>
        </motion.div>

        {/* GRID MENU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems
            .filter((item) => item.allowed)
            .map((item, index) => (
              <motion.div
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.08,
                }}
              >
                <Link
                  to={item.link}
                  className="group relative overflow-hidden rounded-[34px] bg-white border border-black/5 shadow-[0_15px_45px_rgba(0,0,0,0.05)] p-6 block hover:-translate-y-1 transition-all duration-300"
                >
                  {/* GLOW */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br ${item.color}`}
                  />

                  {/* CONTENT */}
                  <div className="relative z-10">
                    {/* ICON */}
                    <div
                      className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <FaWallet size={26} />
                    </div>

                    {/* TEXT */}
                    <div className="mt-6">
                      <h2 className="text-2xl font-semibold text-[#111827] group-hover:text-white transition">
                        {item.title}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed group-hover:text-white/80 transition">
                        {item.desc}
                      </p>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-8 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 group-hover:text-white transition">
                        Buka Halaman
                      </span>

                      <div className="w-11 h-11 rounded-2xl bg-[#f3f4f6] group-hover:bg-white/20 flex items-center justify-center transition">
                        <FaArrowRight className="text-[#111827] group-hover:text-white transition" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-14 text-center"
        >
          <p className="text-sm text-gray-500">
            Sistem Keuangan Organisasi • Modern Dashboard UI by{" "}
            <a
              href="https://jefryalbukhori.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Jefry Albukhori
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
