import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Movies from './pages/Movies.jsx';
import RewatchPlan from './pages/RewatchPlan.jsx';
import Booking from './pages/Booking.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Movies />} />
        <Route path="rewatch-plan" element={<RewatchPlan />} />
        <Route path="booking" element={<Booking />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
