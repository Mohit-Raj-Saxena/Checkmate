const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let gameOver = false;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex)=>{
        row.forEach((square,squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable= playerRole === square.color;
                pieceElement.addEventListener("dragstart",(e)=>{
                      if (pieceElement.draggable && !gameOver) {
                        draggedPiece=pieceElement;
                        sourceSquare={ row : rowindex , col : squareindex};
                        e.dataTransfer.setData("text/plain","");
                     }
                });
                pieceElement.addEventListener("dragend", (e)=>{
                    dragggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("dragover", (e)=>{
              e.preventDefault();
            });

            squareElement.addEventListener("drop", (e)=>{
                e.preventDefault();
                if(draggedPiece){
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSource);
                }
                
            })
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source,target) => {
      if (gameOver) return; 
      const move = {
            from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
            to: `${String.fromCharCode(97+target.col)}${8-target.row}`,
            promotion: "q"
      };
      socket.emit("move",move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: { w: "♙", b: "♟" },
        r: { w: "♖", b: "♜" },
        n: { w: "♘", b: "♞" },
        b: { w: "♗", b: "♝" },
        q: { w: "♕", b: "♛" },
        k: { w: "♔", b: "♚" }
    };
    return unicodePieces[piece.type][piece.color] || "";
};

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function(role){
    playerRole = null;
    renderBoard();
});

socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});

socket.on("move",function(move){
    chess.move(move);
    renderBoard();
});

socket.on("gameOver", (data) => {
    gameOver = true; // stop further moves
    if (data.draw) {
        alert("Game over: Draw!");
    } else {
        const winner = data.winner === socket.id ? "You won!" : "You lost!";
        alert("Game over! " + winner);
    }
});

renderBoard();