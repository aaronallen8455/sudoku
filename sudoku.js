window.onload = function() {
    //Number system to use. Must a square number.
    const base = 9;
    var charArray = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].slice(0, base);

    //define cell class
    function Cell(row, column, box, grid) {
        //add the cell to its row, column, and box
        row.addCell(this);
        column.addCell(this);
        box.addCell(this);
        //create references to the groups
        this.row = row;
        this.column = column;
        this.box = box;
        this.grid = grid;
        //array of possible values for this cell
        this.possibleValues = charArray.slice(0);
        this.coords = {x: row.cells.length-1, y: column.cells.length-1};
        this.value;
        //The table td element associated with this cell
        this.element = document.createElement('td');
        this.isSelected = false;
        var self = this;
        this.element.addEventListener('click', function(){
            //select this element on click. deselect all others
            self.grid.cells.forEach(function(x){
                if (x.isSelected) {
                    x.isSelected = false;
                x.element.classList.remove('selected');
                }
            });
            self.isSelected = true;
            this.classList.add('selected');
        }, false);
        //if the cell is selected and the correct key is pressed, fill in the missing value
        document.addEventListener('keydown', function(e) {
            if (self.isSelected) {
                var char = e.code.substr(-1);
                if (self.element.innerHTML === '' && char == self.value)
                    self.element.innerHTML = char;
            }
        }, true);
    }
    Cell.prototype.assignRandomValue = function() {
        if (this.value !== undefined) return; //can only assign if doesnt already have a value
        //assign a random index from the possible values array
        var rand = Math.floor(Math.random() * this.possibleValues.length);
        this.value = this.element.innerHTML = this.possibleValues[rand];
        //if value is undefined, we're going to swap it with a cell in the same box whose row and column will allow a missing value

        if (this.value === undefined) {

            //find whats needed in the box
            var needs = this.box.cells.reduce(function(a,b){
                var index = a.indexOf(b.value);
                if (index !== -1)
                    a.splice(index, 1);
                return a;
            }, charArray.slice(0));
            out:
            for (var n=0; n<needs.length; n++) {
                var needed = needs[n];
                //find a cell who's row and column dont contain the item in 'needed' and who's value can be placed in this cell
                for (var i=0; i<this.box.cells.length; i++) {
                    var c = this.box.cells[i];
                    if (c.getRowOutsideBox().every(function(x){return x.value !== needed;}) && this.getRowOutsideBox().every(function(x){return x.value !== c.value;})) {
                        if (c.getColOutsideBox().every(function(x){return x.value !== needed;}) && this.getColOutsideBox().every(function(x){return x.value !== c.value;})) {
                            //this cell fits the bill. assign its value to the undefined cell
                            this.value = this.element.innerHTML = c.value;
                            //then give it the needed value
                            c.value = c.element.innerHTML = needed;
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
        this.element.innerHTML = this.value;
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
        //check if a value is present in the element.innerHTMLs of cells
        //var values = this.cells.reduce(function(a,b){return a.concat(b.element.innerHTML);}, []);
        return !this.cells.every(function(x){return x.element.innerHTML !== value});
        //return values.indexOf(value) !== -1;
    }
    Group.prototype.getPresentValues = function() {
        //array of all presently displayed values
        var array = [];
        for (var i=0; i<this.cells.length; i++) {
            if (this.cells[i].element.innerHTML !== '')
                array.push(this.cells[i].element.innerHTML);
        }
        //add in the previously hidden cell's value if its in this group
        //if (this.cells.indexOf(prevCell) !== -1) array.push(prevCell.value);
        return array;
    }
    Group.prototype.getBlanks = function() {
        //an array of the indices of blank cells
        var blanks = [];
        //var pc = this.cells.indexOf(prevCell);
        for (var i=0; i<this.cells.length; i++) {
            //if (i === pc) continue; //dont count the last hidden cell
            //if (recursed.indexOf(this.cells[i]) !== -1) continue; //don't count cells that have been recursed over already
            if (this.cells[i].element.innerHTML === '')
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
            var cell = new Cell(this.rows[rowIndex], this.columns[columnIndex], this.boxes[boxIndex], this);
            this.cells.push(cell);
        }
        //generate cell values
        //this.generate();
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
            //reset possible values
            for (var i=0; i<this.cells.length; i++) {
                this.cells[i].possibleValues = [this.cells[i].value];
            }
            //hide values
            this.hideValue();
            console.log(this.cells.filter(function(x){return x.element.innerHTML === '';}).length);
            tableOut(this);
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
    Grid.prototype.hideValue = function(){
        
        //get cells that have only 1 possible value and are not hidden
        var cells = this.cells.filter(function(x){return (x.possibleValues.length === 1 && x.element.innerHTML !== '');});
        if (cells.length === 0) { //got as far as we can with scanning, try advanced logic.
            //check for X wing conditions
            //only two possible cells for a value in each of two different rows
            //and these candidates lie also in the same column
            //then all other candidates for this value in the columns can be eliminated.
            //same if switching rows for columns.
            for (var i=0; i<this.rows.length; i++) {
                var row = this.rows[i];
                //start by getting the values not present in group
                var missing = row.cells.reduce(function(a,b){
                    var index = a.indexOf(b.element.innerHTML);
                    if (index !== -1)
                        a.splice(index, 1);
                    return a;
                }, charArray.slice(0));
                for (var p=0; p<missing.length; p++) {
                    //check if there are only two cells that can have this value in the row
                    var pair1 = row.cells.filter(function(x){
                        return (x.possibleValues.indexOf(missing[p]) !== -1);
                    });
                    if (pair1.length === 2) {
                        //try to find second pair where cells are in the same columns as pair 1
                        for (var r=0; r<this.rows.length; r++) {
                            if (r === i) continue;
                            var c1 = this.rows[r].cells[pair1[0].coords.x];
                            var c2 = this.rows[r].cells[pair1[1].coords.x];
                            if (c1.possibleValues.length > 1 && c1.possibleValues.indexOf(missing[p]) !== -1) {
                                if (c2.possibleValues.length > 1 && c2.possibleValues.indexOf(missing[p]) !== -1) {
                                    if (this.rows[r].cells.filter(function(x){ return (x.possibleValues.indexOf(missing[p]) !== -1);}).length === 2) {
                                        //remove this value from all cells in these 2 columns not in the pairs
                                        for (var o=0; o<c1.column.cells.length; o++) {
                                            if (o === i || o === r) continue
                                            var index = c1.column.cells[o].possibleValues.indexOf(missing[p]);
                                            if (index !== -1)
                                                c1.column.cells[o].possibleValues.splice(index, 1);
                                        }
                                        for (var o=0; o<c2.column.cells.length; o++) {
                                            if (o === i || o === r) continue
                                            var index = c2.column.cells[o].possibleValues.indexOf(missing[p]);
                                            if (index !== -1)
                                                c2.column.cells[o].possibleValues.splice(index, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //now check the columns for x-wing
            for (var i=0; i<this.columns.length; i++) {
                var column = this.columns[i];
                //start by getting the values not present in group
                var missing = column.cells.reduce(function(a,b){
                    var index = a.indexOf(b.element.innerHTML);
                    if (index !== -1)
                        a.splice(index, 1);
                    return a;
                }, charArray.slice(0));
                for (var p=0; p<missing.length; p++) {
                    //check if there are only two cells that can have this value in the column
                    var pair1 = column.cells.filter(function(x){
                        return (x.possibleValues.length > 1 && x.possibleValues.indexOf(missing[p]) !== -1);
                    });
                    if (pair1.length === 2) {
                        //try to find second pair where cells are in the same columns as pair 1
                        for (var r=0; r<this.columns.length; r++) {
                            if (r === i) continue;
                            var c1 = this.columns[r].cells[pair1[0].coords.y];
                            var c2 = this.columns[r].cells[pair1[1].coords.y];
                            if (c1.possibleValues.length > 1 && c1.possibleValues.indexOf(missing[p]) !== -1) {
                                if (c2.possibleValues.length > 1 && c2.possibleValues.indexOf(missing[p]) !== -1) {
                                    if (this.columns[r].cells.filter(function(x){ return (x.possibleValues.indexOf(missing[p]) !== -1);}).length === 2) {
                                        //remove this value from all cells in these 2 rows not in the pairs
                                        for (var o=0; o<c1.row.cells.length; o++) {
                                            if (o === i || o === r) continue
                                            var index = c1.row.cells[o].possibleValues.indexOf(missing[p]);
                                            if (index !== -1)
                                                c1.row.cells[o].possibleValues.splice(index, 1);
                                        }
                                        for (var o=0; o<c2.row.cells.length; o++) {
                                            if (o === i || o === r) continue
                                            var index = c2.row.cells[o].possibleValues.indexOf(missing[p]);
                                            if (index !== -1)
                                                c2.row.cells[o].possibleValues.splice(index, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            //hidden candidates
            //if two cells in a row/column share 2 possible values
            //and no other cell in the group can have these values
            //remove any other possible values from these 2 cells
            for (var i=0; i<this.rows.length; i++) {
                for (var p=0; p<charArray.length; p++) {
                    var pair = this.rows[i].cells.filter(function(x) {return (x.possibleValues.indexOf(charArray[p]) !== -1);});
                    if (pair.length === 2) {
                        //check for second value
                        for (var n=0; n<charArray.length; n++) {
                            if (n === p) continue;
                            if (pair[0].possibleValues.indexOf(charArray[n]) !== -1 && pair[1].possibleValues.indexOf(charArray[n]) !== -1) {
                                if (this.rows[i].cells.filter(function(x) {return (x.possibleValues.indexOf(charArray[n]) !== -1);}).length === 2) {
                                    //we found a pair.
                                    var otherValues1 = pair[0].possibleValues.filter(function(x){return (x !== charArray[n] && x !== charArray[p]);});
                                    var otherValues2 = pair[1].possibleValues.filter(function(x){return (x !== charArray[n] && x !== charArray[p]);});
                                    pair[0].possibleValues = [charArray[p], charArray[n]];
                                    pair[1].possibleValues = [charArray[p], charArray[n]];
                                    for (var s=0; s<otherValues1.length; s++) {
                                        var left = this.rows[i].cells.filter(function(x) {return (x.element.innerHTML === otherValues1[s]);});
                                        if (left.length === 1) {
                                            left[0].element.innerHTML = '';
                                        }
                                    }
                                    for (var s=0; s<otherValues2.length; s++) {
                                        var left = this.rows[i].cells.filter(function(x) {return (x.element.innerHTML === otherValues2[s]);});
                                        if (left.length === 1) {
                                            left[0].element.innerHTML = '';
                                        }
                                    }
                                    //recurse
                                    //this.hideValue.call(this);
                                    console.log('hidden row');
                                    //return;
                                }
                            }
                        }
                    }
                }
            }
            //repeat for columns
            for (var i=0; i<this.columns.length; i++) {
                for (var p=0; p<charArray.length; p++) {
                    var pair = this.columns[i].cells.filter(function(x) {return (x.possibleValues.indexOf(charArray[p]) !== -1);});
                    if (pair.length === 2) {
                        //check for second value
                        for (var n=0; n<charArray.length; n++) {
                            if (n === p) continue;
                            if (pair[0].possibleValues.indexOf(charArray[n]) !== -1 && pair[1].possibleValues.indexOf(charArray[n]) !== -1) {
                                if (this.columns[i].cells.filter(function(x) {return (x.possibleValues.indexOf(charArray[n]) !== -1);}).length === 2) {
                                    //we found a pair.
                                    var otherValues1 = pair[0].possibleValues.filter(function(x){return (x !== charArray[n] && x !== charArray[p]);});
                                    var otherValues2 = pair[1].possibleValues.filter(function(x){return (x !== charArray[n] && x !== charArray[p]);});
                                    pair[0].possibleValues = [charArray[p], charArray[n]];
                                    pair[1].possibleValues = [charArray[p], charArray[n]];
                                    for (var s=0; s<otherValues1.length; s++) {
                                        var left = this.columns[i].cells.filter(function(x) {return (x.element.innerHTML === otherValues1[s]);});
                                        if (left.length === 1) {
                                            left[0].element.innerHTML = '';
                                        }
                                    }
                                    for (var s=0; s<otherValues2.length; s++) {
                                        var left = this.columns[i].cells.filter(function(x) {return (x.element.innerHTML === otherValues2[s]);});
                                        if (left.length === 1) {
                                            left[0].element.innerHTML = '';
                                        }
                                    }
                                    //recurse
                                    //this.hideValue.call(this);
                                    console.log('hidden column');
                                    //return;
                                }
                            }
                        }
                    }
                }
            }
            
            //check for naked pairs in rows and columns

            //check for naked pairs in box
            if (this.cells.filter(function(x){return (x.possibleValues.length === 1 && x.element.innerHTML !== '');}).length === 0)
                return;
            else {
                console.log('re');
                this.hideValue.call(this);
                return;
            }
        }
        //pick a random cell
        var rand = Math.floor(Math.random() * cells.length);
        var cell = cells[rand];
        //if that cell has only one possible value, hide it
        cell.element.innerHTML = '';
        //tableOut(this);
        //for all cells in cell's groups, add cell's value to possible values if it could possible have that value.
        for (var i=0; i<cell.row.cells.length; i++) {
            var c = cell.row.cells[i];
            if (c.checkValue(cell.value) && c.possibleValues.indexOf(cell.value) === -1)
                c.possibleValues.push(cell.value);
        }
        for (var i=0; i<cell.column.cells.length; i++) {
            var c = cell.column.cells[i];
            if (c.checkValue(cell.value) && c.possibleValues.indexOf(cell.value) === -1)
                c.possibleValues.push(cell.value);
        }
        for (var i=0; i<cell.box.cells.length; i++) {
            var c = cell.box.cells[i];
            if (c.checkValue(cell.value) && c.possibleValues.indexOf(cell.value) === -1)
                c.possibleValues.push(cell.value);
        }
        //recurse until all hideable values are hidden
        this.hideValue.call(this);
    }


    //start proccessing
    //new Grid();

    //output to the table
    function tableOut(grid) {
        var table = document.getElementById('sudoku');
        while (table.firstChild) table.firstChild.remove();
        for (var i=0; i<base; i++) {
            var row = document.createElement('tr');
            for (var p=0; p<base; p++) {
                var data = grid.cells[p+i*base].element;
                //data.innerHTML = grid.cells[p+i*base].element.innerHTML;
                //create a checkerboard pattern in the boxes
                var boxIndex = grid.boxes.indexOf(grid.cells[p+i*base].box);
                if (!(base % 2) && boxIndex % (2*Math.sqrt(base)) >= Math.sqrt(base)) {
                    if (grid.boxes.indexOf(grid.cells[p+i*base].box) % 2 === 0)
                        data.style.backgroundColor = 'yellow';
                }else{
                    if (grid.boxes.indexOf(grid.cells[p+i*base].box) % 2)
                        data.style.backgroundColor = 'yellow';
                }

                row.appendChild(data);
            }
            table.appendChild(row);
        }
    }
    
    function getGrid() {
        var workers = [];
        //create x number of grid workers and start them
        for (var i=0; i<24; i++) {
            var worker = new Worker('worker.js');
            worker.onmessage = function(e) {
                workerHandler(e);
                workers.forEach(function(x){x.terminate();});
            }
            workers.push(worker);
            worker.postMessage(base);
        }
    }
    getGrid();
    function workerHandler(e) {
        var cellValues = e.data.split(',');
        var grid = new Grid();
        for (var i=0; i<cellValues.length; i++) {
            grid.cells[i].value = grid.cells[i].element.innerHTML = cellValues[i];
            grid.cells[i].possibleValues = [grid.cells[i].value];
        }
        grid.hideValue();
        console.log(grid.cells.filter(function(x){return x.element.innerHTML === '';}).length);
        tableOut(grid);
    }
}