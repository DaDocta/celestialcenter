// src/sections/Home.js
import React from 'react';
import '../styles/About.css'; // Optional: for custom styles if needed

const About = () => {
  return (
    <div className="about">
      <video className="background-video" autoPlay loop muted>
        <source src={require('../assets/Background.mp4')} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <h1>Welcome to Celestial Center</h1>
    </div>
  );
};

export default About;
