import React from 'react';

const DataDisplay = ({ data }) => {
  const maxItems = 50; // Limita a 50 elementos
  const limitedData = data.slice(0, maxItems);

  return (
    <ul>
      {limitedData.map((item, index) => (
        <li key={index}>
          <strong>{item.sensor}:</strong> {item.value} - {item.time}
        </li>
      ))}
    </ul>
  );
};

export default DataDisplay;