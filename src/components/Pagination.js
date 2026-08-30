import React from 'react';

function Pagination({
  totalItems = 0,
  itemsPerPage = 25,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [15, 25, 50, 100],
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with windowing
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const buttonStyle = (isActive) => ({
    padding: '7px 14px',
    margin: '0 3px',
    border: isActive ? '1px solid #0d6efd' : '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: isActive ? '#0d6efd' : '#ffffff',
    color: isActive ? '#ffffff' : '#334155',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    fontSize: '13.5px',
    boxShadow: isActive ? '0 2px 4px rgba(13,110,253,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.15s ease',
  });

  const disabledButtonStyle = {
    padding: '7px 14px',
    margin: '0 3px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    cursor: 'not-allowed',
    fontSize: '13.5px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginTop: '16px',
        marginBottom: '20px',
        gap: '14px',
      }}
    >
      {/* Summary Info */}
      <div style={{ fontSize: '13.5px', color: '#64748b' }}>
        Mostrando <strong style={{ color: '#1e293b' }}>{startItem}</strong> - <strong style={{ color: '#1e293b' }}>{endItem}</strong> de <strong style={{ color: '#0d6efd' }}>{totalItems}</strong> registros
      </div>

      {/* Center / Controls */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Page Size Selector */}
        {onItemsPerPageChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}>
            <span style={{ color: '#64748b' }}>Filas:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '13.5px',
                color: '#1e293b',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? disabledButtonStyle : buttonStyle(false)}
          >
            &laquo; Anterior
          </button>

          {/* First page jump */}
          {pages[0] > 1 && (
            <>
              <button onClick={() => onPageChange(1)} style={buttonStyle(false)}>
                1
              </button>
              {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
            </>
          )}

          {/* Visible Page Numbers */}
          {pages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={buttonStyle(pageNum === currentPage)}
            >
              {pageNum}
            </button>
          ))}

          {/* Last page jump */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
              )}
              <button onClick={() => onPageChange(totalPages)} style={buttonStyle(false)}>
                {totalPages}
              </button>
            </>
          )}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? disabledButtonStyle : buttonStyle(false)}
          >
            Siguiente &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
