import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      navigate("/");
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Periksa kembali email dan password Anda!", "warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-[#111827] rounded-full animate-spin"></div>

            <h3 className="mt-4 text-lg font-semibold text-[#111827]">
              Sedang Masuk
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Mohon tunggu sebentar...
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center p-4">
        <div
          className="
                w-full
                max-w-6xl
                bg-white
                rounded-[40px]
                overflow-hidden
                shadow-2xl
                grid
                md:grid-cols-2
              "
        >
          <div
            className="
  hidden
  md:flex
  flex-col
  justify-center
  bg-[#111827]
  text-white
  p-12
"
          >
            <div className="text-6xl mb-6">🏡</div>

            <h1 className="text-4xl font-bold leading-tight">
              Sistem Informasi Keuangan
            </h1>

            <p className="mt-4 text-gray-300 leading-relaxed">
              Sistem informasi keuangan yang membantu pengelolaan kas organisasi
              menjadi lebih transparan, rapi, dan mudah diakses.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3">
                ✅ Kelola transaksi kas
              </div>

              <div className="flex items-center gap-3">
                ✅ Export Excel & PDF
              </div>

              <div className="flex items-center gap-3">
                ✅ Laporan real-time
              </div>
            </div>
          </div>
          <div
            className="
  flex
  items-center
  justify-center
  p-6
  md:p-12
"
          >
            <div
              className="
    w-full
    max-w-md
  "
            >
              <div className="text-center mb-8">
                <div
                  className="
                                w-20
                                h-20
                                mx-auto
                                rounded-3xl
                                bg-[#111827]
                                flex
                                items-center
                                justify-center
                                text-white
                                text-3xl
                                font-bold
                                shadow-lg
                              "
                >
                  🏡
                </div>

                <h1 className="text-3xl font-bold text-[#111827] mt-5">
                  Kas Bersih Dusun
                </h1>

                <p className="text-gray-500 mt-2 text-sm">
                  Sistem Informasi Keuangan Dusun
                </p>
              </div>
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">
                  Silakan masuk menggunakan akun admin
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Masukkan email"
                    className="
w-full
border
border-gray-200
rounded-xl
px-4
py-3
bg-gray-50
focus:ring-2
focus:ring-[#111827]
focus:border-transparent
outline-none
transition
"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      className="
w-full
border
border-gray-200
rounded-xl
px-4
py-3
bg-gray-50
focus:ring-2
focus:ring-[#111827]
focus:border-transparent
outline-none
transition
"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200"
                >
                  Login
                </button>
              </form>
              <div className="text-center text-gray-500 text-sm mt-4">
                © {new Date().getFullYear()} Kas Bersih Dusun
                <div className="mt-1 text-xs text-gray-400">Versi 1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
