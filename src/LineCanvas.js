import React from 'react';
import { Line } from "./Line.js"
import { comparePoints, roundDouble, calculateLength, centerLinesInPlane } from "./HelperMethods.js"
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
        if( lines.length >= 3 && comparePoints( lines[ 0 ].start, lines[ lines.length - 1 ].end, 5 ) ) {

            // Shape is finished, zoom a little bit.
            var zoomedLines = [];
            var zoomedLineLabelData = [];
            lines.forEach( line => {

                // Create a copy of the line.
                zoomedLines.push( new Line( line.start, line.end, line.id ) );
                zoomedLineLabelData.push( { id: line.id, length: line.length, angle: line.angle })
            });

            // Calculate zoom factor.
            let canvasDimensions = { width: canvas.current.width, height: canvas.current.height };
            let zoomFactor = calculateZoom( canvasDimensions, lines );
            
            // Zoom.
            let previousLineEndDx = 0;
            let previousLineEndDy = 0;
            for( let index = 0; index < zoomedLines.length; index++ ) {

                // First move this line according to the previous line's movement.
                if( index !== 0 ) {
                    zoomedLines[ index ].moveLine(  previousLineEndDx, previousLineEndDy );
                }

                // Save the end point of this line.
                let oldEndX = zoomedLines[ index ].end.x;
                let oldEndY = zoomedLines[ index ].end.y;

                // Set new length.
                zoomedLines[ index ].setNewLength(  zoomedLines[ index ].length * zoomFactor );

                // Calculate the diff for end point.
                previousLineEndDx += zoomedLines[ index ].end.x - oldEndX;
                previousLineEndDy += zoomedLines[ index ].end.y - oldEndY;
            }

            // Center these zoomed lines.
            zoomedLines = centerLinesInPlane( zoomedLines, canvasDimensions );

            // Draw the zoomed lines.
            for( let i = 0; i < zoomedLines.length; i++ ) {
                const line = zoomedLines[ i ];
                const lineLabelData = zoomedLineLabelData[ i ];
                drawLine( ctx, line, lineLabelData );
                
            }
        }
        else {

            // Shape is not done yet, draw as is.
            lines.forEach( line => {
                drawLine( ctx, line );
             });

        }

    }, [ isDrawing, requestRedraw, start, end, lines ] );


    // Draw the line.
    function drawLine ( ctx, line, lineLabelData ) {

        // Round coordinates to nearest integer.
        var x1 = Math.round( line.start.x );
        var x2 = Math.round( line.end.x );
        var y1 = Math.round( line.start.y );
        var y2 = Math.round( line.end.y );

        // Draw the actual line.
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo( x1, y1 );
        ctx.lineTo( x2, y2 );
        ctx.closePath();
        ctx.stroke();

        // Draw the endings for the line.
        ctx.beginPath();
		ctx.arc( x1, y1, 2, 0, Math.PI * 2, false);
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.arc( x2, y2, 2 ,0 , Math.PI * 2, false);
		ctx.fill();
		ctx.stroke();

        // Draw label to the line.
        drawLabelForLine( ctx, 'center', line, lineLabelData )
    };

    // Draw the label to the line.
    function drawLabelForLine( ctx, alignment, line, lineLabelData ) {

        // Use center alignment if not set. Other settings are left and right.
        if( !alignment ) alignment = 'center';
      
        // Round coordinates to nearest integer.
        let x1 = Math.round( line.start.x );
        let x2 = Math.round( line.end.x );
        let y1 = Math.round( line.start.y );
        let y2 = Math.round( line.end.y );

        //Calculate coordinate deltas.
        let dx = x2 - x1;
        let dy = y2 - y1;

        // Make the text to draw as: <id>. l=<length> a=<angle>
        let lengthText = !lineLabelData ? line.length : lineLabelData.length;
        let angleText = !lineLabelData ? line.angle : lineLabelData.angle;
        let textToDraw = line.id + ".  l=" + roundDouble( lengthText, 2 ) + "  α=" + roundDouble( angleText, 0 ) + "°";

        // Make sure the text fits to the line.
        let len = Math.round( line.length );
        let padding = 10;
		let avail = len - 2 * padding;
		if( ctx.measureText && ctx.measureText( textToDraw ).width > avail ){
			while( textToDraw && ctx.measureText( textToDraw ).width > avail && textToDraw.length > 2 ) {
                textToDraw = textToDraw.slice( 0, -1 );
            }
		}
    

		// Keep text upright
        let angle = Math.atan2( dy,dx );
        if( angle < - Math.PI/2 || angle > Math.PI/2 ){
            angle -= Math.PI;
        }

        // Create points with rounded coordinates.
        let p1 = { x:x1, y:y1 };
        let p2 = { x:x2, y:y2 };

        // Add padding from the starting point.
        let pad;
        let p;
        if( alignment === 'center' ) {
            p = p1;
            pad = 1/2;
        } else {
            let left = alignment === 'left';
            p = left ? p1 : p2;
            pad = padding / len * ( left ? 1 : -1 );
        }
      


        // Create small cap between the line and the text.
        // Create a line perpeticular to this line with a length of the cap.
        let perpeticularLine = new Line( p1, p2 );

        // Set angle and length depending on which sector we are in.
        if( line.angle <= 90 ) {
            perpeticularLine.setNewAngle( line.angle + 270 );
            perpeticularLine.setNewLength( 5 );
        }
        else if( line.angle > 90 && line.angle < 180 ) {
            perpeticularLine.setNewAngle( line.angle + 270 );
            perpeticularLine.setNewLength( 15 );
        }
        else if( line.angle >= 180 && line.angle < 270 ) {
            perpeticularLine.setNewAngle( line.angle + 270 );
            perpeticularLine.setNewLength( 15 );
        }
        else{
            perpeticularLine.setNewAngle( line.angle + 270 );
            perpeticularLine.setNewLength( 5 );
        }
        

        p = perpeticularLine.end;

        // Draw.
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.font  = '10pt Arial';
        ctx.textAlign = alignment;
        ctx.translate( p.x + dx * pad, p.y + dy * pad  );
        ctx.rotate( angle );
        ctx.fillText( textToDraw ,0 ,0 );
        ctx.restore();
    };

    // Calculate zoom factor.
    function calculateZoom( canvasDimensions, lines ) {

        // Parse all x and y coordinates from lines array.
        let allX = lines.map( line => line.start.x );
        allX = lines.map( line => line.end.x );
        let allY = lines.map( line => line.start.y );
        allY = lines.map( line => line.end.y );

        // Get minimum and maximum x and y.
        let minX = Math.min( ...allX );
        let maxX = Math.max( ...allX );
        let minY = Math.min( ...allY );
        let maxY = Math.max( ...allY );

        // Shape dimensions.
        let shapeWidth = maxX - minX;
        let shapeHeight = maxY - minY;

        // Calculate zoom for width and height with some padding. 
        let padding = 100;
        let zoomX = ( canvasDimensions.width - padding ) / shapeWidth;
        let zoomY = ( canvasDimensions.height - padding ) / shapeHeight;

        // Return the smaller one.
        return Math.min( zoomX, zoomY );
    }

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