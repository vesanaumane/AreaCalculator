import React from 'react';
import { Line } from "./Line.js"
import { comparePoints, roundDouble, calculateLength, centerLinesInPlane, toInnerAngle, angleToRadians } from "./HelperMethods.js"
import { useState, useRef, useEffect } from "react";

export default function LineCanvas( { lines, secondaryLines, width, height, drawingEnabled, requestRedraw, addLineCallback } ) {

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

            // Calculate zoom factor.
            let canvasDimensions = { width: canvas.current.width, height: canvas.current.height };
            let zoomFactor = calculateZoom( canvasDimensions, lines );

            // Zoom.
            let zoomedLines = zoomLines( lines, zoomFactor, canvasDimensions );
            let zoomedSecondaryLines = null;
            if( secondaryLines && secondaryLines.length === lines.length ) {
                zoomedSecondaryLines = zoomLines( secondaryLines, zoomFactor, canvasDimensions, zoomedLines.lines[ 0 ].start );
            }

            // Calculate angle between next lines.
            for( let i = 0; i < zoomedLines.lines.length; i++ ) {

                let nextLineId = i != zoomedLines.lines.length - 1 ? i + 1 : 0;

                let angleToNext = angleBetweenLines( lines[ i ], lines[ nextLineId ] );
                zoomedLines.labelData[ i ].angle = angleToNext;
                if( zoomedSecondaryLines ) {
                    let angleToNextSecondary = angleBetweenLines( secondaryLines[ i ], secondaryLines[ nextLineId ] );
                    zoomedSecondaryLines.labelData[ i ].angle = angleToNextSecondary;
                }
            }

            // Draw the zoomed lines.
            for( let i = 0; i < zoomedLines.lines.length; i++ ) {

                // Draw also secondary lines.
                if( secondaryLines && secondaryLines.length === lines.length ) {

                    // Draw only if the lines are not identical.
                    if( !areLineIdenticals(zoomedLines.lines[ i ], zoomedSecondaryLines.lines[ i ] ) ) {
                        
                        // Draw the secondary line with different colour than the main line.
                        drawLine( ctx, zoomedLines.lines[ i ], zoomedLines.labelData[ i ], '#1a85ff' );
                        drawLine( ctx, zoomedSecondaryLines.lines[ i ], zoomedSecondaryLines.labelData[ i ], '#d41159' );
                    }
                    else {

                        // If the next line belongs to the secondary answer, draw angle lables for both.
                        // Otherwise draw the line with one angle label.
                        let nextId = i === zoomedLines.lines.lenght - 1 ? 0 : i + 1;
                        if( !areLineIdenticals( zoomedLines.lines[ nextId ], zoomedSecondaryLines.lines[ nextId ] ) ) {

                            // Next line has two answers, draw the line without angle label.
                            drawLine( ctx, zoomedLines.lines[ i ], zoomedLines.labelData[ i ], '#000','#666', true, false );

                            // Draw the first answer angle.
                            drawLabelForLine( ctx, zoomedLines.lines[ i ], zoomedLines.labelData[ i ], '#1a85ff', false, true, 15 );

                            // Daw the second answer angle.
                            drawLabelForLine( ctx, zoomedSecondaryLines.lines[ i ], zoomedSecondaryLines.labelData[ i ], '#d41159', false, true, -15 );
                        }
                        else {

                            // Draw the line with black and label with grey.
                            drawLine( ctx, zoomedLines.lines[ i ], zoomedLines.labelData[ i ], '#000','#666' );
                        }
                    }
                }
                else {

                    // Draw the main line.
                    drawLine( ctx, zoomedLines.lines[ i ], zoomedLines.labelData[ i ] );
                }
            }
        }
        else {

            // Shape is not done yet, draw as is.
            lines.forEach( line => {
                drawLine( ctx, line );
             });

        }

    }, [ isDrawing, requestRedraw, start, end, lines ] );

    // Zoom lines.
    function zoomLines( lines, zoomFactor, canvasDimensions, startPoint ) {
        
        // Craete copy of the lines and collect data.
        let zoomedLines = [];
        let zoomedLineLabelData = [];
        lines.forEach( line => {

            // Create a copy of the line.
            zoomedLines.push( new Line( line.start, line.end, line.id ) );
            zoomedLineLabelData.push( { id: line.id, length: line.length, angle: line.angle })
        });

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

        // Move to start from the start point or center these zoomed lines.
        if( startPoint ) {

            // Calculate how much we need to move the whole shape.
            let dx = startPoint.x - zoomedLines[ 0 ].start.x;
            let dy = startPoint.y - zoomedLines[ 0 ].start.y;

            // Move every line accodingly.
            for( let i = 0; i < zoomedLines.length; i++ ) {
                zoomedLines[ i ].moveLine( dx, dy );
            }
        }
        else {
            zoomedLines = centerLinesInPlane( zoomedLines, canvasDimensions );
        }
        

        // Return zoomed lines and the data.
        return { lines: zoomedLines, labelData: zoomedLineLabelData };
    }

    // Return true if lines are identical.
    function areLineIdenticals( line1, line2 ) {
        return comparePoints( line1.start, line2.start ) 
            && comparePoints( line1.end, line2.end );
    }

    // Calculate angle between two lines.
    function angleBetweenLines( line1, line2 ) {
        let angleBetweenLines = line2.angle - line1.angle;
        if( angleBetweenLines < 0 ) {
            angleBetweenLines = 360 + angleBetweenLines;
        }

        return toInnerAngle( angleBetweenLines );
    }

    // Draw one line.
    function drawLine ( ctx, line, lineLabelData, lineColour, labelColour, drawLength, drawAngle ) {

        // Set line colour to black if not given.
        if( !lineColour ) {
            lineColour = '#000';
        }

        // Set label colour to line colour if not given.
        // Or put it default if no colour was given.
        if( !labelColour && !lineColour ) {
            labelColour = '#666';
        }
        else if( !labelColour ) {
            labelColour = lineColour;
        }

        // Round coordinates to nearest integer.
        let x1 = Math.round( line.start.x );
        let x2 = Math.round( line.end.x );
        let y1 = Math.round( line.start.y );
        let y2 = Math.round( line.end.y );

        // Draw the actual line.
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = lineColour;
        ctx.beginPath();
        ctx.moveTo( x1, y1 );
        ctx.lineTo( x2, y2 );
        ctx.closePath();
        ctx.stroke();

        // Draw label to the line.
        drawLabelForLine( ctx, line, lineLabelData, labelColour, drawLength ?? true, drawAngle ?? true  );
    };

    // Draw the label to the line.
    function drawLabelForLine( ctx, line, lineLabelData, colour, drawLength, drawAngle, shiftAngleLabel ) {
      
        // Round coordinates to nearest integer.
        let x1 = Math.round( line.start.x );
        let x2 = Math.round( line.end.x );
        let y1 = Math.round( line.start.y );
        let y2 = Math.round( line.end.y );

        //Calculate coordinate deltas.
        let dx = x2 - x1;
        let dy = y2 - y1;

        // Create points with rounded coordinates.
        let p1 = { x:x1, y:y1 };
        let p2 = { x:x2, y:y2 };

        // Select data container.
        let data = !lineLabelData ? line : lineLabelData;

        // Draw length.
        if( drawLength ) {
            drawLengthLabel( ctx, line, data.length, p1, p2, dx, dy, colour );
        }

        // Draw angle.
        if( drawAngle ) {
            drawAngleLabel( ctx, line, data.angle, p1, p2, dx, dy, colour, shiftAngleLabel );
        }
    };

    // Draw label for the length. This is drawn in the middle of the line.
    function drawLengthLabel( ctx, line, lenght, p1, p2, dx, dy, colour ) {

        // Text to draw.
        let text = line.id + ": " + roundDouble( lenght, 2 );

         // Add padding from the starting point.
        let pad = 1/2;

        // Get the starting point for drawing.
        let p = getLabelStartingPoint( p1, p2, line, false );

        // Draw.
        drawLabel( ctx, line, text, p, pad, dx, dy, colour );
    }

    // Draw label for the angle. This is placed to the end of the line.
    function drawAngleLabel( ctx, line, angle, p1, p2, dx, dy, colour, shiftAngleLabel ) {
        
        // Text to draw.
        let text = roundDouble( angle, 0 ) + "°";

        // Add padding from the starting point.
        let pad = -1 * ( ctx.measureText( text ).width ) / Math.round( line.length );

        // Move label outside of the shape if it doesn't fit inside of it
        // or the angle is too shallow.
        let moveOutside = shiftAngleLabel || ctx.measureText( text ).width + 25 >= line.length || angle < 75;

        // Get the starting point for drawing.
        let p = getLabelStartingPoint( p1, p2, line, true, moveOutside, shiftAngleLabel );

        // Draw.
        drawLabel( ctx, line, text, p, pad, dx, dy, colour );

        // Draw a line from the corner to the label if it was moved outside of the shape.
        if( moveOutside ) {

            // Create the line to draw.
            let labelLine = new Line( line.end, p );

            // Make the line a bit shorter.
            labelLine.setNewLength( labelLine.length - 35 );

            // Draw the line.
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#b1b1b1';
            ctx.beginPath();
            ctx.moveTo( labelLine.start.x, labelLine.start.y );
            ctx.lineTo( labelLine.end.x, labelLine.end.y );
            ctx.closePath();
            ctx.stroke();
        }
    }

    // Draw the label.
    function drawLabel( ctx, line, text, startingPoint, padding, dx, dy, colour ) {

        // Make sure text fit the line.
        text = fitText( ctx, text, line.lenght );

        // Keep text upright.
        let angle = textAngle( dx, dy );

        // Draw.
        ctx.save();
        ctx.fillStyle = colour;
        ctx.font  = '10pt Arial';
        ctx.textAlign = 'center';
        ctx.translate( startingPoint.x + dx * padding, startingPoint.y + dy * padding  );
        ctx.rotate( angle );
        ctx.fillText( text, 0 ,0 );
        ctx.restore();
    }

    // Fit the text to the line.
    function fitText( ctx, text, lineLength ) {

        // Make the text to draw as: <id>. l=<length> a=<angle>
        let textToDraw = text;

        // Make sure the text fits to the line.
        let len = Math.round( lineLength );
        let padding = 10;
		let avail = len - 2 * padding;
		if( ctx.measureText && ctx.measureText( textToDraw ).width > avail ){
			while( textToDraw && ctx.measureText( textToDraw ).width > avail && textToDraw.length > 2 ) {
                textToDraw = textToDraw.slice( 0, -1 );
            }
		}

        return textToDraw;
    }

    // Returns the angle for drawing the text.
    function textAngle( dx, dy ) {
        let angle = Math.atan2( dy,dx );
        if( angle < - Math.PI/2 || angle > Math.PI/2 ){
            angle -= Math.PI;
        }

        return angle;
    }

    // Get the starting point where to start to draw the label.
    function getLabelStartingPoint( p1, p2, line, oppositeSide, moveOutside, extraShiftForAngle ) {

        // Create small cap between the line and the text.
        // Create a line perpeticular to this line with a length of the cap.
        let perpenticularLine = oppositeSide ? new Line( p2, p1 ) : new Line( p1, p2 );

        // Set angle and length depending on which sector we are in.
        let angleShift = moveOutside ? 0 :  oppositeSide ? 90 : 270;
        //angleShift = !extraShiftForAngle ? angleShift : angleShift + extraShiftForAngle;
        if( line.angle <= 90 ) {
            perpenticularLine.setNewAngle( line.angle + angleShift );
            perpenticularLine.setNewLength( moveOutside ? 10 : oppositeSide ? 15 : 5 );
        }
        else if( line.angle > 90 && line.angle < 180 ) {
            perpenticularLine.setNewAngle( line.angle + angleShift );
            perpenticularLine.setNewLength( moveOutside ? 10 : oppositeSide ? 5 : 15 );
        }
        else if( line.angle >= 180 && line.angle < 270 ) {
            perpenticularLine.setNewAngle( line.angle + angleShift );
            perpenticularLine.setNewLength( moveOutside ? 10 : oppositeSide ? 5 : 15 );
        }
        else{
            perpenticularLine.setNewAngle( line.angle + angleShift );
            perpenticularLine.setNewLength( moveOutside ? 10 : oppositeSide ? 15 : 5 );
        }

        // Move the point outside of the shape.
        if( moveOutside ) {
            
            // Create a new line from the end of the perpenticular line
            // to outside of the shape.
            let outsideLine = new Line( perpenticularLine.end, perpenticularLine.start );
            outsideLine.setNewAngle( !extraShiftForAngle ? line.angle : line.angle + extraShiftForAngle );
            outsideLine.setNewLength( 55 );
            return outsideLine.end;
        }
        else {

            // Return the end of the perpenticular line.
            return perpenticularLine.end;
        }
    }

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
        let padding = 140;
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