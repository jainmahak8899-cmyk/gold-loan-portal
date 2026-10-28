import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ApplyPage } from "./pages/ApplyPage";
import { AdminPage } from "./pages/AdminPage";
import { AgentChat } from "./components/AgentChat";

function Navbar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors
    ${isActive ? "bg-amber-100 text-amber-800" : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"}`;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-extrabold text-amber-700 text-lg">
          🏆 <span>GoldLoan</span>
        </NavLink>
        <div className="flex items-center gap-1">
          <NavLink to="/" className={linkCls} end>
            Apply Now
          </NavLink>
          <NavLink to="/admin" className={linkCls}>
            Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<ApplyPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <AgentChat />
    </BrowserRouter>
  );
}
