var base;

onmessage = function(e) {
    base = e.data;
    new Grid(); //start mining
}


//define cell class
function Cell(row, column, box) {
    //add the cell to its row, column, and box
    row.addCell(this);
    column.addCell(this);
    box.addCell(this);
    //create references to the groups
    this.row = row;
    this.column = column;
    this.box = box;
    //array of possible values for this cell
    this.possibleValues = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].slice(0, base);
    this.coords = {x: row.cells.length-1, y: column.cells.length-1};
    this.value;
    this.displayedValue;
}
Cell.prototype.assignRandomValue = function() {
    if (this.value !== undefined) return; //can only assign if doesnt already have a value
    //assign a random index from the possible values array
    var rand = Math.floor(Math.random() * this.possibleValues.length);
    this.value = this.displayedValue = this.possibleValues[rand];
    //if value is undefined, we're going to swap it with a cell in the same box whose row and column will allow a missing value
    
    if (this.value === undefined) {
        
        //find whats needed in the box
        var needs = this.box.cells.reduce(function(a,b){
            var index = a.indexOf(b.value);
            if (index !== -1)
                a.splice(index, 1);
            return a;
        }, [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].slice(0, base));
        out:
        for (var n=0; n<needs.length; n++) {
            var needed = needs[n];
            //find a cell who's row and column dont contain the item in 'needed' and who's value can be placed in this cell
            for (var i=0; i<this.box.cells.length; i++) {
                var c = this.box.cells[i];
                if (c.getRowOutsideBox().every(function(x){return x.value !== needed;}) && this.getRowOutsideBox().every(function(x){return x.value !== c.value;})) {
                    if (c.getColOutsideBox().every(function(x){return x.value !== needed;}) && this.getColOutsideBox().every(function(x){return x.value !== c.value;})) {
                        //this cell fits the bill. assign its value to the undefined cell
                        this.value = this.displayedValue = c.value;
                        //then give it the needed value
                        c.value = c.displayedValue = needed;
                        c.box.removeValue(c.value);
                        //remove needed value from possible values of row and column of c. re-add the old value of the cell to each one if it IS possible
                        var row = c.getRowOutsideBox();
                        for (var i=0; i<row.length; i++) {
                            var cell = row[i];
                            var index = cell.possibleValues.indexOf(needed);
                            if (index !== -1)
                                cell.possibleValues.splice(index, 1);
                            //re-add old value if necessary
                            if (this.value !== undefined && cell.checkValue(this.value)) {
                                cell.possibleValues.push(this.value);
                            }
                        }
                        var col = c.getColOutsideBox();
                        for (var i=0; i<col.length; i++) {
                            var cell = col[i];
                            var index = cell.possibleValues.indexOf(needed);
                            if (index !== -1)
                                cell.possibleValues.splice(index, 1);
                            //re-add old value if necessary
                            if (this.value !== undefined && cell.checkValue(this.value))
                                cell.possibleValues.push(this.value);
                        }
                        if (this.value === undefined)
                            continue out;
                        else break out;
                    }
                }
            }
        }
    } //end of undefined if
    //remove that number from all group members
    this.row.removeValue(this.value);
    this.column.removeValue(this.value);
    this.box.removeValue(this.value);
    this.displayedValue = this.value;
    return this;
}
Cell.prototype.removePossibleValue = function(value) {
    var index = this.possibleValues.indexOf(value);
    if (index !== -1) {
        this.possibleValues.splice(index,1);
    }
    return this;
}
Cell.prototype.checkValue = function(value) {
    //check if this cell can possibly have value
    if (!this.box.containsValue(value))
        if (!this.column.containsValue(value))
            if (!this.row.containsValue(value))
                return true;
    return false;
}
Cell.prototype.getRowOutsideBox = function() {
    //all cells in the row that are not inside this's box
    var _this = this;
    return this.row.cells.filter(function(x){return !_this.box.cells.includes(x);});
}
Cell.prototype.getColOutsideBox = function() {
    //all cells in the column that are not inside this's box
    var _this = this;
    return this.column.cells.filter(function(x){return !_this.box.cells.includes(x);});
}

