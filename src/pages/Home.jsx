import { Link } from "react-router-dom";
import { FaListUl, FaHistory } from "react-icons/fa"; // ikon bisa disesuaikan

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Card 1 */}
        <Link
          to="/kas-madin"
          className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-16"
        >
          <FaListUl className="text-4xl text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">KAS MADIN</h2>
        </Link>

        {/* Card 2 */}
        <Link
          to="/kas-banjari"
          className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-16"
        >
          <FaHistory className="text-4xl text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">KAS BANJARI</h2>
        </Link>
        {/* Card 3 */}
        <Link
          to="/kas-upzis"
          className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center py-16"
        >
          <FaHistory className="text-4xl text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">KAS UPZIS</h2>
        </Link>
      </div>
    </div>
  );
}
