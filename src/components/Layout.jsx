// src/components/Layout.jsx
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-blue-200">
      <Navbar />
      <main className="">
        <Outlet />
      </main>
    </div>
  );
}
