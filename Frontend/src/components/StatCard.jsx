import React from 'react';
import PropTypes from 'prop-types';

// Reusable statistic card with smooth animation on value change
const StatCard = ({ title, value, icon, sub, color }) => {
  // Simple CSS variable for dynamic color
  const style = {
    borderTopColor: color,
    background: `${color}15`,
    color,
  };

  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-card-icon" style={style}>
        {icon}
      </div>
      <div className="stat-card-info">
        <span className="stat-value">{value}</span>
        <span className="stat-title">{title}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired,
  sub: PropTypes.string,
  color: PropTypes.string,
};

StatCard.defaultProps = {
  sub: null,
  color: '#4361ee', // OCP primary green fallback
};

export default StatCard;
