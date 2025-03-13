// src/App.jsx
import React from "react";
import GameBoard from "./components/GameBoard";
import "./styles/App.css";

function App() {
  return (
    <div className="App">
      <h1>Memory Game (Deck of Cards + Green BG)</h1>
      <GameBoard />
    </div>
  );
}

export default App;
