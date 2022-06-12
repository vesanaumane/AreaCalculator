import React from 'react';
import { Line } from "./Line.js"
import { comparePoints, centerLinesInPlane } from "./HelperMethods.js"
import { useState, useRef, useEffect } from "react";

export default function LineCanvas( { lines, width, height, drawingEnabled, requestRedraw, addLineCallback } ) {

    // Canvas.
    const canvas = useRef();

    // Current line start coordinates.
    const [ start, setStart ] = useState( { x: 0, y: 0 } );

    // Current line end coordinates
    const [ end, setEnd ] = useState( { x: 0, y: 0 } );

    // Boolean for knowing if we are currently drawing or not.
    const [ isDrawing, setIsDrawing ] = useState( false );

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
        canvas.current.width = width;
        canvas.current.height = height;

        // Draw the line user is drawing.
        ctx.beginPath();
        ctx.moveTo( start.x, start.y );
        ctx.lineTo( end.x, end.y );
        ctx.closePath();
        ctx.stroke();


        // Draw the old lines.
        if( lines.length > 3 && comparePoints( lines[ 0 ].start, lines[ lines.length - 1 ].end, 5 ) ) {

            // Shape is finished, zoom a little bit.
            var zoomedLines = [];
            lines.forEach( line => {

                // Create a copy of the line.
                zoomedLines.push( new Line( line.start, line.end, line.id ) );
            });

            // Calculate zoom factor.
            let zoomFactor = 100;
            
            // Zoom.
            let previousLineEndDx = 0;
            let previousLineEndDy = 0;
            for( let index = 0; index < zoomedLines.length; index++ ) {

                // Multiply x and y coordinates by the zoom factor.
               if( index === 0 ) {

                    // In first line, just change the end point.
                    zoomedLines[ index ].end.x = zoomedLines[ index ].end.x * zoomFactor;
                    zoomedLines[ index ].end.y = zoomedLines[ index ].end.y * zoomFactor;
                }
                else if( index === zoomedLines.length - 1 ) {
                    
                    // In last line, just change the starting point.
                    zoomedLines[ index ].start.x = zoomedLines[ index ].start.x * zoomFactor;
                    zoomedLines[ index ].start.y = zoomedLines[ index ].start.y * zoomFactor;
                }
                else { 

                    // Other lines change both start and end.
                    let currentLineEndX = zoomedLines[ index ].end.x;
                    let currentLineEndY = zoomedLines[ index ].end.y;
                    zoomedLines[ index ].moveLine( previousLineEndDx, previousLineEndDy );
                    zoomedLines[ index ].setNewLength( zoomedLines[ index ].length + zoomFactor );
                    previousLineEndDx = zoomedLines[ index ].end.x - currentLineEndX;
                    previousLineEndDy = zoomedLines[ index ].end.y - currentLineEndY;

                    //zoomedLines[ index ].start.y = zoomedLines[ index ].start.y - zoomFactor;
                    //zoomedLines[ index ].end.x = zoomedLines[ index ].end.x + zoomFactor;
                    //zoomedLines[ index ].end.y = zoomedLines[ index ].end.y + zoomFactor;
                }
            }

            // Draw the zoomed lines.
            zoomedLines.forEach( line => {
                line.draw( ctx );
             });
        }
     /*   } else {

            // Not finished shape, draw the lines as is.
            lines.forEach( line => {
                line.draw( ctx );
             });
        }
*/
        lines.forEach( line => {
            line.draw( ctx );
         });
        

    }, [ isDrawing, requestRedraw, start, end, lines ] );

    // When mouse is down, start drawing.
    function handleMouseDown( e ) {

        // Return if finished.
        if( !drawingEnabled ) return;

        // Start drawing.
        setIsDrawing( true );

        // Save start to either mouse location or
        // to the end of the previous line.
        if( lines.length > 0 ) {
            setStart( {
                x: lines[ lines.length - 1 ].end.x,
                y: lines[ lines.length - 1 ].end.y
            } );
        } else {
            setStart( {
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY
            } );
        }

        // Initialize end point to the mouse location.
        setEnd( {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        } );
    }

    // Modify ending coordinates when moving mouse.
    function handleMouseMove( e ) {
        
        // Do nothing if not drawing.
        if( !isDrawing ) return;

        // Set end coordinates.
        setEnd( {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY
        } );
    }

    // Stop drawing when mouse is up.
    function handleMouseUp( e ) {

        // Return if finished.
        if( !drawingEnabled ) return;

        // Stop drawing.
        setIsDrawing( false );
        
        // Create the line.
        const line = new Line( start, end, lines.length + 1 );

        // Save only if the line length is more than 0.
        if( line.length > 0 ) {
            addLineCallback( line );
        }
        
        // Start drawing again from the end of the previous line.
        setStart( {
            x: end.x,
            y: end.y
        } );
    }

    // Map touch envents to mouse event handlers.
    function handleTouchStart( event ) { handleMouseDown( event.touches[0]) }
    function handleTouchMove( event ) { handleMouseMove(event.touches[0]); event.preventDefault(); }
    function handleTouchEnd( event ) { handleMouseUp(event.changedTouches[0]) }


    return (
        <canvas
            ref={canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            width={width}
            height={height}
        >
        </canvas>
    );
}