import React from "react";
import { Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen";
import ProjectView from "./pages/ProjectView";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/project/:projectName" element={<ProjectView />} />
    </Routes>
  );
}

export default App;
