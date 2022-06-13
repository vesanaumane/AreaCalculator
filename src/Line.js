import { calculateLength, angleToRadians, roundDouble, calculateAngleBetweenLines } from "./HelperMethods.js"

// Represents one line.
export class Line {

    constructor( start, end, id ) {
        this.start = { x: start.x, y: start.y };
        this.end = { x: end.x, y: end.y };
        this.id = id;

            // Length is distance between the start and end point.
            this.length = calculateLength( this.start, this.end );

            // Calculate angle between x-axis and the line.
            this.angle = calculateAngleBetweenLines( { start, end }, { start:{ x :0, y:0}, end: { x:1, y:0} } );
    }

    // Calculate new end coordinates when setting new length.
    // https://math.stackexchange.com/questions/352828/increase-length-of-line
    setNewLength( newLength ) {
        
        if( this.length === newLength ) return;

        // Make shorter variable names.
        var x2 = this.end.x;
        var y2 = this.end.y;

        // Calculate delta for x and y.
        var offsets = calculateOffsetWhenSettingNewLength( this.start, this.end );
        var dx = offsets.dx;
        var dy = offsets.dy;

        // How much the line inceases.
        var dl = newLength - this.length;

        // Keep the starting point as is, modify end point.
        this.end = { x: x2 + dl * dx, y: y2 + dl * dy };

        // Save the length.
        if( !this.labelDataIsLocked ) {
            this.length = calculateLength( this.start, this.end );
        }

        this.printToConsole();
    }

    // Set new angle for the line.
    setNewAngle( newAngle ) {
        
        if( this.angle === newAngle ) return;

        // Calculate new x and y.
        var newX = this.start.x + this.length * Math.cos( angleToRadians( newAngle ) );
        var newY = this.start.y + this.length * Math.sin( angleToRadians( newAngle ) );

        // Keep the starting point as is, modify the end point.
        this.end = { x: newX, y: newY };

        // Save the length.
        this.length = calculateLength( this.start, this.end );

        
        // Calculate angle between x-axis and the line.
        this.angle = newAngle;

        this.printToConsole();
    }

    // Move line without changing lenght or angle.
    moveLine( dx, dy ) {
        this.start.x = this.start.x + dx;
        this.start.y = this.start.y + dy;
        this.end.x = this.end.x + dx;
        this.end.y = this.end.y + dy;
    }

    setNewStartPoint( newStart ) {
        this.start = this.start = { x: newStart.x, y: newStart.y };

        this.angle = calculateAngleBetweenLines( { start:this.start, end:this.end }, { start:{ x :0, y:0}, end: { x:1, y:0} } );
        this.length = calculateLength( this.start, this.end );

        this.printToConsole();
    }

    printToConsole() {
        //console.log( this.id + ". start: " + this.start.x + ", " + this.start.y + " end: " + this.end.x + ", " + this.end.y + " l: " + this.length + " angle: " + this.angle  );
    }   
}

// Calculate offsets for the coordinates, when setting new length.
// Return { dx, dy }
function calculateOffsetWhenSettingNewLength( start, end ) {
        
        // Make shorter variable names.
        var x1 = start.x;
        var x2 = end.x;
        var y1 = start.y;
        var y2 = end.y;

        // Calculate delta for x and y.
        var dx = ( x2 - x1 ) / Math.sqrt( Math.pow( x2, 2 ) - 2 * x2 * x1 + Math.pow( x1, 2 ) + Math.pow( y2, 2 ) - 2 * y2 * y1 + Math.pow( y1, 2 ) );
        var dy = ( y2 - y1 ) / Math.sqrt( Math.pow( x2, 2 ) - 2 * x2 * x1 + Math.pow( x1, 2 ) + Math.pow( y2, 2 ) - 2 * y2 * y1 + Math.pow( y1, 2 ) );

        return { dx: dx, dy:dy };
}