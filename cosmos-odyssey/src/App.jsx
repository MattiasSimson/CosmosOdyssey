import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header.jsx"
import SearchBar from "./components/SearchBar.jsx"
import Reservations from "./pages/Reservations.jsx"

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<SearchBar />} />
        <Route path="/reservations" element={<Reservations />} />
      </Routes>
    </Router>
  )
}

export default App
