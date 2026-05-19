// src/pages/KasMadin.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  orderBy,
  limit,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { FaWhatsapp } from "react-icons/fa";

export default function KasMadin() {
  const [kasList, setKasList] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [formData, setFormData] = useState({
    tanggal: "",
    keterangan: "",
    masuk: 0,
    keluar: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    fetchKasData();
    return () => unsubscribe();
  }, []);

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  const fetchKasData = async () => {
    const q = query(collection(db, "kas_madin"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
      const item = doc.data();
      return {
        id: doc.id,
        ...item,
        tanggal: item.tanggal?.toDate ? item.tanggal.toDate() : new Date(),
      };
    });

    // Hitung total saldo
    const latestSaldo = data.length > 0 ? data[0].saldo : 0;
    setTotalSaldo(latestSaldo);
    setKasList(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "masuk" || name === "keluar") {
      const numeric = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numeric ? +numeric : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const q = query(
        collection(db, "kas_madin"),
        orderBy("timestamp", "desc"),
        limit(1),
      );
      const kasSnapshot = await getDocs(q);

      let saldoTerakhir = 0;
      if (!kasSnapshot.empty) {
        saldoTerakhir = kasSnapshot.docs[0].data().saldo || 0;
      }

      const masuk = parseInt(formData.masuk) || 0;
      const keluar = parseInt(formData.keluar) || 0;
      const saldoBaru = saldoTerakhir + masuk - keluar;

      await addDoc(collection(db, "kas_madin"), {
        tanggal: Timestamp.fromDate(new Date(formData.tanggal)),
        keterangan: formData.keterangan,
        masuk,
        keluar,
        saldo: saldoBaru,
        timestamp: Timestamp.now(),
      });

      setShowModal(false);
      setFormData({ tanggal: "", keterangan: "", masuk: 0, keluar: 0 });
      fetchKasData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, "kas_madin", id));
      fetchKasData();
      Swal.fire("Berhasil", "Data berhasil dihapus", "success");
    }
  };

  const handleSendWhatsApp = () => {
    const fiveLatest = kasList.slice(0, 5);

    let message = `📊 LAPORAN KAS MADIN\n\n`;

    message += `💰 Saldo Saat Ini\n`;
    message += `${formatRupiah(totalSaldo)}\n\n`;

    message += `📌 5 Transaksi Terakhir\n\n`;

    fiveLatest.forEach((item, idx) => {
      const tanggal = item.tanggal
        ? item.tanggal.toLocaleDateString("id-ID")
        : "-";

      const labels = {
        Tanggal: tanggal,
        Keterangan: item.keterangan || "-",
        Masuk: formatRupiah(item.masuk),
        Keluar: formatRupiah(item.keluar),
        Saldo: formatRupiah(item.saldo),
      };

      message += `${idx + 1})\n`;

      Object.entries(labels).forEach(([key, value]) => {
        message += `${key.padEnd(10)} : ${value}\n`;
      });

      message += `-----------------------------\n`;
    });

    message += `\n🌐 Lihat laporan lengkap:\n`;
    message += `https://kasku.vercel.app/kas-madin`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  // Pagination
  const totalPages = Math.ceil(kasList.length / perPage);
  const displayedData = kasList.slice((page - 1) * perPage, page * perPage);

  // Data untuk grafik
  const chartData = kasList
    .slice(0, 10)
    .reverse()
    .map((item, index) => {
      const isMasuk = Number(item.masuk) > 0;
      const isKeluar = Number(item.keluar) > 0;

      return {
        id: index,

        name: `${item.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })} ${index}`,

        label: item.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),

        Masuk: isMasuk ? Number(item.masuk) : undefined,

        Keluar: isKeluar ? Number(item.keluar) : undefined,
      };
    });

  console.log(chartData);

  // Ringkasan bulan ini
  const thisMonth = new Date().getMonth();
  const pemasukanBulan = kasList
    .filter((k) => k.tanggal.getMonth() === thisMonth)
    .reduce((a, b) => a + (b.masuk || 0), 0);
  const pengeluaranBulan = kasList
    .filter((k) => k.tanggal.getMonth() === thisMonth)
    .reduce((a, b) => a + (b.keluar || 0), 0);

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-32">
      {/* ================= HEADER ================= */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">
              Laporan Kas
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Keuangan Organisasi Madin
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center">
            <span className="text-lg">💰</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-5">
        {/* ================= HERO ================= */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[34px] bg-[#111827] text-white shadow-[0_25px_80px_rgba(17,24,39,0.25)]"
        >
          {/* GLOW */}
          <div className="absolute -top-20 -right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Saldo Kas</p>

                <h2 className="text-4xl md:text-5xl font-semibold mt-3 tracking-tight">
                  {formatRupiah(totalSaldo)}
                </h2>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg">
                <p className="text-xs text-gray-300">Update</p>

                <p className="font-medium text-sm mt-1">Real Time</p>
              </div>
            </div>

            {/* MINI CARD */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">Pemasukan</p>

                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mt-4">
                  {formatRupiah(pemasukanBulan)}
                </h3>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">Pengeluaran</p>

                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mt-4">
                  {formatRupiah(pengeluaranBulan)}
                </h3>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= GRAFIK ================= */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 bg-white rounded-[32px] border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-5"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Statistik Keuangan
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Aktivitas kas terbaru
              </p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#f8fafc] text-sm text-gray-600 border border-black/5">
              10 Transaksi
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barCategoryGap={18}>
              <defs>
                <linearGradient id="premiumMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>

                <linearGradient id="premiumKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="name"
                tickFormatter={(value, index) =>
                  chartData[index]?.label || value
                }
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />

              <YAxis hide />

              <Tooltip
                formatter={(value) => formatRupiah(value)}
                contentStyle={{
                  borderRadius: 18,
                  border: "none",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                }}
              />

              <Legend />

              <Bar
                dataKey="Masuk"
                fill="url(#premiumMasuk)"
                radius={[14, 14, 0, 0]}
                maxBarSize={26}
                isAnimationActive={false}
              />

              <Bar
                dataKey="Keluar"
                fill="url(#premiumKeluar)"
                radius={[14, 14, 0, 0]}
                maxBarSize={26}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ================= TRANSAKSI ================= */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Riwayat Transaksi
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Semua aktivitas kas organisasi
              </p>
            </div>

            {/* BUTTON WHATSAPP */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSendWhatsApp}
              className="shrink-0 h-12 px-4 rounded-2xl bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] flex items-center gap-2 font-medium"
            >
              <FaWhatsapp size={20} />

              <span className="hidden md:block">Kirim</span>
            </motion.button>
          </div>

          <div className="space-y-4">
            {displayedData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.985 }}
                className="group bg-white rounded-[30px] border border-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* LEFT */}
                    <div className="flex gap-4 flex-1">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg ${
                          item.masuk ? "bg-[#10b981]" : "bg-[#ef4444]"
                        }`}
                      >
                        {item.masuk ? "↓" : "↑"}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827] text-[15px] leading-tight">
                          {item.keterangan}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="px-3 py-1 rounded-full bg-[#f3f4f6] text-gray-600 text-xs">
                            {item.tanggal.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.masuk
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {item.masuk ? "Kas Masuk" : "Kas Keluar"}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-gray-400">
                            Saldo Setelah Transaksi
                          </p>

                          <p className="text-sm font-medium text-gray-700 mt-1">
                            {formatRupiah(item.saldo)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="text-right">
                      <p
                        className={`text-lg md:text-xl font-semibold tracking-tight ${
                          item.masuk ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {item.masuk
                          ? `+ ${formatRupiah(item.masuk)}`
                          : `- ${formatRupiah(item.keluar)}`}
                      </p>

                      {user &&
                        (user.email === "admin@madin.com" ||
                          user.email === "jefryalbukhori23@gmail.com") && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="mt-5 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="flex justify-center items-center gap-3 mt-7">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 rounded-2xl bg-white border border-black/5 shadow-sm text-sm disabled:opacity-40"
            >
              Sebelumnya
            </button>

            <div className="px-5 py-2.5 rounded-2xl bg-[#111827] text-white text-sm font-medium shadow-lg">
              {page} / {totalPages}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 rounded-2xl bg-white border border-black/5 shadow-sm text-sm disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* ================= FLOATING BUTTON ================= */}
      {user &&
        (user.email === "admin@madin.com" ||
          user.email === "jefryalbukhori23@gmail.com") && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowModal(true)}
            className="fixed bottom-6 right-5 z-50 w-16 h-16 rounded-full bg-[#111827] text-white shadow-[0_20px_50px_rgba(17,24,39,0.3)] flex items-center justify-center"
          >
            <FiPlus size={26} />
          </motion.button>
        )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-t-[34px] md:rounded-[34px] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">
                  Tambah Transaksi
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Tambahkan data kas baru
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-11 h-11 rounded-2xl bg-[#f3f4f6] flex items-center justify-center"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 outline-none focus:ring-2 focus:ring-[#111827]"
              />

              <input
                type="text"
                name="keterangan"
                placeholder="Keterangan transaksi"
                value={formData.keterangan}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 outline-none focus:ring-2 focus:ring-[#111827]"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="masuk"
                  placeholder="Kas Masuk"
                  value={
                    formData.masuk
                      ? new Intl.NumberFormat("id-ID").format(formData.masuk)
                      : ""
                  }
                  onChange={handleInputChange}
                  className="rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="text"
                  name="keluar"
                  placeholder="Kas Keluar"
                  value={
                    formData.keluar
                      ? new Intl.NumberFormat("id-ID").format(formData.keluar)
                      : ""
                  }
                  onChange={handleInputChange}
                  className="rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#111827] text-white font-medium shadow-lg hover:opacity-95 transition"
              >
                Simpan Transaksi
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
