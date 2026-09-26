import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Approach from "./pages/Approach";
import Dashboard from "./pages/Dashboard";
import Demo from "./pages/Demo";
import EDA from "./pages/EDA";
import Home from "./pages/Home";
import Links from "./pages/Links";
import NotFound from "./pages/NotFound";
import Report from "./pages/Report";
import ResultDetail from "./pages/ResultDetail";
import Results from "./pages/Results";
import Team from "./pages/Team";

// HashRouter: works on any static host with no rewrite rules (GitHub Pages included).
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="demo" element={<Demo />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:video" element={<ResultDetail />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="eda" element={<EDA />} />
          <Route path="approach" element={<Approach />} />
          <Route path="report" element={<Report />} />
          <Route path="team" element={<Team />} />
          <Route path="links" element={<Links />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
