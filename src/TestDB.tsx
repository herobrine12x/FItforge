import { useEffect, useState } from 'react';

export default function TestDB() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', color: 'black' }}>
      <h1>✅ Connected to Flask + MySQL!</h1>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>
            <strong>{user.username}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}