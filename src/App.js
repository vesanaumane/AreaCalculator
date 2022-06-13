import "./App.css";
import { Line } from "./Line.js"
import { comparePoints, centerLinesInPlane } from "./HelperMethods.js"
import LineInfos from "./LineInfos.js"
import React from 'react';
import LineCanvas from "./LineCanvas.js"
import { useState } from "react";

export default function App() {

    // Canvas default size.
    const defaultWidth = window.innerWidth;
    const defaultHeight = Math.round( window.innerHeight / 2.5 );

    // Define state variables.

    // Boolean for knowing if we ashould draw new lines or not
    const [ isDrawingAllowed, setIsDrawingAllowed ] = useState( true );
    
    // All the lines.
    const [ lines, setLines ] = useState( [] );

    // Second if calculations have two results.
    const [ secondaryLines, setSecondaryLines ] = useState( [] );

    // Version number for the lines.
    const [ linesVersion, setLinesVersion ] = useState( 0 );

    // Area.
    const [ area, setArea ] = useState( 0 );

    // Secondary area.
    const [ secondaryArea, setSecondaryArea ] = useState( 0 );

    // Boolean for triggering redraw.
    const [ requestRedraw, setRequestRedraw ] = useState( "0" );

    // Boolean for triggering redraw.
    const [ debugData, setDebugData ] = useState( [] );

    // Canvas width.
    const [ canvasWidth, setCanvasWidth ] = useState(  defaultWidth );

    // Canvas height.
    const [ canvasHeight, setCanvasHeight ] = useState( defaultHeight );

    // Corners when creating new shape.
    const [ createShapeCorners, setCreateShapeCorners ] = useState( 4 );

    // Create a last line between the first line's start
    // and the previous line's end point. 
    function handleOnClickEnd() {
        
        // Do nothing if there is one or no lines.
        if( lines.length < 2 ) return;

        // Do nothing if already finished.
        if( !isDrawingAllowed ) return;

        // Get the lines.
        const previousLines = lines.slice(); 
        const firstLine = previousLines[ 0 ];
        const latestLine = previousLines[ previousLines.length - 1 ];

        // Create the last line and save.
        const line = new Line( 
                latestLine.end , 
                firstLine.start, 
                lines.length + 1 )
        saveNewLine( line, true );

        // Stop drawing.
        setIsDrawingAllowed( false );

        // Calculate area.
        calculateArea( lines );
    }

    // Create a last line between the first line's start
    // and the previous line's end point. 
    function handleOnClickAddNewLine() {
        
        // Get new line coordinates.
        var line = getNewLine( 100, 90, lines );

        // Stop drawing if lines create a closed loop. line.end.x == lines[ 0 ].start.x && line.end.y == lines[ 0 ].start.y
        var lastLine = false;
        if( lines.length > 0 && ( comparePoints( line.end, lines[ 0 ].start )  ) ) {
            setIsDrawingAllowed( false );
            lastLine = true;
        }

        // Save the created line.
        saveNewLine( line, lastLine );

        // Calculate area.
        if( lastLine ) {
            calculateArea( lines );
        }
    }

    // Get a new line that is connected to the previous line.
    function getNewLine(  length, angleToPrevious, previousLines, id  ) {
        
        // Calculate new id if not provided.
        if( !id ) {
            id = previousLines.length + 1;
        }

        // Get new line coordinates.
        var line;
        if( previousLines.length === 0 ) {

            // Create the first line.
            const start = { x: 50, y: 50 };
            const end = { x: 150, y: 50 };
            line = new Line( start, end, id )
            line.setNewAngle( 0 );

        } else {

            // Add next line.
            
            // Get the previous line.
            const previousLine = previousLines[ previousLines.length - 1 ];

            // Create the line on top of the previous line. 
            // Change the end a little bit, so that it is not on top of the previous line.
            line = new Line(  
                    previousLine.end, 
                    { x: previousLine.end.x + 1, y: previousLine.end.y + 1 }, 
                    id );

            // Turn relative to the previous line.
            var lineAngle = previousLine.angle + angleToPrevious;
            lineAngle = lineAngle >= 360 ? lineAngle - 360 : lineAngle;
            lineAngle = lineAngle < 0 ? lineAngle + 360 : lineAngle;
            line.setNewAngle( lineAngle );

            // Set length.
            line.setNewLength( length );
        }

        return line;
    }

    // Save the line.
    function saveNewLine( line, center ) {

        // Add line.
        const previousLines = lines.slice();
        previousLines.push( line );

        // Center lines.
        if( center ) {
            centerLines( previousLines );
        }

        // Save.
        setLines( previousLines );
        setLinesVersion( linesVersion + 1 );
        updateDebugData( previousLines );
    }

    // Call back for getting the data from input fields.
    function modifyOneLine ( input ) {

        setLines( ( oldLines ) => {

            const newLines = oldLines.slice();

            // Find the line and adjust it's length and angle.
            for( var i = 0; 0 < newLines.length; ++i ) {
                
                if( newLines[ i ].id === input.id ) {
                    
                    // Save the old coordinates.
                    var oldEnd = newLines[ i ].end;

                    // Set new length for this line.
                    newLines[ i ].setNewLength( input.length );

                    // Set new angle for this line.
                    newLines[ i ].setNewAngle( input.angle );

                    // Adjust the next line.
                    if( newLines.length > 1 ) {

                        // If not last, adjust the next lines starting point.
                        if( i < newLines.length - 1 ) {
                            newLines[ i + 1 ].setNewStartPoint( newLines[ i ].end );
                        } else {

                            // If last and there are more than 2 lines and the lines were actually connected, 
                            // adjust the first lines starting point
                            if( newLines.length > 2 && oldLines[ 0 ].start.x === oldEnd.x && oldLines[ 0 ].start.y === oldEnd.y ) {
                                newLines[ 0 ].setNewStartPoint( newLines[ i ].end );
                            }
                        }
                    }
                    
                    break;
                }
            }

            // Put the shape to the center of canvas.
            const centeredLines = centerLines( newLines );

            // Calculate area if drawing is finished.
            if( !isDrawingAllowed ) {
                calculateArea( centeredLines );
            }

            updateDebugData( centeredLines );
            return centeredLines;

        } );

        setLinesVersion( ( oldVersion ) => {
            return oldVersion + 1;
        } );

        redraw();
    }

    // Call back for getting the data from input fields.
    function modifyAllLines ( input ) {

        // Calculate also secondary lines if there is another result.
        let newSecondaryLines = [];
        setLines( ( oldLines ) => {

            // Local function for getting next id in line's array.
            function getNextId( current, array ) {
                return current === array.length - 1 ? 0 : current + 1;
            }

            // Find fixed lines.
            let fixedLines = [];
            let fixedAnglesCount = 0;
            let previousLineHadFixedAngle = false;
            for( let index = 0; index < input.length; index++ ) {

                // Save the index for the line.
                if( input[ index ].angleLocked ) {
                    fixedLines.push( index );
                    ++fixedAnglesCount;
                    previousLineHadFixedAngle = true;
                }
                else if( previousLineHadFixedAngle ) {

                    // Previous line had fixed angle, so this line coordinates
                    // are also fixed.
                    fixedLines.push( index );
                    previousLineHadFixedAngle = false;
                }
                else {

                    // This line coordinates should be calculated.
                    previousLineHadFixedAngle = false;
                }
            }

             // Sanity check: There should be exactly corners minus three fixed angles.
             if( input.length - 3 !== fixedAnglesCount ) {

                // Write error message somewhere.

                // Return the old lines.
                return oldLines;
            }

            // Create the lines based on data, start from the first fixed line.
            // Assume locked corners are in back to back. 
            const newLines = [];
            let saveNextLineAngle = false;
            let inputIndex = fixedLines.length > 0 ? fixedLines[ 0 ] : 0;
            for( let index = 0; index < input.length; index++ ) {

                // Assume locked corners are back to back.
                let firstLineInTriangle = fixedLines.length === 0 && inputIndex === 0;
                let fixedLine = ( fixedLines.length > 0 && ( fixedLines.some( x => x == inputIndex ) || saveNextLineAngle ) );
                if( firstLineInTriangle || fixedLine ) {
                    
                    // Just create the new line based on the data and set lenght and angle. 
                    let newLineData = input[ inputIndex ];
                    let newLine = getNewLine( newLineData.length, 10, newLines, newLineData.id );
                    newLine.setNewLength( newLineData.length );
                    newLine.setNewAngle( newLineData.angle );

                    // Save the line.
                    newLines.push( newLine );
                    newSecondaryLines.push( new Line( newLine.start, newLine.end, newLine.id ) );

                    // Set also next line if angle was fixed.
                    saveNextLineAngle = input[ inputIndex ].angleLocked;

                    // Go to next line.
                    inputIndex = getNextId( inputIndex, input );
                }
                else {

                    // This is the last two lines which creates an triangle from the latest line end 
                    // and the first line start via an unknown point.

                    // Create a helper line through the first and the latest line.
                    let helperLine = new Line( newLines[ 0 ].start, newLines[ newLines.length - 1 ].end, 99 );

                    // To calculate the last point coordinates, we will create two circles to the both ends of
                    // the helper line and calculate the crossing points of the circle. There will be one or two results.

                    // Distance between the two known points is the length of the helper line.
                    let R = helperLine.length;

                    // Radius for the circle originating in the end of the helper line is the length of the 
                    // second to last line in the input data.
                    let r1 =  input[ inputIndex ].length;

                    // Radius for the other circle is the last line's length.
                    let nextId = getNextId( inputIndex, input );
                    let r2 = input[ nextId ].length;
                    
                    // Two of the known points are helperline's start and end points.
                    let knownPoint0 = helperLine.start;
                    let knownPoint1 = helperLine.end;

                    // Calculate the unknown point.
                    let unknownPoint = calculateLastPointInTriangle( knownPoint0, knownPoint1, r1, r2, R );

                    // Create the last two lines for the main result.
                    newLines.push( new Line( helperLine.end,  unknownPoint.result2, input[ inputIndex ].id ) );
                    newLines.push( new Line( unknownPoint.result2, helperLine.start, input[ nextId ].id ) );

                    // Create the last two lines for the secondary result.
                    newSecondaryLines.push( new Line( helperLine.end,  unknownPoint.result1, input[ inputIndex ].id ) );
                    newSecondaryLines.push( new Line( unknownPoint.result1, helperLine.start, input[ nextId ].id ) );

                    // Shape is finished.
                    break;
                }
            }
           
/*


            // Start to calculate from the first fixed line or if there are no fixed lines
            // this is a triangle, and we don't need fixed lines.
            let startId = 0;
            if( fixedLines.length > 0 ) {
                startId = fixedLines[ 0 ];
            }

            // First line in the triangle is the first line with fixed angle 
            // or if the shape has more than three corners, draw the line from this line's start to the next line's end. 
            let triangleLine1 = newLines[ startId ];
            let nextId = getNextId( startId, newLines );
            if( newLines.length > 3 ) {
                triangleLine1 = new Line( triangleLine1.start,  newLines[ nextId ].end, 0 );
            }

            // Todo create these in case of not triangle.
            let triangleLine2Id = getNextId( nextId, newLines );
            let triangleLine2 = newLines[ triangleLine2Id ];
            let triangleLine3Id = getNextId( triangleLine2Id, newLines );
            let triangleLine3 = newLines[ triangleLine3Id ];

            // This can be done by creating a circle of a radius of a known side length
            // to both end of a set line. Calculate the crossing points for these circles. 
            let knownPoint0 = triangleLine1.start;
            let knownPoint1 = triangleLine1.end;


            // Get the radii of the circles.
            let r1 = triangleLine2.length;
            let r2 = triangleLine3.length;

            // Length between the circle centers.
            let R = triangleLine1.length;

            let lastPoint = calculateLastPointInTriangle( knownPoint0, knownPoint1, r1, r2, R );

            // Save the lines.
            newLines[ triangleLine2Id ] = new Line( triangleLine1.end,  lastPoint.result2, newLines[ triangleLine2Id ].id );
            newLines[ triangleLine3Id ] = new Line( lastPoint.result2, triangleLine1.start, newLines[ triangleLine3Id ].id );

            
            // Avoid crossing lines.
            for( let index = 0; index < input.length; index++ ) {

                 // Skip if fixed line.
                 if( fixedLines.some( ( idx ) => idx === index ) ) {
                    continue;
                }

                // Find if there are any lines that cross this line.
                for( let nextIndex = index + 5; nextIndex < input.length; nextIndex++ ) {

                    // Turn if in conflict.
                    let turnedAngles = 0;
                    let conflict = false;
                    do {

                        // Check from x-axis.
                        let startDx = newLines[ index ].start.x - newLines[ nextIndex ].start.x;
                        let endDx = newLines[ index ].end.x - newLines[ nextIndex ].end.x;
                        let xAxisConflict = false;
                        if( !( ( startDx > 0 && endDx > 0 ) || ( startDx < 0 && endDx < 0 ) )  ) {
                            
                            // X-axis has a possible conflict.
                            xAxisConflict = true;
                        }

                        // Check from y-axis.
                        let startDy = newLines[ index ].start.y - newLines[ nextIndex ].start.y;
                        let endDy = newLines[ index ].end.y - newLines[ nextIndex ].end.y;
                        let yAxisConflict = false;
                        if( !( ( startDy > 0 && endDy > 0 ) || ( startDy < 0 && endDy < 0 ) )  ) {
                            
                            // Y-axis has a possible conflict.
                            yAxisConflict = true;
                        }

                        // If in conflict, turn 10 degrees until not in conflict.
                        conflict = xAxisConflict && yAxisConflict;
                        if( conflict ) {
                            
                            // Save old end point.
                            let oldEnd = newLines[ index ].end;

                            // Turn this line.
                            let newAngle = newLines[ index ].angle - 1;
                            newAngle = newAngle < 0 ? 360 + newAngle : newAngle;
                            turnedAngles += 1;
                            newLines[ index ].setNewAngle( newAngle );

                            // Move the subsequent lines the to match this turning.
                            let dx = newLines[ index ].end.x - oldEnd.x;
                            let dy = newLines[ index ].end.y - oldEnd.y;
                            for (let restIndex = index + 1; restIndex < newLines.length; restIndex++) {
                                newLines[ restIndex ].moveLine( dx, dy );
                            }
                        }

                    } while( conflict && turnedAngles < 360 );
                }
            }
*/
            // Put the shape to the center of canvas.
            const centeredLines = centerLines( newLines );

            // Update area.
            calculateArea( centeredLines );
            updateDebugData( centeredLines );

            return centeredLines;

        } );

        // Update also secondary lines data.
        setSecondaryLines( oldSecondaryLines => {
            calculateArea( newSecondaryLines, true );
            return newSecondaryLines;
        } ) ;

        // Lines were changed.
        setLinesVersion( ( oldVersion ) => {
            return oldVersion + 1;
        } );

    }

     // Source https://math.stackexchange.com/a/1367732
    function calculateLastPointInTriangle( knownPoint0, knownPoint1, r1, r2, R ) {

         // Get known points coordinates.
         let x1 = knownPoint0.x;
         let y1 = knownPoint0.y;
         let x2 = knownPoint1.x;
         let y2 = knownPoint1.y;

         // There are two possible points for the last point.
         // First result.
         let result1x = 0.5 * ( x1 + x2 ) + ( Math.pow( r1, 2 ) -  Math.pow( r2, 2 ) ) / ( 2 *  Math.pow( R, 2 ) ) * ( x2 - x1 ) 
             + ( 0.5 * Math.sqrt( 
                 2 * ( ( Math.pow( r1, 2 ) + Math.pow( r2, 2 ) ) / Math.pow( R, 2 ) )  - Math.pow( Math.pow( r1, 2 ) - Math.pow( r2, 2 ), 2 ) / Math.pow( R, 4 ) - 1 
             ) ) * ( y2 - y1 );
         let result1y = 0.5 * ( y1 + y2 ) + ( Math.pow( r1, 2 ) - Math.pow( r2, 2 ) ) / ( 2 *  Math.pow( R, 2 ) ) * ( y2 - y1 ) 
             + 0.5 * Math.sqrt( 
                 2 * ( ( Math.pow( r1, 2 ) + Math.pow( r2, 2 ) ) / Math.pow( R, 2 ) )  - Math.pow( Math.pow( r1, 2 ) - Math.pow( r2, 2 ), 2 ) / Math.pow( R, 4 ) - 1 
             ) * ( x1 - x2 );

         // Second result.
        let result2x = 0.5 * ( x1 + x2 ) + ( Math.pow( r1, 2 ) -  Math.pow( r2, 2 ) ) / ( 2 *  Math.pow( R, 2 ) ) * ( x2 - x1 ) 
             - ( 0.5 * Math.sqrt( 
                 2 * ( ( Math.pow( r1, 2 ) + Math.pow( r2, 2 ) ) / Math.pow( R, 2 ) )  - Math.pow( Math.pow( r1, 2 ) - Math.pow( r2, 2 ), 2 ) / Math.pow( R, 4 ) - 1 
             ) ) * ( y2 - y1 );
         let result2y = 0.5 * ( y1 + y2 ) + ( Math.pow( r1, 2 ) - Math.pow( r2, 2 ) ) / ( 2 *  Math.pow( R, 2 ) ) * ( y2 - y1 ) 
             - 0.5 * Math.sqrt( 
                 2 * ( ( Math.pow( r1, 2 ) + Math.pow( r2, 2 ) ) / Math.pow( R, 2 ) )  - Math.pow( Math.pow( r1, 2 ) - Math.pow( r2, 2 ), 2 ) / Math.pow( R, 4 ) - 1 
             ) * ( x1 - x2 );

        return { result1: { x: result1x, y: result1y }, result2: { x: result2x, y: result2y } };

    }

    // Is shape formed by the lines valid?
    function isShapeValid( currentLines ) {

        // Compare line coordinates to find out if shape is valid.
        for(let index = 0; index < currentLines.length; index++ ) {

            // Next index.
            let nextLineIndex = index < currentLines.length - 1 ? index + 1 : 0;

            // Shape is not valid when subsequent line's end and start are not the same.
            if( !comparePoints( currentLines[ index ].end, currentLines[ nextLineIndex ].start, 5 ) ) {
                return false;
            }
        }

        // Shape is valid.
        return true;
    }

     // Call back for redrawing the canvas.
     function redraw () {
        
        console.log( "Redraw" );

        setRequestRedraw( ( oldValue ) => {
            const newValue = oldValue + 1;
            return newValue;
        } );
    }


    // Calculate area. https://www.mathsisfun.com/geometry/area-irregular-polygons.html
    function calculateArea( areaLines, isSecondary ) {

         // Calculate area.
         var areas = [];
         areaLines.forEach( line  => {
             
             // Calculate average height between the line start and end points.
             var avgHeight = ( line.start.y + line.end.y ) / 2;
             
             // Difference in x axis.
             var deltaX = line.end.x - line.start.x;
 
             // Calculate area of this polygon and save it.
             areas.push( avgHeight * deltaX );
 
         } );
 
         // Sum the areas.
         var result = 0;
         areas.forEach( arr => {
             result += arr;
         });
 
         // Area is not negative. Sign depends on which direction the shape was drawn.
         result = Math.abs( result );
 
         // Round the result to 3 decimals
         var decimalPart = Math.pow( 10, 3 );
         result =  Math.round( ( result + Number.EPSILON ) * decimalPart ) / decimalPart;
 
         // Set the area.
         if( isSecondary ) {
             setSecondaryArea( result );
         }
         else {
            setArea( result  );
         }
    }

    function handleOnClickReset() {

        // Empty lines.
        setLines( [] );
        setSecondaryLines( [] );

        // Update debug data.
        updateDebugData( [] );

        // Drawing is allowed.
        setIsDrawingAllowed( true );

        // Area is zero.
        setArea( 0 );
        setSecondaryArea( 0 );

        // Resize canvas.
        resizeCanvas();
    }

    
    function handleOnClickZoomIn() {

        /*

        const ctx = canvas.current.getContext( "2d" );
        ctx.scale( 1.1, 1.1 );
        redraw();

        */
    }

    function handleOnClickZoomOut() {

        /*

        const ctx = canvas.current.getContext( "2d" );
        ctx.scale( 0.9, 0.9 );
        redraw();

        */
    }

    function handleOnClickCenter() {

        // Center lines.
        const linesCopy = lines.slice();
        const centeredLines = centerLines( linesCopy );

        // Save.
        setLines( centeredLines );
    }

    function updateDebugData( lines ) {
        
        setDebugData( ( oldData ) => {

            var updatedData = lines.map( ( line ) => {

                const info = line.length + "  α=" + line.angle + "°"

                return (
                    <li key={line.id}>
                        <label>{info}</label>
                    </li>
                )
            } );

            return updatedData;
        } ); 
    }

    function handleCreateShapeInput( evt ) {
        const input = evt.target.value;
        setCreateShapeCorners( parseFloat( input ) );
    }

    // Create a new shape.
    function handleCreateShapeClick() {

        // Cannot create a shape with less than 3 corners.
        if( createShapeCorners < 3 ) return;

        // Calculate angle for corners.
        const angle = 360 / createShapeCorners;

        // Use 100 as a length for the lines.
        var length = 100;

        // Create the lines.
        const newLines = [];
        for( var i = 0; i < createShapeCorners; ++ i ) {
            newLines.push( getNewLine(  length, angle, newLines ) );
        }

        // Make sure the last and the first line are connected.
        newLines[ 0 ].setNewStartPoint( newLines[ newLines.length - 1 ].end  );

        // Put to center.
        const centeredLines = centerLines( newLines );

        // No more drawing.
        setIsDrawingAllowed( false );

        // Save.
        setLines( centeredLines );

        // Calculate area.
        calculateArea( centeredLines );

        // Set debug data.
        updateDebugData( centeredLines );
    }

    // Center lines on canvas.
    function centerLines( previousLines ) {

        // Resize the canvas to fit the lines.
        const dimensions = resizeCanvas();

        let centeredLines = centerLinesInPlane( previousLines, dimensions );

        resizeCanvas( true );

        // Return.
        return centeredLines;
    }

    // Resize canvas to fit the drawing and return the new dimensions.
    // Parameter force makes sure that all the lines fit the screen.
    function resizeCanvas( force ) {

        // Find the minimum and maximum values for the coordinates.
        var xMin = Number.MAX_SAFE_INTEGER;
        var xMax = 0;
        var yMin = Number.MAX_SAFE_INTEGER;
        var yMax = 0;
        lines.forEach( line => {
            
            // Save min coordinate is found in this line.
            if( line.start.x < xMin ) xMin = line.start.x;
            if( line.end.x < xMin ) xMin = line.end.x;
            if( line.start.y < yMin ) yMin = line.start.y;
            if( line.end.y < yMin ) yMin = line.end.y;

            // Save max coordinate is found in this line.
            if( line.start.x > xMax ) xMax = line.start.x;
            if( line.end.x > xMax ) xMax = line.end.x;
            if( line.start.y > yMax ) yMax = line.start.y;
            if( line.end.y > yMax ) yMax = line.end.y;

        });

        // Calculate minimum width and height. Use a 50 pixel cap on edges.
        const padding = 100;
        var minWidth = xMax - xMin + padding;
        var minHeight = yMax - yMin + padding;

        // Use the default width and heigth either way if it is larger.
        var width = minWidth < defaultWidth ? defaultWidth : minWidth;
        var height = minHeight < defaultHeight ? defaultHeight : minHeight;;

        // Make sure all the lines fit.
        if( force ) {
            if( width < xMax ) {
                width = xMax + padding;
            }
            if( height < yMax ) {
                height = yMax + padding;
            }
        }

        // Resize if needed.
        setCanvasWidth( width );
        setCanvasHeight( height );

        return { width, height };
    }

    
    // Select all when clicking input.
    const handleFocus = (event) => event.target.select();

    return (
       
        <div className="App">

            <div className="drawing">
                
                <div className="canvas-line">
                        <LineCanvas
                            lines={lines}
                            secondaryLines={secondaryLines}
                            addLineCallback={saveNewLine}
                            width={canvasWidth}
                            height={canvasHeight}
                            drawingEnabled={isDrawingAllowed}
                            requestRedraw={requestRedraw}
                            />
                </div>

                <div className="drawing-buttons">
                    
                    <button className="new-line-button" disabled={!isDrawingAllowed} hidden={true} onClick={ () => handleOnClickAddNewLine()}>
                        Add line
                    </button>
                    <button className="enddrawing_button" disabled={!isDrawingAllowed} hidden={true} onClick={ () => handleOnClickEnd()}>
                        Add last line
                    </button>
                    <button className="reset_button" onClick={ () => handleOnClickReset() }>
                        Reset
                    </button>
                    <button hidden={true} onClick={ () => handleOnClickZoomIn()}>
                        Zoom +
                    </button>
                    <button  hidden={true} onClick={ () => handleOnClickZoomOut()}>
                        Zoom -
                    </button>
                    <button onClick={ () => handleOnClickCenter()}>
                        Center
                    </button>
                </div>
            </div>
            
            <div className="area" >
                <div>
                    <label>Area:</label>
                </div>
                <div>
                    <span id={ secondaryLines.length === 0 ? "primary-area" : "primary-area-colour" }>{area}</span>
                </div>
                <div hidden={secondaryLines.length === 0}>
                    <span id="secondary-area">{secondaryArea}</span>
                </div>
            </div>

            <div className="create-modify">

                <div className="createshape" >
                    <label>Create shape with lines:</label>
                    <input 
                        type="number"
                        step="1" 
                        min={3}
                        disabled={lines.length > 0}
                        defaultValue={createShapeCorners}
                        onFocus={handleFocus} 
                        onChange={ evt => { handleCreateShapeInput( evt ) } }
                    />
                    <button
                        disabled={lines.length > 0} 
                        onClick={ () => { handleCreateShapeClick() }}>Create</button>
                </div>
                
                <LineInfos 
                    lines={lines} 
                    linesVersion={linesVersion} 
                    setOneCallback={ modifyOneLine } 
                    setAllCallback= { modifyAllLines }
                />
                <div className="debug-data">
                    <ul className="debug" >{debugData}</ul>
                </div>
            </div>
        </div>
    );
}
