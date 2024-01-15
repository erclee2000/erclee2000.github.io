/******************************* GLOBAL VARIABLES ********************************/
let HTMLBoard = null;
const internalBoard = new Array(9).fill(0).map(row => row = new Array(9).fill(0));
let lastBoxSelected = -1;
let numPermutations = 0;
let instruction = null;

/********************************** STARTUP ***********************************/
initializeHTMLBoard();
reset();
/****************************** BUTTON FUNCTIONS ******************************/
function revealOne() {
    if (lastBoxSelected !== -1) {
        if (findSolution()) {
            let r = Math.floor(lastBoxSelected / 9);
            let c = lastBoxSelected % 9;
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], internalBoard[r][c], 'gray');
            writeInstruction('navy', 'the answer for row ' + (r + 1) + ', col ' + (c + 1) + ' has been revealed');
        }
        lastBoxSelected = -1;
    } else {
        writeInstruction('crimson', 'first select the box that you want revealed');
    }
}

function revealAll() {
    if (findSolution()) {
        copyInternalBoardToHTMLBoard();
        writeInstruction('navy', 'assistant tried ' + numPermutations.toLocaleString() + ' permutations to solve the puzzle');
    }
}

function reset() {
    for (let r = 0; r < 9; r++) {
        internalBoard[r].fill(0);
    }
    lastBoxSelected = -1;
    copyInternalBoardToHTMLBoard();
    writeInstruction('black', 'enter the puzzle you would like help with below');
}

function loadPuzzle() {
    // all public domain puzzles from https://www.kaggle.com/datasets/radcliffe/3-million-sudoku-puzzles-with-ratings/data
    reset();
    let puzzleNum = 1 + Math.floor(Math.random() * 10.0); //1 to 10
    let puzzleString;
    switch (puzzleNum) {
        case 1:
            puzzleString = "1..5.37..6.3..8.9......98...1.......8761..........6...........7.8.9.76.47...6.312";
            break;
        case 2:
            puzzleString = "...81.....2........1.9..7...7..25.934.2............5...975.....563.....4......68.";
            break;
        case 3:
            puzzleString = "..5...74.3..6...19.....1..5...7...2.9....58..7..84......3.9...2.9.4.....8.....1.3";
            break;
        case 4:
            puzzleString = "........5.2...9....9..2...373..481.....36....58....4...1...358...42.......978...2";
            break;
        case 5:
            puzzleString = ".4.1..............653.....1.8.9..74...24..91.......2.8...562....1..7..6...4..1..3";
            break;
        case 6:
            puzzleString = "5...634.....7.....1...5.83.....18..7..69......43...9...............7..2.32.64.5..";
            break;
        case 7:
            puzzleString = "..346..2..58.2...1.2.9...8...1....9.2..783.........3....9..6..........56.6..7.21.";
            break;
        case 8:
            puzzleString = "38.1.........5.6.....9....3.4.........5.18.......9.561.6..2478.8.......6..4.8..2.";
            break;
        case 9:
            puzzleString = ".......2...75...9.6....4........7....25.961..9......83...6..85.....1.....4.32..7.";
            break;
        case 10:
            puzzleString = ".75.....34......1....672.....9..16.....3....5.2.56...49.7.4......38.9............";
            break;
        default:
            puzzleString = ".................................................................................";
            break;
    }
    const clues = puzzleString.split('');
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (clues[r * 9 + c] === '.') {
                internalBoard[r][c] = 0;
            } else {
                internalBoard[r][c] = Number(clues[r * 9 + c]);
            }
        }
    }
    copyInternalBoardToHTMLBoard();
    findSolution(); //solve the loaded puzzle
    writeInstruction('navy', 'randomly selected a puzzle');
}

/****************************** SOLVING FUNCTIONS ******************************/
function findSolution() {
    // 1. check if we previously solved
    // 2. if no, read in the board that user has entered
    // 3. run a basic check to see if user's clues are valid (e.g., duplicates in a row, box, column)
    // 4. check if puzzle can be solved with given clues
    // 5. if puzzle is solvable with given clues, return true, else false
    if (!haveSolution()) {
        copyHTMLBoardToInternalBoard();
        if (validClues()) {
            numPermutations = 0;
            let done = [false]; //using array to 'pass by reference'; don't want to make copy for each recursive call
            depthFirstSearch(0, 0, done);
            if (!haveSolution()) {
                writeInstruction('crimson', 'starting with the numbers entered below, no solution exists');
                return false;
            }        
        }else{
            return false;
        }
    }
    return true;
}

function haveSolution() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (internalBoard[r][c] === 0)
                return false;
    return true;
}

function validClues() {
    let numClues = 0;
    let isValid = true;
    let invalidR = -1;
    let invalidC = -1;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (internalBoard[r][c] !== 0) {
                let clue = internalBoard[r][c];
                internalBoard[r][c] = 0; //take out the clue so we don't check the clue against itself
                if (!isValidEntry(r, c, clue)) {
                    isValid = false;
                    invalidR = r;
                    invalidC = c;
                }
                internalBoard[r][c] = clue; //put the clue back after check
                numClues++;
            }
        }
    }
    if (!isValid) {
        instruction.style.color = 'crimson'
        instruction.textContent = 'a valid sudoku must not repeat a value (please check row ' + (invalidR + 1) + ', col ' + (invalidC + 1) + ')';
    }
    if (numClues < 17) {
        isValid = false;
        instruction.style.color = 'crimson'
        instruction.textContent = 'a valid sudoku must have at least 17 clues';
        // https://www.technologyreview.com/2012/01/06/188520/mathematicians-solve-minimum-sudoku-problem/
    }
    return isValid;
}

