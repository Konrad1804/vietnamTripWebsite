import { Routes, Route, Navigate } from "react-router-dom";
import RoutePage from "./pages/RoutePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/route" replace />} />
      <Route path="/route" element={<RoutePage />} />
      <Route path="*" element={<Navigate to="/route" replace />} />
    </Routes>
  );
}

