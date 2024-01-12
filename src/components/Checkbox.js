import React, { useState } from 'react';
export const Checkbox = ({ id, onChange = () => {} }) => {
  const [actualState, changeCheckState] = useState(false);
  const handleCheckbox = (e) => {
    changeCheckState(e.target.checked);
    //Si además de cambiar el estado quieres "avisar" al componente padre puedes ejecutar una función pasada por los props
    if (onChange) {
      onChange(id, e.target.checked);
    }
  };
  return (
    <input
      checked={actualState}
      id={id}
      onChange={handleCheckbox}
      type="checkbox"
    />
  );
};
