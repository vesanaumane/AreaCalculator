import { Line } from "./Line";

// Calculate distannce between two points.
export function calculateLength( start, end ) {

    return roundDouble( Math.sqrt( Math.pow( start.x - end.x, 2 ) + Math.pow( start.y - end.y, 2 ) ), 8 );
}

// Calculate angle between two lines..
export function calculateAngleBetweenLines( line, otherLine ) {
    
    // Calculate the difference.
    var dAx = line.end.x - line.start.x;
    var dAy = line.end.y - line.start.y;
    var dBx = otherLine.end.x - otherLine.start.x;
    var dBy = otherLine.end.y - otherLine.start.y;
    var angle = Math.atan2( dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy );
    
    // Convert to degrees.
    angle = angleToDegrees( angle );

    // Use only positive angles.
    // angle = angle < 0 ? angle + 360 : angle;
    angle = Math.abs( angle )
    
    // Round to 5 decimanls.
    angle = roundDouble( angle, 8 );

    // Use 0 rather than 360 degress for horizontal line.
    if( angle === 360 ) angle = 0;

    // Make sure the line angle is in correct range. Keep in mind that
    // canvas ( 0, 0 ) is in upper left corner and y axis is pointing down. 

    // Line going down and right should be between 0 - 90 degress.
    if( line.end.y >= line.start.y && line.end.x >= line.start.x ) {
        
        // Adjust angle if needed.
        if( !( angle >= 0 && angle <= 90 ) ) {
            
            angle = 360 - angle
        }
    } else if( line.end.y >= line.start.y && line.end.x <= line.start.x ) {

        // Line going down and left should be between 90 - 180 degrees.
    
        // Adjust angle if needed.
        if( !( angle > 90 && angle <= 180 ) ) {
            
            angle = 360 - angle
        }
    } else if( line.end.y <= line.start.y && line.end.x <= line.start.x ) {

        // Line going up and left should be between 180 - 270 degress.
        
        // Adjust angle if needed.
        if( !( angle > 180 && angle <= 270 ) ) {
            
            angle = 360 - angle
        }
    } else if( line.end.y <= line.start.y && line.end.x >= line.start.x ) {

        // Line going up and right should be between 270 - 360 degress.

        // Adjust angle if needed.
        if( !( angle > 270 && angle <= 360 ) ) {
            
            angle = 360 - angle

            if( angle === 360 ) {
                angle = 0;
            }
        }
    }

    // Return the angle.
    return angle;
}

// Convert degrees to radians.
export function angleToRadians( angleInDegrees ) {
    return  angleInDegrees  * (  Math.PI / 180.0 );
}


// Convert radians to degrees.
export function angleToDegrees( angleInRadians ) {
    return angleInRadians * ( 180.0 /(  Math.PI ) );
}

// Round double with certain precision.
export function roundDouble( double, decimals ) {

    // Round.
    if( decimals > 0 )
    {
        var decimalPart =  Math.pow( 10, decimals );
        return Math.round( ( double + Number.EPSILON ) * decimalPart ) / decimalPart;
    } else {
        return Math.round( double );
    }
}

// Compare if points are equal with certain precicion.
export function comparePoints( p1, p2, precision ) {

    // Use 8 decimals if not given.
    if( !precision ) {
        precision = 8;
    }

    // Compare rounded coordinates.
    return roundDouble( p1.x, precision ) === roundDouble ( p2.x, precision ) && roundDouble( p1.y, precision ) === roundDouble ( p2.y, precision );
}

// Center lines on canvas.
export function centerLinesInPlane( lines, dimensions ) {

    // Calculate the weigth point of the lines now.
    var sumOfX = 0;
    var sumOfY = 0;
    lines.forEach( line => {
        sumOfX += line.start.x;
        sumOfY += line.start.y;
    });

    // Current weight point.
    var weightPoint = { x: sumOfX / lines.length , y: sumOfY / lines.length };

    // Canvas middle point.
    var middlePoint = { x: dimensions.width / 2, y: dimensions.height / 2 };

    // Calculate diff.
    const dX = Math.round( middlePoint.x - weightPoint.x);
    const dY = Math.round( middlePoint.y - weightPoint.y );

    // Adjust lines.
    const centeredLines = lines.slice();
    const padding = 20;
    var outsideX = padding;
    var outsideY = padding;
    for( var i = 0; i < centeredLines.length; ++i ) {

        // Set the new coordinates.
        centeredLines[ i ].start.x += dX;
        centeredLines[ i ].start.y += dY;
        centeredLines[ i ].end.x += dX;
        centeredLines[ i ].end.y += dY;

        // Check that nothing is outside.
        if( centeredLines[ i ].start.x < outsideX ) outsideX = centeredLines[ i ].start.x;
        if( centeredLines[ i ].end.x < outsideX ) outsideX = centeredLines[ i ].end.x;
        if( centeredLines[ i ].start.y < outsideX ) outsideY = centeredLines[ i ].start.y;
        if( centeredLines[ i ].end.y < outsideX ) outsideY = centeredLines[ i ].end.y;

    }
    
    // Adjust if needed.
    if( outsideX < padding || outsideY < padding ) {

        // Round the coordinates.
        outsideX = Math.round( outsideX );
        outsideY = Math.round( outsideY );

        // Calculate adjustment.
        const adjustX = outsideX < padding ? padding - outsideX : 0;
        const adjustY = outsideY < padding ? padding - outsideY : 0;

        for( var j = 0; j < centeredLines.length; ++j ) {

            // Set the new coordinates.
            centeredLines[ j ].start.x += adjustX;
            centeredLines[ j ].start.y += adjustY;
            centeredLines[ j ].end.x += adjustX;
            centeredLines[ j ].end.y += adjustY;
        }
    }

    // Return.
    return centeredLines;
}

// Check if line intersects with any of the existing lines.
export function doLineIntersectWithAnyOfTheLines( line, lines ) {

    // Copy line and shorten it a little bit in order to avoid start and end point being equal.
    var copyLine = new Line( line.start, line.end );
    copyLine.setNewLength( line.length - 0.001 );
    
    // Flip the line and shorten again to avoid ending points being equal.
    copyLine = new Line( copyLine.end, copyLine.start );
    copyLine.setNewLength( copyLine.length - 0.001 );

    // Assume no intersect.
    var intersecting = false;

    // Check every line.
    lines.forEach(  intersectLine => {
       if( doLinesIntersect( copyLine, intersectLine ) ) {
           intersecting = true;
           return;
       }
    });

    return intersecting;

}

// Do two lines intersect.
// https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
export function doLinesIntersect( line1, line2 ) {

    let p1 = { x: line1.start.x, y: line1.start.y };
    let q1 = { x: line1.end.x, y: line1.end.y };
    let p2 = { x: line2.start.x, y: line2.start.y };
    let q2 = { x: line2.end.x, y: line2.end.y };

    return doIntersect( p1, q1, p2, q2 );

}

// Given three collinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment(p, q, r)
{
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
    return true;
   
    return false;
}
 
// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p, q, r)
{
 
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    let val = (q.y - p.y) * (r.x - q.x) -
            (q.x - p.x) * (r.y - q.y);
   
    if (val == 0) return 0; // collinear
   
    return (val > 0)? 1: 2; // clock or counterclock wise
}
 
// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2)
{
 
    // Find the four orientations needed for general and
    // special cases
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);
   
    // General case
    if (o1 != o2 && o3 != o4)
        return true;
   
    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
   
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
   
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
   
    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
   
    return false; // Doesn't fall in any of the above cases
}