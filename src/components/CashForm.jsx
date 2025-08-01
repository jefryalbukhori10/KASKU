import { useState } from "react";

export default function CashForm({ onAdd }) {
  const [form, setForm] = useState({ type: "in", amount: "", description: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    const newData = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString(),
    };

    onAdd(newData);
    setForm({ type: "in", amount: "", description: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <select
        className="w-full p-2 border rounded"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
      >
        <option value="in">Pemasukan</option>
        <option value="out">Pengeluaran</option>
      </select>
      <input
        className="w-full p-2 border rounded"
        type="number"
        placeholder="Jumlah"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <input
        className="w-full p-2 border rounded"
        type="text"
        placeholder="Keterangan"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Simpan
      </button>
    </form>
  );
}
