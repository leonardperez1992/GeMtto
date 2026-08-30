import React from 'react';

function Pagination({
  totalItems = 0,
  itemsPerPage = 20,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [15, 30, 50, 100],
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
    padding: '6px 12px',
    margin: '0 3px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    backgroundColor: isActive ? '#0d6efd' : '#ffffff',
    color: isActive ? '#ffffff' : '#333333',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  });

  const disabledButtonStyle = {
    padding: '6px 12px',
    margin: '0 3px',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    color: '#adb5bd',
    cursor: 'not-allowed',
    fontSize: '14px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '15px 0',
        padding: '10px 15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        gap: '10px',
      }}
    >
      {/* Summary Info */}
      <div style={{ fontSize: '14px', color: '#495057' }}>
        Mostrando <strong>{startItem}</strong> - <strong>{endItem}</strong> de <strong>{totalItems}</strong> registros
      </div>

      {/* Page Size Selector */}
      {onItemsPerPageChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <label htmlFor="pageSizeSelect" style={{ color: '#495057', margin: 0 }}>
            Por página:
          </label>
          <select
            id="pageSizeSelect"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              fontSize: '14px',
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

        {/* First page if skipped */}
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} style={buttonStyle(false)}>
              1
            </button>
            {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#6c757d' }}>...</span>}
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

        {/* Last page if skipped */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span style={{ padding: '0 4px', color: '#6c757d' }}>...</span>
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
  );
}

export default Pagination;
