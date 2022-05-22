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
        this.length = calculateLength( this.start, this.end );

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
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo( x1, y1 );
        ctx.lineTo( x2, y2 );
        ctx.closePath();
        ctx.stroke();

        // Draw the endings for the line.
        ctx.beginPath();
		ctx.arc( x1,y1,2,0,Math.PI*2,false);
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.arc( x2, y2,2,0,Math.PI*2,false);
		ctx.fill();
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

        // Create points with these rounded points.
        var p1 = { x:x1, y:y1 };
        var p2 = { x:x2, y:y2 };

        //Calculate coordinate deltas.
        var dx = x2 - x1;
        var dy = y2 - y1;

        // Make the text to draw as: l: <length> a: <angle>
        var textToDraw = roundDouble( this.length, 2 ) + "  α=" + roundDouble( this.angle, 0 ) + "°";

        // Make sure the text fits to the line.
        var len = Math.round( this.length )
		var avail = len - 2 * padding;
		if( ctx.measureText && ctx.measureText( textToDraw ).width > avail ){
			while( textToDraw && ctx.measureText( textToDraw + "…" ).width > avail ) {
                textToDraw = textToDraw.slice( 0, -1 );
            }
			textToDraw += "…";
		}
    

		// Keep text upright
        var angle = Math.atan2( dy,dx );
        var p;
        if (angle < -Math.PI/2 || angle > Math.PI/2 ){
            p = p1;
            p1 = p2;
            p2 = p;
            dx *= -1;
            dy *= -1;
            angle -= Math.PI;
        }

        // Add padding from the starting point.
        var pad;
        if( alignment=='center' ) {
            p = p1;
            pad = 1/2;
        } else {
            var left = alignment=='left';
            p = left ? p1 : p2;
            pad = padding / len * ( left ? 1 : -1 );
        }
      
        // Create small cap between the line and the text.

        ctx.save();
        ctx.fillStyle = '#666';
        ctx.font  = '8pt Arial';
        ctx.textAlign = alignment;
        ctx.translate( p.x+dx*pad, p.y+dy*pad  );
        ctx.rotate( angle );
        ctx.fillText( textToDraw ,0 ,0 );
        ctx.restore();
    };
}

function findAngle( line, otherLine ) {
    
    // Calculate the difference.
    var dAx = line.end.x - line.start.x;
    var dAy = line.end.y - line.start.y;
    var dBx = otherLine.end.x - otherLine.start.x;
    var dBy = otherLine.end.y - otherLine.start.y;
    var angle = Math.atan2( dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy );

    // Return in degress.
    return roundDouble( angleToDegrees( angle ), 5 );
}


function calculateLength( start, end ) {

    return roundDouble( Math.sqrt( Math.pow( start.x - end.x, 2 ) + Math.pow( start.y - end.y, 2 ) ), 10 );
}

function angleToRadians( angleInDegrees ) {
    return  angleInDegrees  * ( Math.PI / 180.0 );
}


function angleToDegrees( angleInRadians ) {
    return angleInRadians * ( 180.0 / Math.PI );
}

function roundDouble( double, decimals ) {

    // Round.
    if( decimals > 0 )
    {
        var decimalPart =  Math.pow( 10, decimals );
        return Math.round( ( double + Number.EPSILON ) * decimalPart ) / decimalPart;
    } else {
        return Math.round( double );
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