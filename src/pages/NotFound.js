// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css'; // Optional: Create this CSS file for styling

const NotFound = () => (
  <div className="not-found-container">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you're looking for doesn't exist.</p>
    <Link to="/">Go Back Home</Link>
  </div>
);

export default NotFound;
