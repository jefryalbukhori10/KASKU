import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // pantau status login
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login"); // setelah logout diarahkan ke login
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-md flex justify-between items-center">
      {user ? (
        <Link to="/" className="text-xl font-bold hover:text-gray-400">
          KEUANGAN
        </Link>
      ) : (
        <Link to="#" className="text-xl font-bold hover:text-gray-400">
          KEUANGAN
        </Link>
      )}

      <div>
        {!user ? (
          <Link
            to="/login"
            className="bg-white text-gray-800 font-bold px-4 py-2 rounded hover:bg-gray-800 hover:text-white transition"
          >
            Login
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-white text-gray-800 font-bold px-4 py-2 rounded hover:bg-gray-800 hover:text-white transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
