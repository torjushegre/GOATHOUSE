import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { IcePage } from "./pages/IcePage";
import { BingoPage } from "./pages/BingoPage";
import { PlayersPage } from "./pages/PlayersPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { WashPage } from "./pages/WashPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="ice" element={<IcePage />} />
          <Route path="bingo" element={<BingoPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="handleliste" element={<ShoppingListPage />} />
          <Route path="vask" element={<WashPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
