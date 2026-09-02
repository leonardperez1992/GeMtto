import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiUsers, apiDeleteUser, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import {
  FaUsers,
  FaUserPlus,
  FaUserShield,
  FaHospital,
  FaTrashAlt,
  FaSyncAlt,
  FaUserTag,
  FaBuilding,
} from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';

function Usuarios() {
  const currentUser = useSelector((state) => state.user) || {};
  const [users, setUsers] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [selectedRol, setSelectedRol] = useState('');
  const [selectedIps, setSelectedIps] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiUsers,
        method: 'GET',
      });
      if (response && response.success && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        alert(`Error al cargar usuarios: ${response?.message || ''}`);
      }
    } catch (e) {
      console.error('Error al obtener lista de usuarios:', e);
      alert('Error al conectar con el servidor para obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchIps = async () => {
    try {
      const response = await request({
        link: apiIps,
        method: 'GET',
      });
      if (response && response.success && response.ips) {
        setListaIps(response.ips);
      }
    } catch (e) {
      console.error('Error al obtener lista de IPS:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchIps();
  }, []);

  const eliminarUsuario = async (userToDelete) => {
    if (!userToDelete) return;
    if (userToDelete._id === currentUser._id || userToDelete.usuario === currentUser.usuario) {
      alert('No puedes eliminar tu propia cuenta de usuario en sesión actual.');
      return;
    }

    const confirmacion = window.confirm(
      `¿Está seguro de que desea eliminar al usuario "${userToDelete.name || userToDelete.usuario}" (@${userToDelete.usuario})?\nEsta acción no se puede deshacer.`
    );
    if (!confirmacion) return;

    setDeletingId(userToDelete._id);
    try {
      const response = await request({
        link: apiDeleteUser,
        method: 'POST',
        body: { id: userToDelete._id, usuario: userToDelete.usuario },
      });

      if (response && response.success) {
        alert(`Usuario "${userToDelete.name || userToDelete.usuario}" eliminado con éxito.`);
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      } else {
        alert(`Error al eliminar: ${response?.message || 'No se pudo eliminar el usuario'}`);
      }
    } catch (e) {
      console.error('Error al eliminar usuario:', e);
      alert('Error de conexión al intentar eliminar el usuario.');
    } finally {
      setDeletingId(null);
    }
  };

  // Lista única de IPS extraída de la colección y de los usuarios
  const ipsDisponibles = useMemo(() => {
    const set = new Set();
    listaIps.forEach((item) => {
      const val = typeof item === 'string' ? item : item.ips || item.nombre || item.institucion;
      if (val && typeof val === 'string' && val.trim()) set.add(val.trim());
    });
    users.forEach((u) => {
      if (u.institucion && typeof u.institucion === 'string' && u.institucion.trim()) {
        set.add(u.institucion.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listaIps, users]);

  // Filtrado reactivo de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filtro por Rol
      if (selectedRol) {
        const uRol = String(u.rol || '').trim().toLowerCase();
        if (selectedRol === 'admin' && uRol !== 'admin') return false;
        if (selectedRol === 'user' && uRol === 'admin') return false;
      }

      // Filtro por IPS
      if (selectedIps) {
        const uInst = String(u.institucion || '').trim().toLowerCase();
        if (uInst !== selectedIps.trim().toLowerCase()) return false;
      }

      // Filtro por texto de búsqueda
      if (buscar.trim()) {
        const q = buscar.toLowerCase();
        const matchName = u.name && u.name.toLowerCase().includes(q);
        const matchUser = u.usuario && u.usuario.toLowerCase().includes(q);
        const matchInst = u.institucion && u.institucion.toLowerCase().includes(q);
        const matchRol = u.rol && u.rol.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchInst && !matchRol) return false;
      }

      return true;
    });
  }, [users, selectedRol, selectedIps, buscar]);

  // Paginación
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Métricas y estadísticas
  const metricas = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => String(u.rol || '').toLowerCase() === 'admin').length;
    const regulares = total - admins;
    const setInstituciones = new Set(
      users.map((u) => (u.institucion || '').trim()).filter(Boolean)
    );
    return {
      total,
      admins,
      regulares,
      totalInstituciones: setInstituciones.size,
    };
  }, [users]);

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUsers color="#38bdf8" /> Gestión de Usuarios y Cuentas
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Administración de accesos, roles y sedes institucionales asignadas en GEMTTO.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FaSyncAlt size={13} className={loading ? 'spin' : ''} /> Actualizar
            </button>

            <Link
              to="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '13.5px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                border: '1px solid #38bdf8',
                transition: 'all 0.2s',
              }}
            >
              <FaUserPlus size={14} /> Registrar Nuevo Usuario
            </Link>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          {/* 1. Total Usuarios */}
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                Total Usuarios
              </div>
              <div style={{ color: '#f8fafc', fontSize: '26px', fontWeight: '900', marginTop: '4px' }}>
                {metricas.total}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaUsers size={22} color="#38bdf8" />
            </div>
          </div>

          {/* 2. Administradores */}
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                Administradores
              </div>
              <div style={{ color: '#38bdf8', fontSize: '26px', fontWeight: '900', marginTop: '4px' }}>
                {metricas.admins}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaUserShield size={22} color="#10b981" />
            </div>
          </div>

          {/* 3. Usuarios Clientes / IPS */}
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                Usuarios IPS / Clientes
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '26px', fontWeight: '900', marginTop: '4px' }}>
                {metricas.regulares}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaUserTag size={20} color="#f59e0b" />
            </div>
          </div>

          {/* 4. Instituciones */}
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                IPS Vinculadas
              </div>
              <div style={{ color: '#38bdf8', fontSize: '26px', fontWeight: '900', marginTop: '4px' }}>
                {metricas.totalInstituciones}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaBuilding size={20} color="#38bdf8" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1.5px solid #334155',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            {/* Buscador */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px' }}>
                Buscar Usuario:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nombre, usuario o institución..."
                  value={buscar}
                  onChange={(e) => {
                    setBuscar(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-report"
                  style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', fontSize: '13px' }}
                />
                <GoSearch
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#38bdf8',
                  }}
                />
              </div>
            </div>

            {/* Filtro Rol */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px' }}>
                Filtrar por Rol:
              </label>
              <select
                value={selectedRol}
                onChange={(e) => {
                  setSelectedRol(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="">-- Todos los Roles --</option>
                <option value="admin">Administrador</option>
                <option value="user">Usuario IPS / Cliente</option>
              </select>
            </div>

            {/* Filtro IPS */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px' }}>
                Filtrar por Institución / IPS:
              </label>
              <select
                value={selectedIps}
                onChange={(e) => {
                  setSelectedIps(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="">-- Todas las IPS --</option>
                {ipsDisponibles.map((nombreIps) => (
                  <option key={nombreIps} value={nombreIps}>
                    {nombreIps}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="table-responsive-card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                <th style={{ width: '28%' }}>NOMBRE COMPLETO</th>
                <th style={{ width: '20%' }}>USUARIO (LOGIN)</th>
                <th style={{ width: '15%', textAlign: 'center' }}>ROL</th>
                <th style={{ width: '23%' }}>INSTITUCIÓN ASIGNADA</th>
                <th style={{ width: '10%', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#38bdf8' }}>
                    <FaUsers size={28} className="spin" style={{ marginBottom: '10px' }} />
                    <div>Cargando listado de usuarios...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No se encontraron usuarios con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const isCurrent = u._id === currentUser._id || u.usuario === currentUser.usuario;
                  const isAdmin = String(u.rol || '').trim().toLowerCase() === 'admin';

                  return (
                    <tr key={u._id || u.usuario}>
                      {/* 1. Consecutivo */}
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#94a3b8' }}>
                        {globalIndex}
                      </td>

                      {/* 2. Nombre */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: isAdmin ? '#0369a1' : '#334155',
                              color: isAdmin ? '#ffffff' : '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '13px',
                              border: `1.5px solid ${isAdmin ? '#38bdf8' : '#475569'}`,
                              flexShrink: 0,
                            }}
                          >
                            {(u.name || u.usuario || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '14px' }}>
                              {u.name || 'Sin Nombre Registrado'}
                            </div>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: '#10b981',
                                  fontWeight: '700',
                                }}
                              >
                                (Tu cuenta en sesión)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Usuario */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            color: '#38bdf8',
                            fontSize: '13.5px',
                            backgroundColor: '#0f172a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #334155',
                          }}
                        >
                          @{u.usuario}
                        </span>
                      </td>

                      {/* 4. Rol */}
                      <td style={{ textAlign: 'center' }}>
                        {isAdmin ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: '800',
                            }}
                          >
                            <FaUserShield size={12} /> Administrador
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                            }}
                          >
                            <FaHospital size={11} /> Usuario IPS
                          </span>
                        )}
                      </td>

                      {/* 5. Institución */}
                      <td>
                        {u.institucion ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#e2e8f0',
                              fontWeight: '600',
                              fontSize: '13px',
                            }}
                          >
                            <FaHospital color="#94a3b8" size={12} /> {u.institucion}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12.5px' }}>
                            {isAdmin ? 'Acceso Global (Todas las IPS)' : 'Sin institución asignada'}
                          </span>
                        )}
                      </td>

                      {/* 6. Acciones */}
                      <td style={{ textAlign: 'center' }}>
                        {!isCurrent ? (
                          <button
                            onClick={() => eliminarUsuario(u)}
                            disabled={deletingId === u._id}
                            title="Eliminar usuario"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: deletingId === u._id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: '700',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.color = '#f87171';
                            }}
                          >
                            <FaTrashAlt size={12} /> {deletingId === u._id ? '...' : 'Eliminar'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                            En uso
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div style={{ marginTop: '18px' }}>
          <Pagination
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[15, 25, 50, 100]}
          />
        </div>
      </main>
    </div>
  );
}

export default Usuarios;
