// src/components/Card.jsx
import React from "react";
import "../styles/Card.css";

const Card = ({ imageUrl, isFlipped, onClick }) => {
  return (
    <div
      className={`card ${isFlipped ? "flipped" : ""}`}
      onClick={isFlipped ? null : onClick}
    >
      {isFlipped ? (
        <img src={imageUrl} alt="card" className="card-img" />
      ) : (
        <div className="card-back"></div>
      )}
    </div>
  );
};

export default Card;