function depthFirstSearch(r, c, done) {
    if (c === 9) {//already finished a row, so start on next row
        r++;
        c = 0;
    }
    if (r === 9) {//finished last row, so we have a solution or none exists
        done[0] = true;
        return;
    }
    if (internalBoard[r][c] === 0) {//a blank value
        for (let guess = 1; guess < 10 && !done[0]; guess++) {
            numPermutations++;
            if (isValidEntry(r, c, guess)) {
                internalBoard[r][c] = guess;
                depthFirstSearch(r, c + 1, done);
            }
        }
        if (!done[0])
            internalBoard[r][c] = 0;
    } else {
        if (!done[0])
            depthFirstSearch(r, c + 1, done);
    }
}

function isValidEntry(row, col, entry) {
    //check row 
    for (let c = 0; c < 9; c++) {
        if (internalBoard[row][c] === entry)
            return false;
    }
    //check column
    for (let r = 0; r < 9; r++) {
        if (internalBoard[r][col] === entry)
            return false;
    }
    //check box
    let start_row = row - (row % 3);
    let start_col = col - (col % 3);
    for (let r = start_row; r < start_row + 3; r++) {
        for (let c = start_col; c < start_col + 3; c++) {
            if (internalBoard[r][c] === entry)
                return false;
        }
    }
    return true;
}

/****************************** HTML/UI FUNCTIONS ******************************/
function initializeHTMLBoard() {

    HTMLBoard = createHTMLBoard();
    defineHTMLBoardNavigation();

    instruction = document.getElementById('instruction1');
    instruction.style.fontSize = '11px';
}

function createHTMLBoard() {
    const board1 = document.getElementById('board1'); //board1 is an html table
    board1.style.borderCollapse = 'collapse';
    board1.style.border = '2px solid gray';

    /* create 9x9 grid */
    for (let r = 0; r < 9; r++) {
        let tableRow = document.createElement('tr');
        tableRow.style.border = '0px';
        for (let c = 0; c < 9; c++) {
            let tableCell = createTableCell(r, c);
            tableCell.appendChild(createInputBox());//each cell has one inputbox
            tableRow.appendChild(tableCell);
        }
        board1.appendChild(tableRow);
    }
    return document.querySelectorAll('input');
}

function createTableCell(r, c) {
    const tableCell = document.createElement('td');
    tableCell.style.padding = '0px';
    tableCell.style.border = '1px solid gray';
    if (r === 2 || r === 5) {
        tableCell.style.borderBottom = '2px solid gray';
    }
    if (c === 2 || c === 5) {
        tableCell.style.borderRight = '2px solid gray';
    }
    return tableCell;
}

function createInputBox() {
    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.pattern = '[1-9]{1}';
    inputBox.inputMode = 'numeric';
    inputBox.maxLength = '1';
    inputBox.style.fontFamily = 'Helvetica, sans-serif';
    inputBox.style.fontSize = '18px';
    inputBox.style.width = '26px';
    inputBox.style.height = '26px';
    inputBox.style.textAlign = 'center';
    inputBox.style.border = '0px';
    inputBox.style.borderRadius = '0px';
    writeToSingleHTMLInputBox(inputBox, ''); // initial value is empty
    return inputBox;
}

function defineHTMLBoardNavigation() {
    /* automatically move to next box once user enters a number */
    HTMLBoard.forEach((inputBox, index) => {
        inputBox.addEventListener('input', () => {
            HTMLBoard[(index + 1) % 81].focus();
        });
    });

    /* allows user to navigate board with arrow keys, stores last box navigated to */
    HTMLBoard.forEach((box, index) => {
        box.addEventListener('keydown', (event) => {
            let nextIndex = -1;
            const keyCode = event.keyCode;
            if (keyCode === 38) { //up w/ wrap around
                if (HTMLBoard[index - 9]) {
                    nextIndex = index - 9;
                } else {
                    nextIndex = (index + 71) % 81;
                }
            } else if (keyCode === 40) { //down w/ wrap around
                if (HTMLBoard[index + 9]) {
                    nextIndex = index + 9;
                } else {
                    nextIndex = (index + 10) % 81;
                }
            } else if (keyCode === 37) { //left w/ wrap around
                if (HTMLBoard[index - 1]) {
                    nextIndex = index - 1;
                } else {
                    nextIndex = HTMLBoard.length - 1;
                }
            } else if (keyCode === 39) { //right w/ wrap around
                if (HTMLBoard[index + 1]) {
                    nextIndex = index + 1;
                } else {
                    nextIndex = 0;
                }
            }
            if (nextIndex !== -1)
                HTMLBoard[nextIndex].focus();
            lastBoxSelected = nextIndex;
        });
    });

    /* stores the last box the user clicked on */
    HTMLBoard.forEach((box, index) => {
        box.addEventListener('click', () => {
            lastBoxSelected = index;
        });
    });
}

function copyHTMLBoardToInternalBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (HTMLBoard[r * 9 + c].value !== '') {
                internalBoard[r][c] = Number(HTMLBoard[r * 9 + c].value);
            } else {
                internalBoard[r][c] = 0;
            }
        }
    }
}

function copyInternalBoardToHTMLBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            writeToSingleHTMLInputBox(HTMLBoard[r * 9 + c], internalBoard[r][c], 'black');
        }
    }
}

function writeToSingleHTMLInputBox(box, value, color) {
    box.style.color = color;
    if (value === 0 || value === '')
        box.value = '';
    else
        box.value = String(value);
}

function writeInstruction(color, text) {
    instruction.style.color = color;
    instruction.textContent = text;
}