//define abstract Group class
function Group() {
    this.cells = []; //array of cell objects
}
Group.prototype.removeValue = function(value) {
    //remove possible value from all cells in this row
    for (var i=0; i<this.cells.length; i++) {
        this.cells[i].removePossibleValue(value);
    }
}
Group.prototype.addCell = function(cell) {
    this.cells.push(cell);
}
Group.prototype.containsValue = function(value) {
    //check if a value is present in the displayedValues of cells
    //var values = this.cells.reduce(function(a,b){return a.concat(b.displayedValue);}, []);
    return !this.cells.every(function(x){return x.displayedValue !== value});
    //return values.indexOf(value) !== -1;
}
Group.prototype.getPresentValues = function() {
    //array of all presently displayed values
    var array = [];
    for (var i=0; i<this.cells.length; i++) {
        if (this.cells[i].displayedValue !== '')
            array.push(this.cells[i].displayedValue);
    }
    //add in the previously hidden cell's value if its in this group
    //if (this.cells.indexOf(prevCell) !== -1) array.push(prevCell.value);
    return array;
}
Group.prototype.getBlanks = function(prevCell, recursed) {
    //an array of the indices of blank cells
    var blanks = [];
    var pc = this.cells.indexOf(prevCell);
    for (var i=0; i<this.cells.length; i++) {
        if (i === pc) continue; //dont count the last hidden cell
        //if (recursed.indexOf(this.cells[i]) !== -1) continue; //don't count cells that have been recursed over already
        if (this.cells[i].displayedValue === '')
            blanks.push(this.cells[i]);
    }
    if (blanks.length === 0) return false;
    else return blanks;
}

//define sudoku grid class
function Grid() {
    //repositories
    this.cells = [];
    this.rows = [];
    this.columns = [];
    this.boxes = [];
    this.lastRemoved; //last cell to have had its value hidden
    this.recursedCells = []; //array of blank cells that have already been recursed over by hideValue
    
    //build the grid structure
    for (var i=0; i<(base); i++) {
        this.rows.push(new Group());
        this.columns.push(new Group());
        this.boxes.push(new Group());
    }
    //generate cells
    for (var i=0; i<(base*base); i++) {
        //determine the indexes
        var rowIndex = Math.floor(i / base);
        var columnIndex = i % base;
        var boxIndex = Math.floor(columnIndex / Math.sqrt(base)) + Math.floor(rowIndex / Math.sqrt(base)) * Math.sqrt(base);
        //create the cell
        var cell = new Cell(this.rows[rowIndex], this.columns[columnIndex], this.boxes[boxIndex]);
        this.cells.push(cell);
    }
    //generate cell values
    this.generate();
}
Grid.prototype.generate = function() {
    //var order = [5,6,9,10,1,2,4,7,8,11,13,14,0,3,15,12];
    for (var i=0; i<this.boxes.length; i++) {
        this.boxes[i].cells.forEach(function(x){x.assignRandomValue();});
    }
    //do an additional pass for good measure
    for (var i=0; i<this.boxes.length; i++) {
        this.boxes[i].cells.forEach(function(x){x.assignRandomValue();});
    }
    //console.log('t');
    if (!this.cells.some(function(x){return x.value === undefined;})) {
        //puzzle was successfully created
        var result = this.cells.reduce(function(a,b) {return a + b.value + ',';}, '').slice(0,-1);
        //send to main thread.
        postMessage(result);
    }else{
        setTimeout(function() {
            new Grid();
        },0);
    }
}
Grid.prototype.getCellFromCoords = function(coords) {
    return this.cells.filter(function(x){
        if (x.coords.x === coords.x && x.coords.y === coords.y)
            return true;
        else return false;
    })[0];
}
