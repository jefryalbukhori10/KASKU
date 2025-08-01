export default function CashTable({ data }) {
  const formatCurrency = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  let runningSaldo = 0;

  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="text-gray-500">Belum ada transaksi.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Keterangan</th>
              <th className="border p-2">Masuk</th>
              <th className="border p-2">Keluar</th>
              <th className="border p-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {data
              .slice() // copy array
              .reverse() // agar saldo dihitung dari bawah ke atas (awal ke akhir)
              .map((item, index) => {
                const masuk = item.type === "in" ? item.amount : 0;
                const keluar = item.type === "out" ? item.amount : 0;
                runningSaldo += masuk - keluar;

                return (
                  <tr key={index}>
                    <td className="border p-2">
                      {new Date(item.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2 text-green-600">
                      {masuk ? formatCurrency(masuk) : "-"}
                    </td>
                    <td className="border p-2 text-red-600">
                      {keluar ? formatCurrency(keluar) : "-"}
                    </td>
                    <td className="border p-2 font-semibold">
                      {formatCurrency(runningSaldo)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
}
