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
                    draggedPiece = null; // FIXED TYPO
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

const handleMove = (source, target) => {
    if (gameOver) return; 
    
    const fromSquare = `${String.fromCharCode(97+source.col)}${8-source.row}`;
    const toSquare = `${String.fromCharCode(97+target.col)}${8-target.row}`;
    
    // FIXED: Only add promotion if it's actually a pawn promotion
    const move = { from: fromSquare, to: toSquare };
    
    // Check if this is a pawn promotion
    const piece = chess.get(fromSquare);
    if (piece && piece.type === 'p') {
        // White pawn promoting to 8th rank or black pawn promoting to 1st rank
        if ((piece.color === 'w' && toSquare[1] === '8') || 
            (piece.color === 'b' && toSquare[1] === '1')) {
            move.promotion = 'q'; // Default to queen promotion
        }
    }
    
    socket.emit("move", move);
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
    gameOver = true;
    if (data.draw) {
        alert("Game over: Draw!");
    } else {
        const winner = data.winner === socket.id ? "You won!" : "You lost!";
        alert("Game over! " + winner);
    }
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move attempted:", move);
    // Optionally show user feedback
});

renderBoard();