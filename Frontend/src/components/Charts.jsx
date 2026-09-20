import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

// Color palette matching OCP green theme
const COLORS = ['#2ecc71', '#27ae60', '#1abc9c', '#16a085'];

// Doughnut chart for ticket status distribution
export const TicketStatusDonut = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

TicketStatusDonut.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, value: PropTypes.number.isRequired })
  ).isRequired,
};

// Bar chart for ticket priority distribution
export const TicketPriorityBar = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill={COLORS[0]} />
    </BarChart>
  </ResponsiveContainer>
);

TicketPriorityBar.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, value: PropTypes.number.isRequired })
  ).isRequired,
};

// Line chart for monthly ticket evolution
export const MonthlyTicketsLine = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke={COLORS[1]} activeDot={{ r: 8 }} />
    </LineChart>
  </ResponsiveContainer>
);

MonthlyTicketsLine.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ month: PropTypes.string.isRequired, count: PropTypes.number.isRequired })
  ).isRequired,
};

// Line chart for monthly interventions evolution
export const MonthlyInterventionsLine = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke={COLORS[2]} activeDot={{ r: 8 }} />
    </LineChart>
  </ResponsiveContainer>
);

MonthlyInterventionsLine.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ month: PropTypes.string.isRequired, count: PropTypes.number.isRequired })
  ).isRequired,
};

// Pie chart for equipment distribution
export const EquipmentPie = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

EquipmentPie.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, value: PropTypes.number.isRequired })
  ).isRequired,
};

export default {
  TicketStatusDonut,
  TicketPriorityBar,
  MonthlyTicketsLine,
  MonthlyInterventionsLine,
  EquipmentPie,
};
