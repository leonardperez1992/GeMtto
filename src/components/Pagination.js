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
    border: isActive ? '1px solid #38bdf8' : '1px solid #334155',
    borderRadius: '8px',
    backgroundColor: isActive ? '#0284c7' : '#0f172a',
    color: isActive ? '#ffffff' : '#e2e8f0',
    fontWeight: isActive ? '700' : '500',
    cursor: 'pointer',
    fontSize: '13.5px',
    boxShadow: isActive ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
    transition: 'all 0.15s ease',
  });

  const disabledButtonStyle = {
    padding: '7px 14px',
    margin: '0 3px',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    backgroundColor: '#0b1329',
    color: '#475569',
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
        backgroundColor: '#1e293b',
        borderRadius: '10px',
        border: '1px solid #334155',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
        marginTop: '16px',
        marginBottom: '20px',
        gap: '14px',
      }}
    >
      {/* Summary Info */}
      <div style={{ fontSize: '13.5px', color: '#94a3b8' }}>
        Mostrando <strong style={{ color: '#f8fafc' }}>{startItem}</strong> - <strong style={{ color: '#f8fafc' }}>{endItem}</strong> de <strong style={{ color: '#38bdf8' }}>{totalItems}</strong> registros
      </div>

      {/* Center / Controls */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Page Size Selector */}
        {onItemsPerPageChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <span style={{ color: '#94a3b8' }}>Filas por pág:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                fontSize: '13.5px',
                color: '#f8fafc',
                fontWeight: '600',
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
              {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#64748b' }}>...</span>}
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
                <span style={{ padding: '0 4px', color: '#64748b' }}>...</span>
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
