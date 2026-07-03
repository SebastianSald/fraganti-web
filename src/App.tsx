import { Landing } from "./components/Landing";
import { AdminPanel } from "./components/AdminPanel";

function App() {
  // Enrutamiento mínimo sin librerías: /admin muestra el panel protegido,
  // cualquier otra ruta muestra la tienda normal. vercel.json ya redirige
  // todas las rutas a index.html, así que esto funciona en cualquier URL.
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminPanel /> : <Landing />;
}

export default App;
