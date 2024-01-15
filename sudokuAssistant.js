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

function typeNumber(value) {
    switch (value) {
        case 1:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '1', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 2:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '2', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 3:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '3', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 4:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '4', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 5:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '5', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 6:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '6', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 7:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '7', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 8:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '8', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 9:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '9', 'black');
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
        case 10:
            writeToSingleHTMLInputBox(HTMLBoard[lastBoxSelected], '', 'black');
            if ((lastBoxSelected - 1) < 0) {
                lastBoxSelected = 80;
            } else {
                lastBoxSelected = (lastBoxSelected - 1);
            }
            break;
        case 11:
            if ((lastBoxSelected - 1) < 0) {
                lastBoxSelected = 80;
            } else {
                lastBoxSelected = (lastBoxSelected - 1);
            }
            break;
        case 12:
            lastBoxSelected = (lastBoxSelected + 1) % 81;
            break;
    }
    HTMLBoard[lastBoxSelected].focus();
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
    reset();
    let puzzleID = Math.floor(Math.random() * 100.0); //0 to 99
    //puzzleList is defined at the very bottom of this file to improve readability
    let puzzleString = puzzleList[puzzleID];
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
        } else {
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
    inputBox.inputMode = 'none';
    inputBox.maxLength = '1';
    inputBox.style.fontFamily = 'Helvetica, sans-serif';
    inputBox.style.fontSize = '24px';
    inputBox.style.width = '40px';
    inputBox.style.height = '40px';
    inputBox.style.textAlign = 'center';
    inputBox.style.border = '0px';
    inputBox.style.borderRadius = '0px';
    inputBox.style.padding = '0px';
    writeToSingleHTMLInputBox(inputBox, ''); // initial value is empty
    return inputBox;
}

