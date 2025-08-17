const socket = io();

let roomId = null;
let myCard = null;
let marked = new Set();

function renderCard(card) {
  const div = document.getElementById("game");
  div.innerHTML = "<h2>Your Card</h2>";

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";

  card.forEach((row, r) => {
    const tr = document.createElement("tr");
    row.forEach((num, c) => {
      const td = document.createElement("td");
      td.innerText = num;
      td.style.border = "1px solid black";
      td.style.padding = "15px";
      td.style.cursor = "pointer";
      td.style.textAlign = "center";

      td.addEventListener("click", () => {
        const key = `${r},${c}`;
        if (marked.has(key)) {
          marked.delete(key);
          td.style.backgroundColor = "white";
        } else {
          marked.add(key);
          td.style.backgroundColor = "lightgreen";
        }
      });

      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  div.appendChild(table);

  // Add claim button
  const btn = document.createElement("button");
  btn.innerText = "Claim BINGO";
  btn.onclick = () => claimBingo();
  div.appendChild(btn);
}

function createRoom() {
  socket.emit("create_room", (res) => {
    roomId = res.roomId;
    myCard = res.card;
    renderCard(myCard);
    alert("Room created! ID: " + roomId);
  });
}

function joinRoom() {
  const id = document.getElementById("roomIdInput").value;
  socket.emit("join_room", { roomId: id }, (res) => {
    if (res.error) return alert(res.error);
    roomId = id;
    myCard = res.card;
    renderCard(myCard);
    alert("Joined room " + roomId);
  });
}

function drawNumber() {
  if (!roomId) return alert("Join a room first!");
  socket.emit("draw_number", { roomId });
}

function claimBingo() {
  const selectedNumbers = [];
  marked.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    selectedNumbers.push(myCard[r][c]);
  });

  socket.emit("claim_bingo", { roomId, markedCard: [selectedNumbers] });
}

socket.on("number_drawn", ({ number }) => {
  const div = document.getElementById("numbers");
  div.innerHTML += number + " ";
});

socket.on("bingo_winner", ({ winner }) => {
  alert("BINGO! Winner: " + winner);
});

socket.on("bingo_rejected", ({ reason }) => {
  alert("Bingo rejected: " + reason);
});
