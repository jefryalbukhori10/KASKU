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
import DataTable from "react-data-table-component";
import { FiPlus, FiTrash, FiTrash2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";

export default function KasMadin() {
  const [kasList, setKasList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null); // 🔑 simpan user login
  useEffect(() => {
    fetchKasData();

    // cek status login
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    tanggal: "",
    keterangan: "",
    masuk: 0,
    keluar: 0,
  });

  const [totalSaldo, setTotalSaldo] = useState(0);

  useEffect(() => {
    fetchKasData();
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const fetchKasData = async () => {
    const q = query(collection(db, "kas_madin"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
      const item = doc.data();
      return {
        id: doc.id,
        ...item,
        tanggal: item.tanggal?.toDate ? item.tanggal.toDate() : null,
        saldo: item.saldo,
      };
    });

    const latestSaldo = data.length > 0 ? data[0].saldo : 0;
    setTotalSaldo(latestSaldo);
    setKasList(data);
  };

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: name === "masuk" || name === "keluar" ? Number(value) : value,
  //   }));
  // };
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "masuk" || name === "keluar") {
      // Hapus semua karakter non-digit
      const numericValue = value.replace(/\D/g, "");

      // Simpan angka murni
      const numberValue = numericValue ? parseInt(numericValue, 10) : 0;

      setFormData((prev) => ({
        ...prev,
        [name]: numberValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ambil saldo terakhir berdasarkan timestamp terbaru
      const q = query(
        collection(db, "kas_madin"),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const kasSnapshot = await getDocs(q);

      let saldoTerakhir = 0;

      if (!kasSnapshot.empty) {
        const lastEntry = kasSnapshot.docs[0].data();
        saldoTerakhir = lastEntry.saldo || 0;
      }

      // Hitung saldo baru
      const masuk = parseInt(formData.masuk) || 0;
      const keluar = parseInt(formData.keluar) || 0;
      const saldoBaru = saldoTerakhir + masuk - keluar;

      // Simpan data baru ke Firebase
      await addDoc(collection(db, "kas_madin"), {
        tanggal: Timestamp.fromDate(new Date(formData.tanggal)), // tanggal input manual
        keterangan: formData.keterangan,
        masuk,
        keluar,
        saldo: saldoBaru,
        timestamp: Timestamp.now(), // waktu sekarang
      });

      // Reset form
      setShowModal(false);
      setFormData({ tanggal: "", keterangan: "", masuk: 0, keluar: 0 });
      fetchKasData();
    } catch (error) {
      console.error("Error menambahkan kas:", error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        // Ambil dokumen yang akan dihapus
        const docRef = doc(db, "kas_madin", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          Swal.fire("Gagal", "Data tidak ditemukan.", "error");
          return;
        }

        // Hapus dokumen
        await deleteDoc(docRef);

        // Ambil semua data kas dan urutkan naik berdasarkan timestamp
        const q = query(
          collection(db, "kas_madin"),
          orderBy("timestamp", "asc")
        );
        const snapshot = await getDocs(q);

        let saldo = 0;

        // Update saldo di setiap dokumen
        for (const d of snapshot.docs) {
          const data = d.data();
          const masuk = data.masuk || 0;
          const keluar = data.keluar || 0;

          saldo += masuk - keluar;

          await updateDoc(doc(db, "kas_madin", d.id), {
            saldo: saldo,
          });
        }

        Swal.fire("Berhasil", "Data berhasil dihapus.", "success");
        fetchKasData();
      } catch (error) {
        console.error("Gagal menghapus atau memperbarui saldo:", error);
        Swal.fire("Gagal", "Terjadi kesalahan saat menghapus data.", "error");
      }
    }
  };

  const handleSendWhatsApp = () => {
    const fiveLatest = kasList.slice(0, 5); // ambil 5 transaksi terakhir

    let message = `📊 *Laporan Kas Madin*\n\n💰 Saldo saat ini: *${formatRupiah(
      totalSaldo
    )}*\n\n📝 *5 Transaksi Terakhir:*\n`;

    fiveLatest.forEach((item, idx) => {
      const tanggal = item.tanggal
        ? item.tanggal.toLocaleDateString("id-ID")
        : "-";
      message += `\n${idx + 1}. 📅 ${tanggal}\n   ✏️ ${
        item.keterangan
      }\n   ➕ Masuk: ${formatRupiah(item.masuk)}\n   ➖ Keluar: ${formatRupiah(
        item.keluar
      )}\n   💳 Saldo: ${formatRupiah(item.saldo)}\n----------------------`;
    });

    message += `\n\n🔗 Lihat lebih lengkap di:\nhttps://kasku.vercel.app/kas-madin`;

    // encode pesan supaya terbaca di URL
    const encodedMessage = encodeURIComponent(message);

    // ganti nomor tujuan WA sesuai kebutuhan, atau biarkan kosong agar user memilih kontak
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const columns = [
    {
      name: "No",
      selector: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Tanggal",
      selector: (row) =>
        row.tanggal ? row.tanggal.toLocaleDateString("id-ID") : "-",
      sortable: true,
    },
    {
      name: "Keterangan",
      selector: (row) => row.keterangan,
      sortable: true,
    },
    {
      name: "Masuk",
      selector: (row) => formatRupiah(row.masuk),
      sortable: true,
      right: true,
    },
    {
      name: "Keluar",
      selector: (row) => formatRupiah(row.keluar),
      sortable: true,
      right: true,
    },
    {
      name: "Saldo",
      selector: (row) => formatRupiah(row.saldo),
      sortable: true,
      right: true,
    },
    {
      name: "Aksi",
      cell: (row) =>
        user ? (
          <button
            onClick={() => handleDelete(row.id)}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition duration-200"
            title="Hapus"
          >
            <FiTrash2 size={10} />
          </button>
        ) : (
          <span className="text-gray-400 italic text-sm">-</span>
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#3a3f53ff",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "14px",
      },
    },
    rows: {
      style: {
        fontSize: "14px",
        minHeight: "48px",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #e5e7eb",
        padding: "10px",
      },
    },
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto mt-10 px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 bg-white rounded-lg shadow-md p-4">
          <div className="text-lg font-semibold text-gray-800">
            Total Saldo Madin Saat Ini:{" "}
            <span className="text-green-600">{formatRupiah(totalSaldo)}</span>
          </div>
          {user && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
              >
                <FiPlus /> Buat Data
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                Kirim ke WhatsApp
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <DataTable
            columns={columns}
            data={kasList}
            pagination
            highlightOnHover
            responsive
            striped
            dense
            customStyles={customStyles}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
              Tambah Kas Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Masuk
                  </label>
                  <input
                    type="text"
                    name="masuk"
                    value={
                      formData.masuk
                        ? new Intl.NumberFormat("id-ID").format(formData.masuk)
                        : ""
                    }
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Keluar
                  </label>
                  <input
                    type="text"
                    name="keluar"
                    value={
                      formData.keluar
                        ? new Intl.NumberFormat("id-ID").format(formData.keluar)
                        : ""
                    }
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