function defineHTMLBoardNavigation() {

    HTMLBoard.forEach((inputBox, index) => {

        /* allow navigation with arrow keys */
        inputBox.addEventListener('keydown', (event) => {
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

        /* move to next box after user input */
        inputBox.addEventListener('input', () => {
            lastBoxSelected = (index + 1) % 81;
            HTMLBoard[lastBoxSelected].focus();
        });

        /* stores the last box the user clicked on */
        inputBox.addEventListener('click', () => {
            lastBoxSelected = index;
        });

    });//for each input box

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


// all public domain puzzles from https://www.kaggle.com/datasets/radcliffe/3-million-sudoku-puzzles-with-ratings/data
let puzzleList = [
    '1..5.37..6.3..8.9......98...1.......8761..........6...........7.8.9.76.47...6.312',
    '...81.....2........1.9..7...7..25.934.2............5...975.....563.....4......68.',
    '..5...74.3..6...19.....1..5...7...2.9....58..7..84......3.9...2.9.4.....8.....1.3',
    '........5.2...9....9..2...373..481.....36....58....4...1...358...42.......978...2',
    '.4.1..............653.....1.8.9..74...24..91.......2.8...562....1..7..6...4..1..3',
    '5...634.....7.....1...5.83.....18..7..69......43...9...............7..2.32.64.5..',
    '..346..2..58.2...1.2.9...8...1....9.2..783.........3....9..6..........56.6..7.21.',
    '38.1.........5.6.....9....3.4.........5.18.......9.561.6..2478.8.......6..4.8..2.',
    '.......2...75...9.6....4........7....25.961..9......83...6..85.....1.....4.32..7.',
    '.75.....34......1....672.....9..16.....3....5.2.56...49.7.4......38.9............',
    '..3.8.5...4.....9.7..15.4..98...1..5..2.7983...5.6....1....6.5.8.....7..........4',
    '7.98.5...6..1..8.........9.8..4...1.....5..4.2....7..5..6...789.2.9..........3.6.',
    '8..9........524.....5.1.67..2......45.17....3.......164....8..1....6...7......89.',
    '............86..79.....54............53.9......67..58.5....2.4327.6.....8.94...5.',
    '.7.16....4....7........8..2..9...2.52..9..1.....5.36..6..2..8..91......3..7.....6',
    '9.4.728.....8.36..8..9.....6.9....1..83..7.....7.....22...385.....729..6...6.....',
    '..61.4.9.35...9......25.........5..8......2...324...718...9.3...95...7...4.7.1...',
    '.....48..79.58........9.....75....4.1.62.............751.3..2....48....16.24..5..',
    '...6..8....35.4...65..217...6..............5..7138..2...7.1.6.4.1.......9....3..7',
    '....3.76.5....91.29.........49..53.......327...52..........75.4..1.4.....6.......',
    '...8.....86....95.3.9..24.8.....132.6.......52...................19.3.4...2..4.3.',
    '.5.....43.1.....82.84..7.1..71.9....4.........23.1..6.8..1...26...7.4......9.2...',
    '7.82...6...4..8..9..1.5............2..6..1.4.3.....67..4.1.........45.87..5.7...3',
    '3...6..42.....5....61.3.....8...7..67...2.1.5.9....3......13...5....6.93..74.....',
    '..3..9........23......5..876.......53.94.....4....523...7.13.....6..8.9...12.....',
    '....27....13..4.....9..57...8....3..5..9..1......32...651....4...8....9.....4.6.5',
    '6.....2...713.....39.4...7...3..289..1..8...4...5..1...6...854.........1..82.....',
    '.....8...2.3...4.6..54.37....4...6...9.8.....5..9.4..27..589..34..2...7..........',
    '.9.....8.5......96......4..6..34....9......2.2...6..17.1....8...6..17..97...95...',
    '2...7..4.1.93........8..2..56...78.17.........9.26..3...573...46...1..98.........',
    '5..6..7..38.....4.1..3.4..5.6.8..2..45.2..........157.6...1............8....4.137',
    '.4...8.....6.2......57....8.52..7...1..35....4....27...7.9...64.......1....431..2',
    '..6...51..52.7......761.....8.....5.7....2698..4..7.....926........9.3........16.',
    '......27..9.2......4.9.6.....6........16.53..2...98...75.46......8...1.....3....7',
    '..7.....34...6..12.....37..1.8.57.......8..6......21...........6...459....9....87',
    '1.........9.....6.82.4...9..6....8..2...987...4.27.3.....7...15.....6.3..5....9..',
    '...86.9.5.8.....217....4..862...543.5...7........4.6......92.8..61...5...........',
    '39..8.....6...347..7.6.2..3.2.1.......52..9..6....5.....2..7.....9.4.5.....8.....',
    '3....5.78...6.7....6..1.4..6.....3.7..49...6.........442............8.51.13..67..',
    '...82.4..52..4..1.6.......7.4...9.2...25.....9.37....6..8.1.......2...3.........5',
    '5.7.....8..6.4...7.937........3.7.5..3..2......2..18.........1.1..4...9.9.4..3...',
    '.8.....9...5.8.7..7....9..4.16.42....3..9.1.78...3....4.....5...2.5...1.....1.9..',
    '.6.5...7.8.5..3..2.2......57...8..9..8..6...4...4..3.........3....7.56....3.98...',
    '1..7.8..6.45...2.......1.9...439............8.3.1..........9.7..9...6..5.5.27....',
    '...92...1....57...9..3.6.42.9217...4.3........6...9...4...3....6....8....27...6..',
    '....2639..........2.83.....7.9....8.35...9.1....2....6....516..4.......7......53.',
    '...2.1.3...1...4..7......95....4.91...43.7...1.69.....6...2...7.5...9...2..6...5.',
    '......6.....4...97...7.18.247..18......2....639...4.1..5....1..7...5......48.9.6.',
    '93..2..6...2...7..6....89......45..9.4.6.......7.....8.5.......7......2...9..78..',
    '.4.1...39........6.65...2..8..461........847.......9..38...4.1....3.......72.....',
    '95..6...4...8.........5..1...6..1..92.....3..4....98...13...7..67...2..........35',
    '7....1..3..5.2.9..3.9...17..........968..2.........6.8....83.1..7.4.....581....9.',
    '.98...3.2..7.9.....6.32..7............6.89..48....4....8.6..15...14..7.......74..',
    '.........68.....49....7...51.8..6...3679..8.....7......4.82..377.5.1..9........2.',
    '...5...2...84.76...1..6....6.....7...81..9..2..7..85..2..8...5..............21.3.',
    '2.9....8......8..6....9.....5.7..3.4.8..1...2.1.6.37...9.26..5.3..........1..7...',
    '.4..8.......3...97.3..7..5.5.2.4.7.88.....2.....9..........4...6.78..9....475...1',
    '.............8..2..8.3.69.13..2......6.....72.4.1....5..97.....2..5..34......9...',
    '....3....16..........1.5........94..42..8..6.7.....5.2..18..6....95....7....6394.',
    '...49..6...6....58.5...7..4......53159..8...62.....4.......3....4......2..21.....',
    '.6497....5....1...9...4.5......32......7..42...8.1..5.735.....969..8..7.......6..',
    '24..6..7.....91...........1...2....9.1..897..5.9...3...5.62...4.7...865...65.....',
    '9..6....5........1.31.4.7......586.7..2.1..4.......9..4....5.8..5.1.9.....9.7....',
    '.2348.5........3.9...5...4.6...1.2...87.2.....1..3..5........6...82..1.4.3..9....',
    '....8....46..1.3......37...94....2.3...9....1..8..46.7..3....7.6......5415.......',
    '6...7.....173.6...4.........9.2.35.....7.4.82.2..9....9...17..32.....7.1....3..65',
    '6..1..2....1.9......8...6..27.6.........47..6...95.8..15..3.4...6...9....3....5.7',
    '.4...3...86....7.37...1.........198....4.2.5.......6..6.5.7.824.........23......6',
    '..95....23.......5..5..41....3.7649.6......8...72........79....1...6.......48..6.',
    '..149.7.......79..3..........5...3.9..3.58...........4..76..4..1.2.......3.2.5.87',
    '.3..8...54.7...62........8.....24.968...........6.14......59...2.5.16..9.7.......',
    '.32......64...1..9..589.......7.3.......4..63..9.6..8.......63........97..7..5...',
    '...4..56..1.5.6.9.....973....9.2..4.6....5......37....5.2.......63.........96.8..',
    '4.6..5.7...736...4..2.1....1...574.9....8...18.....2.....4..5.6..8.....7..1..9...',
    '...91......93.458.5.......1..71.3.....5.9...6...48..3....2..84.1.3....6......8...',
    '..14.5...3..2.7.........92.....891....2...43.......8..43.7...8.7.......6.......59',
    '......32.4...1...91.....7..........43.946......827.......9...63...3.25...2.......',
    '2.....54..9.81.....83.......6...3..5..4....6.3..7...9.....6.7.3...27....5.1.....4',
    '43.........5.3...9..19...8...4...1...6..7.4....84....7...15..9..9...321.3........',
    '.8.....74...1.5.3..6..4.8..4.7..3...9...6...8.18..7........61...3...16...4..5....',
    '.....2.8..4.15.........63.5.3...91..7.4.3...9....41.2......7...8...1..3.1.....67.',
    '...13....63....8.25............65..1.4..2...62.69...4.8......9..572..3....2.7..5.',
    '9...6......3.5.4...4.7..39..7..8..59....2...14..6.....6..5..........95....1.4..3.',
    '...34...5.9..2...3........454...6..9..3..2.8....5......2..8.93.6.4....7....7.....',
    '......76.3.4....98.69........3.8.6...1..2.....7.........7..9.84.9.3.....8...15..7',
    '257..8....9............4.6....5..74.......9..37....5.87.49.......1....3....23.6..',
    '9.2....1.....6...81....7.3..1...........2.5....3.1..8.4..3.......54....632..98...',
    '..7.9....3.6.4...7.........9.567.1...3...1..6.......74.4.2....1...1.....5.8..3..2',
    '6..34.5....9.5.4.8....8.....61...74....4..3.......6.2.1...6..5.8.4.....77....1...',
    '8.36.....716.5.4..4.......1....7.....35..4.7....9.6.1....1.....98.2...........32.',
    '5..42.87.64.......3.8.....5.7...3.41...2......81...2.6.6....91....73.............',
    '6.43........5.62.9........73.9..8...51..............759.........2..47.1.7.5..3.6.',
    '..9.6.....219...8..3...7.9.......154.1........7.........3.1.6.....35.9..89.2...4.',
    '..24..83.....7....5.83..7.98.........23...15.49..2......7.1.......2.5..6..4...2..',
    '.6.3.21....47....37......8.2..5......1.....76....1.9.......379...8.....44..6.8.2.',
    '4.9.2..85..7.....6.264.........4..5...5...7..8.2.9............9....321.72...1....',
    '.53.8......7.9.2.......2.1..8.....2.512...486........1....2..4..6.1.......46...3.',
    '8.1....9..4..3.2..7.....158...........4..9...5..17.93....4.6....5.........791..8.',
    '7..4........1..96.....3..5....7....9.3.6.2.....9..1..619..4.3..4.....1.82.......7',
    '....9....46.....7...9...51...53...4...3.2.8..8............819.7..16....223.......'
];
