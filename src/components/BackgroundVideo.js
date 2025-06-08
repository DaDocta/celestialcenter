// src/components/BackgroundVideo.js
import React from 'react';
import '../styles/BackgroundVideo.css';

const BackgroundVideo = () => {
  return (
    <video className="background-video" autoPlay loop muted>
      <source src={require('../assets/Background.mp4')} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default BackgroundVideo;
