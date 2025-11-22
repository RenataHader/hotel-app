import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Łączenie z backendem...");

  useEffect(() => {
    fetch("http://localhost:8080/api/test")
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => {
        console.error(err);
        setMessage("Błąd połączenia z backendem");
      });
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Hotel App</h1>
      <p>Odpowiedź z backendu:</p>
      <strong>{message}</strong>
    </div>
  );
}

export default App;
