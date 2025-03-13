// src/components/GameBoard.jsx
import React, { useState, useEffect } from "react";
import Card from "./Card";
import "../styles/GameBoard.css";

// OPTIONAL: If you want a Firebase scoreboard
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

const scoresCollection = collection(db, "memoryScores");

// Shuffle array helper
function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Create new deck from deckofcardsapi
async function createNewDeck() {
  const res = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
  const data = await res.json();
  return data.deck_id; // e.g. "3p40paa87x90"
}

// Draw N cards from deck
async function drawCards(deckId, count = 8) {
  const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
  const data = await res.json();
  return data.cards; // array of card objects
}

const GameBoard = () => {
  const [cards, setCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);

  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // OPTIONAL: Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (gameStarted && !gameOver) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Shuffle / New Game
  const shuffleCards = async () => {
    // 1) create new deck
    const deckId = await createNewDeck();
    // 2) draw 8 distinct cards
    const drawn = await drawCards(deckId, 8);
    // 3) extract image URLs
    const images = drawn.map((c) => c.image);

    // 4) duplicate & shuffle
    const finalSet = shuffleArray([...images, ...images]);

    // reset states
    setCards(finalSet);
    setMatchedCards([]);
    setSelectedCards([]);
    setMoves(0);
    setTime(0);
    setGameOver(false);
    setGameStarted(false);
  };

  const handleCardClick = (index) => {
    if (!gameStarted) setGameStarted(true);

    if (
      selectedCards.length === 2 ||
      matchedCards.includes(index) ||
      selectedCards.includes(index)
    ) {
      return;
    }

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);

      const [first, second] = newSelected;
      if (cards[first] === cards[second]) {
        // match found
        setMatchedCards([...matchedCards, first, second]);
      }
      setTimeout(() => {
        setSelectedCards([]);
      }, 1000);
    }
  };

  // Check game over => scoreboard
  useEffect(() => {
    if (matchedCards.length === cards.length && cards.length > 0) {
      setGameOver(true);
      saveScoreToFirestore("Anonymous", moves, time);
    }
  }, [matchedCards, cards, moves, time]);

  // OPTIONAL: Save scoreboard
  const saveScoreToFirestore = async (username, movesVal, timeVal) => {
    try {
      await addDoc(scoresCollection, {
        username,
        moves: movesVal,
        time: timeVal,
        createdAt: new Date(),
      });
      fetchLeaderboard();
    } catch (err) {
      console.error("Error saving deck-of-cards score:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const q = query(scoresCollection, orderBy("moves"), orderBy("time"), limit(5));
      const snapshot = await getDocs(q);
      const topScores = [];
      snapshot.forEach((doc) => topScores.push(doc.data()));
      setLeaderboard(topScores);
    } catch (err) {
      console.error("Error fetching deck-of-cards leaderboard:", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="game-container">
      <h2>Moves: {moves} | Time: {time}s</h2>
      <button onClick={shuffleCards}>New Game</button>

      {!gameStarted && cards.length === 0 && <h3>Click "New Game" to start!</h3>}
      {gameOver && (
        <h3 className="game-over">
          🎉 Game Over! You won in {moves} moves! 🎉
        </h3>
      )}

      <div className="game-board">
        {cards.map((url, idx) => (
          <Card
            key={idx}
            imageUrl={url}
            isFlipped={
              selectedCards.includes(idx) || matchedCards.includes(idx)
            }
            onClick={() => handleCardClick(idx)}
          />
        ))}
      </div>

      <h2>Global Leaderboard</h2>
      {leaderboard.length === 0 && <p>No scores yet!</p>}
      {leaderboard.map((score, i) => (
        <p key={i}>
          {score.username} - {score.moves} moves, {score.time}s
        </p>
      ))}
    </div>
  );
};

export default GameBoard;
