import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.log(e.response);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAll = e =>
    setSelected(e.target.checked ? users.map(u => u.id) : []);

  const toggle = id =>
    setSelected(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );

  const handleBlock = async () => {
    if (selected.length === 0) return;

    const emails = users
      .filter(u => selected.includes(u.id))
      .map(u => u.email);

    await api.put('/users/block', { emails });
    setSelected([]);
    load();
  };

  const action = async path => {
    await api.post(`/users/${path}`, { ids: selected });
    setSelected([]);
    load();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'blocked':
        return 'bg-danger';
      case 'unverified':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light px-3 mb-4">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fw-bold">ARTURIO</span>
          <button className="btn btn-outline-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <h3 className="mb-3">User Management</h3>

      <div className="mb-2">
        <button className="btn btn-danger me-2" onClick={handleBlock}>
          Block
        </button>
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => action('unblock')}
        >
          🔓
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={() => action('delete')}
        >
          🗑
        </button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selected.length === users.length && users.length}
                onChange={toggleAll}
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
              </td>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge ${getStatusBadge(u.status)}`}>
                  {u.status}
                </span>
              </td>
              <td>
                {u.last_login}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
