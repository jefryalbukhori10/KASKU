// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import KasMadin from "./pages/KasMadin";
import KasBanjari from "./pages/KasBanjari";
import Login from "./pages/Login";
import KasUpzis from "./pages/KasUpzis";
import KasBal from "./pages/KasBal";
import KasBersihDusun from "./pages/KasBersihDusun";
import KasPemuda from "./pages/KasPemuda";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/kas-madin" element={<KasMadin />} />
          <Route path="/kas-banjari" element={<KasBanjari />} />
          <Route path="/kas-upzis" element={<KasUpzis />} />
          <Route path="/kas-bal" element={<KasBal />} />
          <Route path="/kas-pemuda" element={<KasPemuda />} />
          <Route path="/kas-bersih-dusun" element={<KasBersihDusun />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
