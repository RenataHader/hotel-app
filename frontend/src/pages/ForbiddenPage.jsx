import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Brak dostępu</h2>
      <p>Nie masz uprawnień do tej strony.</p>
      <Link to="/">Wróć na start</Link>
    </div>
  );
}
