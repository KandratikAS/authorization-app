import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import Verify from './pages/Verify';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';

const Private = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/" element={<Private><Users /></Private>} />
      </Routes>
    </BrowserRouter>
  );
}
