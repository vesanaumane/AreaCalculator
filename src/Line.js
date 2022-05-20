// Represents one line.
export default class Line {

    constructor( start, end, id ) {
        this.start = start;
        this.end = end;
        this.length = calculateLength( this.start, this.end );
        

        // Calculate angle between x-axis and the line.
        this.angle = findAngle( { start, end }, { start:{ x :0, y:0}, end: { x:1, y:0} } );


        console.log( this.start, this.end, this.length, this.angle );
        this.id = id;
    }

    // Calculate new end coordinates when setting new length.
    // https://math.stackexchange.com/questions/352828/increase-length-of-line
    setNewLength( newLength ) {
        
        if( this.length === newLength ) return;

        // Make shorter variable names.
        var x1 = this.start.x;
        var x2 = this.end.x;
        var y1 = this.start.y;
        var y2 = this.end.y;

        // Calculate delta for x and y.
        var dx = ( x2 - x1 ) / Math.sqrt( Math.pow( x2, 2 ) - 2 * x2 * x1 + Math.pow( x1, 2 ) + Math.pow( y2, 2 ) - 2 * y2 * y1 + Math.pow( y1, 2 ) );
        var dy = ( y2 - y1 ) / Math.sqrt( Math.pow( x2, 2 ) - 2 * x2 * x1 + Math.pow( x1, 2 ) + Math.pow( y2, 2 ) - 2 * y2 * y1 + Math.pow( y1, 2 ) );

        // How much the line inceases.
        var dl = newLength - this.length;

        // Keep the starting point as is, modify end point.
        this.end = { x: x2 + dl * dx, y: y2 + dl * dy };

        // Save the length.
        this.length = calculateLength( this.start, this.end );

        this.printToConsole();
    }

    // Set new angle for the line.
    setNewAngle( newAngle ) {
        
        if( this.angle === newAngle ) return;

        // Calculate how much the angle changes.
        var dA = newAngle;

        // Calculate new x and y.
        var newX = this.start.x + this.length * Math.cos( AngleToRadians( dA ) );
        var newY = this.start.y + this.length * Math.sin( AngleToRadians( dA ) );

        // Keep the starting point as is, modify the end point.
        this.end = { x: newX, y: newY };

        // Save the length.
        this.length = calculateLength( this.start, this.end );

        // Calculate angle between x-axis and the line.
        this.angle = findAngle( { start: this.start, end: this.end }, { start:{ x :0, y:0}, end: { x:1, y:0} } );

        this.printToConsole();
    }

    setNewStartPoint( newStart ) {
        this.start = newStart;
        this.angle = findAngle( { start:this.start, end:this.end }, { start:{ x :0, y:0}, end: { x:1, y:0} } );
        this.length = calculateLength( this.start, this.end );

        this.printToConsole();
    }

    printToConsole() {
        console.log( this.id + ". start: " + this.start.x + ", " + this.start.y + " end: " + this.end.x + ", " + this.end.y + " l: " + this.length + " angle: " + this.angle  );
    }

    // Draw the line.
    draw ( ctx ) {

        // Round coordinates to nearest integer.
        var x1 = Math.round( this.start.x );
        var x2 = Math.round( this.end.x );
        var y1 = Math.round( this.start.y );
        var y2 = Math.round( this.end.y );

        // Draw the actual line.
        ctx.beginPath();
        ctx.moveTo( x1, y1 );
        ctx.lineTo( x2, y2 );
        ctx.closePath();
        ctx.stroke();

        // Draw label to the line.
        this.drawLabel( ctx, 'center' )
    };

    // Draw the label to the line.
    drawLabel( ctx, alignment, padding ){
        if( !alignment ) alignment = 'center';
        if( !padding ) padding = 0;
      
        // Round coordinates to nearest integer.
        var x1 = Math.round( this.start.x );
        var x2 = Math.round( this.end.x );
        var y1 = Math.round( this.start.y );
        var y2 = Math.round( this.end.y );

        var dx = x2 - x1;
        var dy = y2 - y1;   
        var p, pad;
        if( alignment=='center' ) {
            p = this.start;
            pad = 1/2;
        } else {
            var left = alignment=='left';
            p = left ? this.start : this.end;
            pad = padding / Math.sqrt( dx*dx + dy*dy ) * ( left ? 1 : -1 );
        }
      
        ctx.save();
        ctx.textAlign = alignment;
        ctx.translate( p.x+dx*pad, p.y+dy*pad );
        ctx.rotate( Math.atan2( dy,dx ) );
        ctx.fillText( Math.round( ( this.length + Number.EPSILON ) * 100 ) / 100 ,0 ,0 );
        ctx.restore();
    };
}

function findAngle( line, otherLine ) {
    
    var dAx = line.end.x - line.start.x;
    var dAy = line.end.y - line.start.y;
    var dBx = otherLine.end.x - otherLine.start.x;
    var dBy = otherLine.end.y - otherLine.start.y;
    var angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
    if( angle < 0 )  { 
        angle = angle * -1;
    }

    // Return in degress.
    return AngleToDegrees( angle );
}


function calculateLength( start, end ) {

    return Math.sqrt( Math.pow( start.x - end.x, 2 ) + Math.pow( start.y - end.y, 2 ) );
}

function AngleToRadians( angleInDegrees ) {
    return  angleInDegrees  * ( Math.PI / 180.0 );
}


function AngleToDegrees( angleInRadians ) {
    return angleInRadians * ( 180.0 / Math.PI );
}