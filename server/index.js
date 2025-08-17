const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = [];
let currentTurnIndex = 0;
let drawnNumbers = new Set();

function getNextTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % players.length;
  return players[currentTurnIndex];
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Register player
  socket.on("joinGame", (name) => {
    players.push({ id: socket.id, name });
    console.log(Player ${name} joined);
    if (players.length === 1) {
      io.emit("turnChanged", players[0].id); // first player starts
    }
  });

  // Draw number
  socket.on("drawNumber", () => {
    if (players[currentTurnIndex].id !== socket.id) {
      return; // Not your turn!
    }

    let number;
    do {
      number = Math.floor(Math.random() * 75) + 1; // 1-75 bingo
    } while (drawnNumbers.has(number));
    drawnNumbers.add(number);

    io.emit("numberDrawn", number);

    // Switch to next turn
    const nextPlayer = getNextTurn();
    io.emit("turnChanged", nextPlayer.id);
  });

  // Bingo claim
  socket.on("bingo", (playerName) => {
    io.emit("gameOver", 🎉 ${playerName} has won the game! 🎉);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    players = players.filter((p) => p.id !== socket.id);

    if (players.length === 0) {
      drawnNumbers.clear();
      currentTurnIndex = 0;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});