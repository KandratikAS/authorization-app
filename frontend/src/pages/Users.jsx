import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [regFilter, setRegFilter] = useState('all');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      if (res.data.length > 0 && res.data.every(u => u.status === 'blocked')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (e) {
      console.log(e.response);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const now = Date.now();
  const visibleUsers = users.filter(u => {
    if (regFilter === 'all') return true;
    const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
    if (regFilter === '24h') return createdAt >= now - 24*60*60*1000;
    if (regFilter === '7d') return createdAt >= now - 7*24*60*60*1000;
    if (regFilter === '30d') return createdAt >= now - 30*24*60*60*1000;
    return true;
  });

  const toggleAll = e =>
    setSelected(e.target.checked ? visibleUsers.map(u => u.id) : []);

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

  const timeAgo = (date) => {
    if (!date) return 'never';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'less than a minute ago';
    if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
    return Math.floor(diff / 86400) + ' days ago';
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light px-3 mb-4">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fw-bold"></span>
          <button className="btn btn-outline-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <h3 className="mb-3">User Management</h3>

      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <button className="btn btn-danger me-2" title="Block selected" onClick={handleBlock}>
            <i className="bi bi-lock-fill"></i>
          </button>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => action('unblock')}
            title="Unblock selected"
          >
            <i className="bi bi-unlock-fill"></i>
          </button>
          <button
            className="btn btn-outline-danger me-2"
            onClick={() => action('delete')}
            title="Delete selected"
          >
            <i className="bi bi-trash"></i>
          </button>
          <button
            className="btn btn-outline-warning"
            onClick={() => action('delete-unverified')}
            title="Delete unverified"
          >
            <i className="bi bi-person-x-fill"></i>
          </button>
        </div>
        <div className="d-flex align-items-center">
          <label className="me-2 text-muted">Filter:</label>
          <select
            className="form-select form-select-sm"
            style={{ width: 180 }}
            value={regFilter}
            onChange={e => setRegFilter(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={visibleUsers.length && selected.length === visibleUsers.length}
                onChange={toggleAll}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map(u => (
            <tr key={u.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
              </td>

              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge ${getStatusBadge(u.status)}`}>
                  {u.status}
                </span>
              </td>
              <td>
                {u.created_at ? timeAgo(u.created_at) : 'never'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
