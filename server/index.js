const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

let rooms = {};

function generateCard() {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5);

  const card = [];
  for (let i = 0; i < 5; i++) {
    card.push(numbers.slice(i * 5, i * 5 + 5));
  }
  return card;
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("create_room", (callback) => {
    const roomId = Math.random().toString(36).substr(2, 5);
    rooms[roomId] = { players: {}, numbersDrawn: [] };
    socket.join(roomId);
    rooms[roomId].players[socket.id] = { card: generateCard() };
    callback({ roomId, card: rooms[roomId].players[socket.id].card });
  });

  socket.on("join_room", ({ roomId }, callback) => {
    if (!rooms[roomId]) return callback({ error: "Room not found" });
    socket.join(roomId);
    rooms[roomId].players[socket.id] = { card: generateCard() };
    callback({ card: rooms[roomId].players[socket.id].card });
    io.to(roomId).emit("player_joined", {
      playerCount: Object.keys(rooms[roomId].players).length,
    });
  });

  socket.on("draw_number", ({ roomId }) => {
    if (!rooms[roomId]) return;

    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const remaining = allNumbers.filter(
      (n) => !rooms[roomId].numbersDrawn.includes(n)
    );
    if (remaining.length === 0) return;

    const number = remaining[Math.floor(Math.random() * remaining.length)];
    rooms[roomId].numbersDrawn.push(number);
    io.to(roomId).emit("number_drawn", { number });
  });

  socket.on("claim_bingo", ({ roomId, markedCard }) => {
    const numbersDrawn = rooms[roomId].numbersDrawn;
    let valid = true;

    markedCard.flat().forEach((num) => {
      if (num && !numbersDrawn.includes(num)) valid = false;
    });

    if (valid) {
      io.to(roomId).emit("bingo_winner", { winner: socket.id });
    } else {
      socket.emit("bingo_rejected", { reason: "Invalid claim" });
    }
  });

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
