import "./App.css";
import { Line, comparePoints } from "./Line.js"
import LineInfos from "./LineInfos.js"
import React from 'react';
import { useEffect, useRef, useState } from "react";

export default function App() {

    // Canvas default size.
    const defaultWidth = window.innerWidth;
    const defaultHeight = Math.round( window.innerHeight / 2.5 );

    // Canvas.
    const canvas = useRef();

    // Define state variables.

    // Boolean for knowing if we are currently drawing or not.
    const [ isDrawing, setIsDrawing ] = useState( false );

    // Boolean for knowing if we ashould draw new lines or not
    const [ isDrawingAllowed, setIsDrawingAllowed ] = useState( true );

    // Current line start coordinates.
    const [ start, setStart ] = useState( { x: 0, y: 0 } );

    // Current line end coordinates
    const [ end, setEnd ] = useState( { x: 0, y: 0 } );

    // All the lines.
    const [ lines, setLines ] = useState( [] );

    // Version number for the lines.
    const [ linesVersion, setLinesVersion ] = useState( 0 );

    // Area.
    const [ area, setArea ] = useState( 0 );

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



    // Draw effect – each time isDrawing,
    // start or end change, automatically
    // redraw everything.
    useEffect( () => {

        // Return if canvas has no value.
        if( !canvas.current ) return;

        // Clear canvas.
        const ctx = canvas.current.getContext( "2d" );
        ctx.clearRect( 0, 0, canvas.current.width - 2, canvas.current.height );

        // Resize canvas.
        canvas.current.width = canvasWidth;
        canvas.current.height = canvasHeight;

        // Draw the line.
        ctx.beginPath();
        ctx.moveTo( start.x, start.y );
        ctx.lineTo( end.x, end.y );
        ctx.closePath();
        ctx.stroke();

        // Draw the old lines too.
        lines.forEach( line => {
           line.draw( ctx );
        });

    }, [ isDrawing, isDrawingAllowed, start, end, requestRedraw, lines ]);

    // When mouse is down, start drawing.
    function handleMouseDown(e) {

        // Return if finished.
        if( !isDrawingAllowed ) return;

        // Start drawing.
        setIsDrawing( true );

        // Save start to either mouse location or
        // to the end of the previous line.
        if( lines.length > 0 ) {
            setStart({
                x: lines[ lines.length - 1 ].end.x,
                y: lines[ lines.length - 1 ].end.y
            });
        } else {
            setStart({
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
            });
        }

        // Initialize end point to the mouse location.
        setEnd({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
    }

    // Modify ending coordinates when moving mouse.
    function handleMouseMove(e) {
        
        // Do nothing if not drawing.
        if( !isDrawing ) return;

        // Set end coordinates.
        setEnd({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        });
    }

    // Stop drawing when mouse is up.
    function handleMouseUp( e ) {

        // Return if finished.
        if( !isDrawingAllowed ) return;

        // Stop drawing.
        setIsDrawing( false );

        // Create the line.
        const line = new Line( start, end, lines.length + 1  );

        // Save only if the line length is more than 0.
        if( line.length > 0 ) {
           saveNewLine( line );
        }
        
        // Start drawing again from the end of the previous line.
        setStart({
            x: end.x,
            y: end.y
        });
    }

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
        saveNewLine( line );

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
        saveNewLine( line );

        // Calculate area.
        if( lastLine ) {
            calculateArea( lines );
        }
    }

    // Get a new line that is connected to the previous line.
    function getNewLine(  length, angleToPrevious, previousLines  ) {
        
        // Get new line coordinates.
        var line;
        if( previousLines.length === 0 ) {

            // Create the first line.
            const start = { x: 50, y: 50 };
            const end = { x: 150, y: 50 };
            line = new Line( start, end, previousLines.length + 1 )
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
                    previousLines.length + 1 );

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
    function saveNewLine( line ) {

        const previousLines = lines.slice();
        previousLines.push( line );
        setLines( previousLines );
        setLinesVersion( linesVersion + 1 );
        updateDebugData( previousLines );
    }

    // Call back for getting the data from input fields.
    function modifyOneLine ( input ) {

        setLines( ( oldLines ) => {

            const newLines = oldLines;

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
        input.forEach( line => {
            modifyOneLine( line );
        });
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
    function calculateArea( areaLines ) {

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
         setArea( result  );
    }

    function handleOnClickReset() {

        // Empty lines.
        setLines( [] );

        // Update debug data.
        updateDebugData( [] );

        // Drawing is allowed.
        setIsDrawingAllowed( true );

        // Area is zero.
        setArea( 0 );

        // Resize canvas.
        resizeCanvas();
    }

    function handleOnClickZoomIn() {
        const ctx = canvas.current.getContext( "2d" );
        ctx.scale( 1.1, 1.1 );
        redraw();
    }

    function handleOnClickZoomOut() {
        const ctx = canvas.current.getContext( "2d" );
        ctx.scale( 0.9, 0.9 );
        redraw();
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

        // Calculate length. If there are many cornes, the picture will be huge.
        var length = 100;
        if( createShapeCorners > 5 ) {

            // Reduce length by 5 per additional corner after 5 corners.
            length = length - 10 * ( createShapeCorners - 5 );

            // Use 20 as minimum lenght.
            length = length < 20 ?  20 : length;    
        }

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

        // Calculate the weigth point of the lines now.
        var sumOfX = 0;
        var sumOfY = 0;
        previousLines.forEach( line => {
            sumOfX += line.start.x;
            sumOfY += line.start.y;
        });

        // Current weight point.
        var weightPoint = { x: sumOfX / previousLines.length , y: sumOfY / previousLines.length };

        // Canvas middle point.
        var middlePoint = { x: dimensions.width / 2, y: dimensions.height / 2 };

        // Calculate diff.
        const dX = Math.round( middlePoint.x - weightPoint.x);
        const dY = Math.round( middlePoint.y - weightPoint.y );

        // Adjust lines.
        const centeredLines = previousLines.slice();
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

    // Map touch envents to mouse event handlers.
    function handleTouchStart( event ) { handleMouseDown( event.touches[0]) }
    function handleTouchMove( event ) { handleMouseMove(event.touches[0]); event.preventDefault(); }
    function handleTouchEnd( event ) { handleMouseUp(event.changedTouches[0]) }

    // Select all when clicking input.
    const handleFocus = (event) => event.target.select();

    return (
       
        <div className="App">
            
            
            <div className="drawing">
                
                <div className="drawingboard">
                        <canvas
                            ref={canvas}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            width={canvasWidth}
                            height={canvasHeight}
                            >

                            </canvas>
                </div>

                <div className="buttons">
                    
                    <button className="new-line-button" disabled={!isDrawingAllowed} onClick={ () => handleOnClickAddNewLine()}>
                        Add line
                    </button>
                    <button className="enddrawing_button" disabled={!isDrawingAllowed} onClick={ () => handleOnClickEnd()}>
                        Add last line
                    </button>
                    <button onClick={ () => handleOnClickReset() }>
                        Reset
                    </button>
                    <button  onClick={ () => handleOnClickZoomIn()}>
                        Zoom +
                    </button>
                    <button  onClick={ () => handleOnClickZoomOut()}>
                        Zoom -
                    </button>
                    <button  onClick={ () => handleOnClickCenter()}>
                        Center
                    </button>
                </div>
            </div>

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
                <div className="area" >
                        <label >Area: {area}</label>
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
    );
}
