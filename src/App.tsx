import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { IcePage } from "./pages/IcePage";
import { BingoPage } from "./pages/BingoPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="ice" element={<IcePage />} />
          <Route path="bingo" element={<BingoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
