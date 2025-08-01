import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-md">
      <Link to="/" className="text-xl font-bold hover:text-gray-400">
        KEUANGAN
      </Link>
    </nav>
  );
}
