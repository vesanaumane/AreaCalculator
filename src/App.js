import "./App.css";
import Line from "./Line.js"
import LineInfos from "./LineInfos.js"
import React from 'react';
import { useEffect, useRef, useState } from "react";


export default function App() {

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
    const [ lines, setLines ] = useState( Array() );

    // Area.
    const [ area, setArea ] = useState( 0 );

    // Boolean for triggering redraw.
    const [ requestRedraw, setRequestRedraw ] = useState( "0" );

    // Zoom-level.
    const [ zoom, setZoom ] = useState( 1 );

    // Call back for getting the data from input fields.
    function dataFromInputFields ( input ) {

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
                            //adjust the first lines starting point
                            if( newLines.length > 2 && oldLines[ 0 ].start.x == oldEnd.x && oldLines[ 0 ].start.y == oldEnd.y ) {
                                newLines[ 0 ].setNewStartPoint( newLines[ i ].end );
                            }
                        }
                    }
                    
                    break;
                }
            }

            return newLines;

        } );

        redraw();
    }

     // Call back for redrawing the canvas.
     function redraw () {
        
        console.log( "Redraw" );

        setRequestRedraw( ( oldValue ) => {
            const newValue = oldValue + 1;
            return newValue;
        } );
    }

    // Draw effect – each time isDrawing,
    // start or end change, automatically
    // redraw everything.
    useEffect( () => {

        // Return if canvas has no value.
        if( !canvas.current ) return;

        // Clear canvas.
        const ctx = canvas.current.getContext( "2d" );
        ctx.clearRect( 0, 0, canvas.current.width, canvas.current.height );

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

    }, [ isDrawing, isDrawingAllowed, start, end, requestRedraw ]);

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

        // Get the lines.
        const previousLines = lines.slice(); 
        const firstLine = previousLines[ 0 ];
        const latestLine = previousLines[ previousLines.length - 1 ];

        // Create the last line and save.
        const line = new Line( latestLine.end, firstLine.start, lines.length + 1 )
        saveNewLine( line );

        // Stop drawing.
        setIsDrawingAllowed( false );
    }

    // Create a last line between the first line's start
    // and the previous line's end point. 
    function handleOnClickAddNewLine() {
        
        // Get the lines.
        const previousLines = lines.slice();

        // Get new line coordinates.
        var line;
        if( previousLines.length == 0 ) {

            // Create the first line.
            const start = { x: 100, y: 200 };
            const end = { x: 100, y:100 };
            line = new Line( start, end, lines.length + 1 )

           // line.setNewAngle( 90 );
           // line.setNewLength( 100 );

        } else {

            // Add next line.
            
            // Get the previous line.
            const previousLine = previousLines[ previousLines.length - 1 ];

            // Create the line backwards to the previous line.
            line = new Line( previousLine.end, previousLine.start, lines.length + 1 )

            // Turn 30 degrees relative to the previous line.
            var lineAngle = Math.abs( previousLine.angle - 90 );
            lineAngle = lineAngle > 360 ? lineAngle - 360 : lineAngle;
            line.setNewAngle( lineAngle );

            // Set length 100.
            line.setNewLength( 100 );
        }

        // Create the last line and save.
        saveNewLine( line );
        redraw();
    }

    // Calculate area. https://www.mathsisfun.com/geometry/area-irregular-polygons.html
    function handleOnClickArea() {
        
        // Do nothing if there is one or no lines.
        if( isDrawingAllowed ) {
            setArea( "Finish drawing first" );
            return;
        }

        // Calculate area.
        var areas = new Array();
        lines.forEach( line  => {
            
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

        // Set the area.
        setArea( Math.abs( result ) );
    }

    // Save the line.
    function saveNewLine( line ) {
        const previousLines = lines.slice();
        previousLines.push( line );
        setLines( previousLines );
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

    // Map touch envents to mouse event handlers.
    function handleTouchStart( event ) { handleMouseDown( event.touches[0]) }
    function handleTouchMove( event ) { handleMouseMove(event.touches[0]); event.preventDefault(); }
    function handleTouchEnd( event ) { handleMouseUp(event.changedTouches[0]) }


    return (
       
        <div className="App">
            <h1>Area Calculator</h1>
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
                        width="400"
                        height="400"
                        style={{ border: "1px solid #ccc" }
                        }
                    ></canvas>
                </div>
                <div className="buttons">
                    <button className="zoom-in-button" onClick={ () => handleOnClickZoomIn()}>
                        Zoom +
                    </button>
                    <button className="zoom-in-button" onClick={ () => handleOnClickZoomOut()}>
                        Zoom -
                    </button>
                    <button className="new-line-button" onClick={ () => handleOnClickAddNewLine()}>
                        Add new line
                    </button>
                    <button className="enddrawing_button" onClick={ () => handleOnClickEnd()}>
                        Finish drawing
                    </button>
                    <button className="calc_area_button" onClick={ () => handleOnClickArea()}>
                        Calculate area
                    </button>
                    <label>{area}</label>
                </div>
                <LineInfos lines={lines} inputCallback={ dataFromInputFields }/>
            </div>
            
        </div>
    );
}
