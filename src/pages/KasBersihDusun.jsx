// src/pages/KasBersihDusun.jsx
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
import { FaFileExcel, FaWhatsapp, FaFilePdf } from "react-icons/fa";

import { motion } from "framer-motion";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx-js-style";

export default function KasBersihDusun() {
  const [kasList, setKasList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null); // 🔑 simpan user login

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const [page, setPage] = useState(1);

  const perPage = 10;

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

  const handleDownloadExcel = () => {
    try {
      const pemasukan = [...filteredData]
        .filter((item) => Number(item.masuk) > 0)
        .reverse();

      const pengeluaran = [...filteredData]
        .filter((item) => Number(item.keluar) > 0)
        .reverse();

      const totalPemasukan = pemasukan.reduce(
        (sum, item) => sum + (item.masuk || 0),
        0,
      );

      const totalPengeluaran = pengeluaran.reduce(
        (sum, item) => sum + (item.keluar || 0),
        0,
      );

      const saldoAkhir = totalPemasukan - totalPengeluaran;

      let subtotalMasuk = 0;

      const pemasukanRows = pemasukan.map((item, index) => {
        subtotalMasuk += item.masuk;

        return [index + 1, item.keterangan, item.masuk, subtotalMasuk];
      });

      let subtotalKeluar = 0;
      let saldoBerjalan = totalPemasukan;

      const pengeluaranRows = pengeluaran.map((item, index) => {
        subtotalKeluar += item.keluar;
        saldoBerjalan -= item.keluar;

        return [
          index + 1,
          item.keterangan,
          item.keluar,
          subtotalKeluar,
          saldoBerjalan,
        ];
      });

      const periodeText =
        startDate && endDate ? `${startDate} s/d ${endDate}` : "SEMUA PERIODE";

      const sheetData = [
        ["LAPORAN KAS BERSIH DUSUN"],
        [periodeText],
        [],

        ["PEMASUKAN"],
        ["NO", "PEMASUKAN", "JUMLAH", "SUB TOTAL"],

        ...pemasukanRows,

        ["", "TOTAL PEMASUKAN", "", totalPemasukan],

        [],
        [],

        ["PENGELUARAN"],
        ["NO", "PENGELUARAN", "TOTAL BIAYA", "SUB TOTAL", "SALDO"],

        ...pengeluaranRows,

        ["", "TOTAL PENGELUARAN", "", totalPengeluaran, saldoAkhir],

        [],
        [],
        [],

        ["PEMASUKAN", "", "", totalPemasukan],
        ["PENGELUARAN", "", "", totalPengeluaran],
        ["SISA SALDO", "", "", saldoAkhir],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      ws["!cols"] = [
        { wch: 8 },
        { wch: 40 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
      ];

      ws["!merges"] = [
        XLSX.utils.decode_range("A1:E1"),
        XLSX.utils.decode_range("A2:E2"),
      ];

      const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      const currencyFormat = '"Rp" #,##0';

      const range = XLSX.utils.decode_range(ws["!ref"]);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

          if (!ws[cellAddress]) continue;

          ws[cellAddress].s = {
            border: borderStyle,
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }

      // Judul
      ["A1", "A2"].forEach((cell) => {
        ws[cell].s = {
          font: {
            bold: true,
            sz: 16,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      });

      // Header PEMASUKAN
      const pemasukanHeaderRow = 5;

      ["A", "B", "C", "D"].forEach((col) => {
        ws[`${col}${pemasukanHeaderRow}`].s = {
          fill: {
            fgColor: { rgb: "FFFF00" },
          },
          font: {
            bold: true,
          },
          border: borderStyle,
          alignment: {
            horizontal: "center",
          },
        };
      });

      // Header PENGELUARAN
      const pengeluaranHeaderRow = pemasukanRows.length + 10;

      ["A", "B", "C", "D", "E"].forEach((col) => {
        ws[`${col}${pengeluaranHeaderRow}`].s = {
          fill: {
            fgColor: { rgb: "FFFF00" },
          },
          font: {
            bold: true,
          },
          border: borderStyle,
          alignment: {
            horizontal: "center",
          },
        };
      });

      // Format rupiah pemasukan
      for (let row = 6; row <= pemasukanRows.length + 6; row++) {
        ["C", "D"].forEach((col) => {
          const cell = ws[`${col}${row}`];
          if (cell) {
            cell.z = currencyFormat;
            cell.s = {
              ...cell.s,
              alignment: {
                horizontal: "right",
              },
            };
          }
        });
      }

      // Total pemasukan
      const totalMasukRow = pemasukanRows.length + 6;

      ["A", "B", "C", "D"].forEach((col) => {
        if (ws[`${col}${totalMasukRow}`]) {
          ws[`${col}${totalMasukRow}`].s = {
            fill: {
              fgColor: { rgb: "92D050" },
            },
            font: {
              bold: true,
            },
            border: borderStyle,
          };
        }
      });

      // Format rupiah pengeluaran
      const startPengeluaranData = pengeluaranHeaderRow + 1;

      for (
        let row = startPengeluaranData;
        row < startPengeluaranData + pengeluaranRows.length;
        row++
      ) {
        ["C", "D", "E"].forEach((col) => {
          const cell = ws[`${col}${row}`];

          if (cell) {
            cell.z = currencyFormat;
            cell.s = {
              ...cell.s,
              alignment: {
                horizontal: "right",
              },
            };
          }
        });
      }

      // Total pengeluaran
      const totalKeluarRow = startPengeluaranData + pengeluaranRows.length;

      ["A", "B", "C", "D", "E"].forEach((col) => {
        if (ws[`${col}${totalKeluarRow}`]) {
          ws[`${col}${totalKeluarRow}`].s = {
            fill: {
              fgColor: { rgb: "92D050" },
            },
            font: {
              bold: true,
            },
            border: borderStyle,
          };
        }
      });

      const summaryStartRow = totalKeluarRow + 4;

      // format rupiah summary
      for (let row = summaryStartRow; row <= summaryStartRow + 2; row++) {
        const cell = ws[`B${row}`];

        if (cell) {
          cell.z = '"Rp" #,##0';
          cell.s = {
            border: borderStyle,
            font: {
              bold: true,
            },
            alignment: {
              horizontal: "right",
            },
          };
        }

        if (ws[`A${row}`]) {
          ws[`A${row}`].s = {
            border: borderStyle,
            font: {
              bold: true,
            },
          };
        }
      }

      // warna hijau SISA SALDO
      ["A", "B"].forEach((col) => {
        if (ws[`${col}${summaryStartRow + 2}`]) {
          ws[`${col}${summaryStartRow + 2}`].s = {
            border: borderStyle,
            fill: {
              fgColor: {
                rgb: "A9D18E",
              },
            },
            font: {
              bold: true,
              sz: 14,
            },
          };
        }
      });

      ws["!merges"].push(
        XLSX.utils.decode_range(`A${summaryStartRow}:C${summaryStartRow}`),
        XLSX.utils.decode_range(
          `A${summaryStartRow + 1}:C${summaryStartRow + 1}`,
        ),
        XLSX.utils.decode_range(
          `A${summaryStartRow + 2}:C${summaryStartRow + 2}`,
        ),
      );

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");

      XLSX.writeFile(
        wb,
        `Laporan_Kas_Bersih_Dusun_${new Date().getFullYear()}.xlsx`,
      );
    } catch (error) {
      console.error(error);

      Swal.fire(
        "Gagal",
        "Terjadi kesalahan saat membuat laporan Excel",
        "error",
      );
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const data = filteredData;

    const pemasukan = data.reduce(
      (sum, item) => sum + Number(item.masuk || 0),
      0,
    );

    const pengeluaran = data.reduce(
      (sum, item) => sum + Number(item.keluar || 0),
      0,
    );

    const saldo = pemasukan - pengeluaran;

    doc.setFontSize(16);

    doc.text("LAPORAN KAS BERSIH DUSUN", 105, 15, { align: "center" });

    doc.setFontSize(10);

    doc.text(
      `Periode: ${
        startDate && endDate ? `${startDate} s/d ${endDate}` : "Semua Periode"
      }`,
      14,
      25,
    );

    autoTable(doc, {
      startY: 35,
      head: [["Tanggal", "Keterangan", "Masuk", "Keluar"]],
      body: data.map((item) => [
        item.tanggal?.toLocaleDateString("id-ID"),
        item.keterangan,
        item.masuk ? formatRupiah(item.masuk) : "-",
        item.keluar ? formatRupiah(item.keluar) : "-",
      ]),
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Total Pemasukan : ${formatRupiah(pemasukan)}`, 14, finalY);

    doc.text(
      `Total Pengeluaran : ${formatRupiah(pengeluaran)}`,
      14,
      finalY + 8,
    );

    doc.text(`Saldo : ${formatRupiah(saldo)}`, 14, finalY + 16);

    doc.save(`Laporan_Kas_Bersih_Dusun.pdf`);
  };

  // const fetchKasData = async () => {
  //   const q = query(
  //     collection(db, "kas_bersih_dusun"),
  //     orderBy("tanggal", "desc"),
  //   );

  //   const querySnapshot = await getDocs(q);

  //   const data = querySnapshot.docs.map((doc) => {
  //     const item = doc.data();

  //     return {
  //       id: doc.id,
  //       ...item,
  //       tanggal: item.tanggal?.toDate ? item.tanggal.toDate() : null,
  //     };
  //   });

  //   const totalSaldo = data.reduce(
  //     (total, item) =>
  //       total + Number(item.masuk || 0) - Number(item.keluar || 0),
  //     0,
  //   );

  //   setTotalSaldo(totalSaldo);
  //   setKasList(data);
  // };

  const fetchKasData = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "kas_bersih_dusun"),
        orderBy("tanggal", "desc"),
      );

      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => {
        const item = doc.data();

        return {
          id: doc.id,
          ...item,
          tanggal: item.tanggal?.toDate ? item.tanggal.toDate() : null,
        };
      });

      const totalSaldo = data.reduce(
        (total, item) =>
          total + Number(item.masuk || 0) - Number(item.keluar || 0),
        0,
      );

      setTotalSaldo(totalSaldo);
      setKasList(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateSaldo = async () => {
    const q = query(
      collection(db, "kas_bersih_dusun"),
      orderBy("tanggal", "asc"),
    );

    const snapshot = await getDocs(q);

    let saldo = 0;

    for (const item of snapshot.docs) {
      const data = item.data();

      saldo += Number(data.masuk || 0) - Number(data.keluar || 0);

      await updateDoc(doc(db, "kas_bersih_dusun", item.id), {
        saldo,
      });
    }
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

        ...(name === "masuk" && numberValue > 0 ? { keluar: 0 } : {}),

        ...(name === "keluar" && numberValue > 0 ? { masuk: 0 } : {}),
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

    if (isSubmitting) return;

    if (!user) {
      Swal.fire(
        "Akses Ditolak",
        "Silakan login untuk menambah data.",
        "warning",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      Swal.fire({
        title: "Menyimpan...",
        text: "Mohon tunggu",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const masuk = parseInt(formData.masuk) || 0;
      const keluar = parseInt(formData.keluar) || 0;

      const q = query(
        collection(db, "kas_bersih_dusun"),
        orderBy("timestamp", "desc"),
        limit(1),
      );

      const kasSnapshot = await getDocs(q);

      let saldoTerakhir = 0;

      if (!kasSnapshot.empty) {
        const lastEntry = kasSnapshot.docs[0].data();
        saldoTerakhir = lastEntry.saldo || 0;
      }

      const saldoBaru = saldoTerakhir + masuk - keluar;

      // await addDoc(collection(db, "kas_bersih_dusun"), {
      //   tanggal: Timestamp.fromDate(new Date(formData.tanggal)),
      //   keterangan: formData.keterangan,
      //   masuk,
      //   keluar,
      //   saldo: saldoBaru,
      //   timestamp: Timestamp.now(),
      // });
      if (isEdit) {
        await updateDoc(doc(db, "kas_bersih_dusun", editId), {
          tanggal: Timestamp.fromDate(new Date(formData.tanggal)),
          keterangan: formData.keterangan,
          masuk,
          keluar,
        });

        await recalculateSaldo();

        // Swal.fire("Berhasil", "Data berhasil diperbarui", "success");
        Toast.fire({
          icon: "success",
          title: "Data berhasil diperbarui",
        });
      } else {
        await addDoc(collection(db, "kas_bersih_dusun"), {
          tanggal: Timestamp.fromDate(new Date(formData.tanggal)),
          keterangan: formData.keterangan,
          masuk,
          keluar,
          saldo: 0,
          timestamp: Timestamp.now(),
        });

        await recalculateSaldo();

        // Swal.fire("Berhasil", "Data berhasil ditambahkan", "success");
        Toast.fire({
          icon: "success",
          title: "Data berhasil ditambahkan",
        });
      }

      setShowModal(false);

      setFormData({
        tanggal: "",
        keterangan: "",
        masuk: 0,
        keluar: 0,
      });

      await fetchKasData();
      Swal.close();

      // Swal.fire("Berhasil", "Data berhasil ditambahkan", "success");
    } catch (error) {
      console.error(error);

      // Swal.fire("Gagal", "Terjadi kesalahan", "error");
      Toast.fire({
        icon: "error",
        title: "Terjadi kesalahan",
      });
    } finally {
      setIsEdit(false);
      setEditId(null);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setIsEdit(true);
    setEditId(item.id);

    setFormData({
      tanggal: item.tanggal ? item.tanggal.toISOString().split("T")[0] : "",
      keterangan: item.keterangan,
      masuk: item.masuk || 0,
      keluar: item.keluar || 0,
    });

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (isDeleting) return;

    if (!user) {
      Swal.fire(
        "Akses Ditolak",
        "Silakan login untuk menghapus data.",
        "warning",
      );
      return;
    }

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

    if (!result.isConfirmed) return;

    try {
      setIsDeleting(true);

      Swal.fire({
        title: "Menghapus...",
        text: "Mohon tunggu",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await deleteDoc(doc(db, "kas_bersih_dusun", id));

      await recalculateSaldo();

      await fetchKasData();

      Swal.close();

      // Swal.fire("Berhasil", "Data berhasil dihapus.", "success");
      Toast.fire({
        icon: "success",
        title: "Data berhasil dihapus",
      });
    } catch (error) {
      Swal.close();

      console.error(error);

      Swal.fire("Gagal", "Terjadi kesalahan saat menghapus data.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleSendWhatsApp = () => {
  //   const fiveLatest = kasList.slice(0, 5); // ambil 5 transaksi terakhir

  //   let message = `📊 *Laporan Kas Bersih Dusun*\n\n💰 Saldo saat ini: *${formatRupiah(
  //     totalSaldo
  //   )}*\n\n📝 *5 Transaksi Terakhir:*\n`;

  //   fiveLatest.forEach((item, idx) => {
  //     const tanggal = item.tanggal
  //       ? item.tanggal.toLocaleDateString("id-ID")
  //       : "-";
  //     message += `\n${idx + 1}. 📅 ${tanggal}\n   ✏️ ${
  //       item.keterangan
  //     }\n   ➕ Masuk: ${formatRupiah(item.masuk)}\n   ➖ Keluar: ${formatRupiah(
  //       item.keluar
  //     )}\n   💳 Saldo: ${formatRupiah(item.saldo)}\n----------------------`;
  //   });

  //   message += `\n\n🔗 Lihat lebih lengkap di:\nhttps://kasku.vercel.app/kas-bersih-dusun`;

  //   // encode pesan supaya terbaca di URL
  //   const encodedMessage = encodeURIComponent(message);

  //   // ganti nomor tujuan WA sesuai kebutuhan, atau biarkan kosong agar user memilih kontak
  //   const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  //   window.open(whatsappUrl, "_blank");
  // };

  const handleSendWhatsApp = () => {
    const fiveLatest = filteredData.slice(0, 5);
    const periodeText =
      startDate && endDate ? `${startDate} s/d ${endDate}` : "Semua Periode";
    let message = `LAPORAN KAS BERSIH DUSUN\n\n`;
    message += `Periode : ${periodeText}\n\n`;
    message += `Saldo saat ini : ${formatRupiah(totalSaldo)}\n\n`;
    message += `5 Transaksi Terakhir:\n\n`;

    fiveLatest.forEach((item, idx) => {
      const tanggal = item.tanggal
        ? item.tanggal.toLocaleDateString("id-ID")
        : "-";

      // Atur panjang label (10 karakter biar rata)
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
      message += "---------------------------------\n";
    });

    message += `\nLihat lebih lengkap di:\nhttps://kasku.vercel.app/kas-bersih-dusun`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
        user &&
        (user.email === "admin@bersihdusun.com" ||
          user.email === "jefryalbukhori23@gmail.com") ? (
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

  const filteredData = kasList.filter((item) => {
    const cocokKeterangan = item.keterangan
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const tanggalItem = item.tanggal;

    const cocokTanggal =
      (!startDate || tanggalItem >= new Date(startDate)) &&
      (!endDate || tanggalItem <= new Date(endDate + "T23:59:59"));

    return cocokKeterangan && cocokTanggal;
  });

  const totalPages = Math.ceil(filteredData.length / perPage);

  const displayedData = filteredData.slice(
    (page - 1) * perPage,
    page * perPage,
  );

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

  const thisMonth = new Date().getMonth();

  const pemasukanBulan = kasList
    .filter((k) => k.tanggal && k.tanggal.getMonth() === thisMonth)
    .reduce((a, b) => a + (b.masuk || 0), 0);

  const pengeluaranBulan = kasList
    .filter((k) => k.tanggal && k.tanggal.getMonth() === thisMonth)
    .reduce((a, b) => a + (b.keluar || 0), 0);

  const pemasukanFilter = filteredData.reduce(
    (sum, item) => sum + Number(item.masuk || 0),
    0,
  );

  const pengeluaranFilter = filteredData.reduce(
    (sum, item) => sum + Number(item.keluar || 0),
    0,
  );

  const saldoFilter = pemasukanFilter - pengeluaranFilter;

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb]">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-black/5">
          <div className="max-w-5xl mx-auto px-5 py-4">
            <div className="h-8 w-52 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-40 bg-gray-100 rounded mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-5">
          {/* CARD SALDO */}
          <div className="rounded-[34px] bg-[#111827] p-8 animate-pulse">
            <div className="h-4 w-32 bg-white/20 rounded"></div>

            <div className="h-12 w-64 bg-white/20 rounded mt-4"></div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/10 rounded-3xl p-5">
                <div className="h-4 w-24 bg-white/20 rounded"></div>
                <div className="h-8 w-32 bg-white/20 rounded mt-4"></div>
              </div>

              <div className="bg-white/10 rounded-3xl p-5">
                <div className="h-4 w-24 bg-white/20 rounded"></div>
                <div className="h-8 w-32 bg-white/20 rounded mt-4"></div>
              </div>
            </div>
          </div>

          {/* GRAFIK */}
          <div className="mt-5 bg-white rounded-[32px] p-5 shadow-sm">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>

            <div className="h-[260px] mt-5 bg-gray-100 rounded-2xl animate-pulse"></div>
          </div>

          {/* TRANSAKSI */}
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="bg-white rounded-[30px] p-5 shadow-sm animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200"></div>

                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded"></div>

                    <div className="h-4 w-32 bg-gray-100 rounded mt-3"></div>

                    <div className="h-4 w-40 bg-gray-100 rounded mt-4"></div>
                  </div>

                  <div className="w-28 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">
              Kas Bersih Dusun
            </h1>

            <p className="text-sm text-gray-500 mt-0.5">
              Keuangan Organisasi Bersih Dusun
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center">
            <span className="text-lg">🥁</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-5">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[34px] bg-[#111827] text-white shadow-[0_25px_80px_rgba(17,24,39,0.25)]"
        >
          <div className="absolute -top-20 -right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300">Total Saldo Kas</p>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mt-3 tracking-tight">
                  {formatRupiah(totalSaldo)}
                </h2>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg">
                <p className="text-xs text-gray-300">Update</p>

                <p className="font-medium text-sm mt-1">Real Time</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg p-5">
                <p className="text-sm text-gray-300">Pemasukan Bulan Ini</p>

                <h3 className="text-2xl font-semibold mt-4">
                  {formatRupiah(pemasukanBulan)}
                </h3>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg p-5">
                <p className="text-sm text-gray-300">Pengeluaran Bulan Ini</p>

                <h3 className="text-2xl font-semibold mt-4">
                  {formatRupiah(pengeluaranBulan)}
                </h3>
              </div>
            </div>
          </div>
        </motion.div>

        {/* GRAFIK */}
        <div className="mt-5 bg-white rounded-[32px] border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-5">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#111827]">
              Statistik Keuangan
            </h2>

            <p className="text-sm text-gray-500 mt-1">Aktivitas kas terbaru</p>
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
        </div>

        {/* HEADER TRANSAKSI */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Riwayat Transaksi
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Semua aktivitas kas organisasi
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleDownloadExcel}
              disabled={filteredData.length === 0}
              className={`
                  h-12 px-4 rounded-2xl text-white flex items-center gap-2 font-medium
                  ${
                    filteredData.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600"
                  }
                `}
            >
              <FaFileExcel />
              <span className="hidden md:block">Excel</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleDownloadPDF}
              className="h-12 px-4 rounded-2xl bg-red-600 text-white flex items-center gap-2 font-medium"
            >
              <FaFilePdf />
              <span className="hidden md:block">PDF</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSendWhatsApp}
              className="h-12 px-3 sm:px-4 rounded-2xl bg-[#25D366] text-white flex items-center gap-2 font-medium"
            >
              <FaWhatsapp size={20} />
              <span className="hidden md:block">WhatsApp</span>
            </motion.button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="
                        w-full
                        px-4
                        py-3
                        rounded-2xl
                        bg-white
                        border
                        border-gray-200
                        focus:ring-2
                        focus:ring-[#111827]
                        outline-none
                      "
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="
                        px-4
                        py-3
                        rounded-2xl
                        bg-white
                        border
                        border-gray-200
                        focus:ring-2
                        focus:ring-[#111827]
                        outline-none
                      "
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="
      px-4
      py-3
      rounded-2xl
      bg-white
      border
      border-gray-200
      focus:ring-2
      focus:ring-[#111827]
      outline-none
    "
          />
          <button
            onClick={() => {
              setSearchTerm("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="
    px-4
    py-2
    rounded-xl
    bg-red-50
    text-red-600
    hover:bg-red-100
    text-sm
  "
          >
            Reset Filter
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Menampilkan {filteredData.length} transaksi
          </p>
        </div>

        {/* <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-gray-500">Pemasukan</p>

            <p className="font-semibold text-green-600 mt-1">
              {formatRupiah(pemasukanFilter)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-gray-500">Pengeluaran</p>

            <p className="font-semibold text-red-600 mt-1">
              {formatRupiah(pengeluaranFilter)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-gray-500">Saldo</p>

            <p className="font-semibold text-blue-600 mt-1">
              {formatRupiah(saldoFilter)}
            </p>
          </div>
        </div> */}

        {/* LIST TRANSAKSI */}
        <div className="space-y-4">
          {displayedData.length === 0 ? (
            <div className="bg-white rounded-[30px] p-10 text-center shadow-sm">
              <div className="text-5xl mb-3">📋</div>

              <h3 className="text-lg font-semibold text-gray-700">
                Tidak Ada Data
              </h3>

              <p className="text-gray-500 mt-2">
                Belum ada transaksi yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            displayedData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group bg-white rounded-[30px] border border-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg ${
                          item.masuk ? "bg-[#10b981]" : "bg-[#ef4444]"
                        }`}
                      >
                        {item.masuk ? "↓" : "↑"}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827]">
                          {item.keterangan}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="px-3 py-1 rounded-full bg-[#f3f4f6] text-gray-600 text-xs">
                            {item.tanggal?.toLocaleDateString("id-ID", {
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

                    <div className="text-left md:text-right">
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
                        (user.email === "admin@bersihdusun.com" ||
                          user.email === "jefryalbukhori23@gmail.com") && (
                          <div className="flex items-center gap-2 justify-end mt-4">
                            <button
                              onClick={() => handleEdit(item)}
                              className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-7">
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

      {/* ================= FLOATING BUTTON ================= */}
      {user &&
        (user.email === "admin@bersihdusun.com" ||
          user.email === "jefryalbukhori23@gmail.com") && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setIsEdit(false);
              setEditId(null);

              setFormData({
                tanggal: "",
                keterangan: "",
                masuk: 0,
                keluar: 0,
              });

              setShowModal(true);
            }}
            className="fixed bottom-6 right-5 z-50 w-16 h-16 rounded-full bg-[#111827] text-white shadow-[0_20px_50px_rgba(17,24,39,0.3)] flex items-center justify-center"
          >
            <FiPlus size={26} />
          </motion.button>
        )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center">
          <motion.div
            whileTap={{ scale: 0.985 }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md mx-3 bg-white rounded-t-[34px] md:rounded-[34px] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">
                  {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Tambahkan data kas baru
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);

                  setIsEdit(false);
                  setEditId(null);

                  setFormData({
                    tanggal: "",
                    keterangan: "",
                    masuk: 0,
                    keluar: 0,
                  });
                }}
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
                  disabled={formData.keluar > 0}
                  placeholder="Kas Masuk"
                  value={
                    formData.masuk
                      ? new Intl.NumberFormat("id-ID").format(formData.masuk)
                      : ""
                  }
                  onChange={handleInputChange}
                  className={`
  rounded-2xl border border-gray-200 px-4 py-3 outline-none
  ${
    formData.keluar > 0
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-[#fafafa] focus:ring-2 focus:ring-emerald-500"
  }
`}
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
                  disabled={formData.masuk > 0}
                  onChange={handleInputChange}
                  className={`
  rounded-2xl border border-gray-200 px-4 py-3 outline-none
  ${
    formData.masuk > 0
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-[#fafafa] focus:ring-2 focus:ring-red-500"
  }
`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-2xl text-white font-medium shadow-lg transition
  ${
    isSubmitting
      ? "bg-gray-500 cursor-not-allowed"
      : "bg-[#111827] hover:opacity-95"
  }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEdit ? "Mengupdate..." : "Menyimpan..."}
                  </div>
                ) : isEdit ? (
                  "Update Transaksi"
                ) : (
                  "Simpan Transaksi"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
