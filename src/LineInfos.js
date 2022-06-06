import React from 'react';
import { useState, useEffect } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( { lines, setAllCallback, setOneCallback } ) {

    const [ linesData, setLinesData ] = useState( [] );
    const [ canSaveAll, setCanSaveAll ] = useState( false );

    useEffect( () => {

        // Do nothing if there is no data.
        if( lines.length === 0 && linesData.length === 0 ) {
            return;
        }
        
        // Reset if new lines has no data.
        if( lines.length === 0 ) {
            setLinesData( [] );
            return;
        }

        // Add new lines.
        const newLines = [ ...linesData];
        lines.forEach( ( line ) => {

            // Update existing data.
            if( newLines.some( ( element ) => element.id === line.id )  ) {
                const index = line.id - 1;

                if( HasLineChanged( newLines[ index ], line ) ) {
                    newLines.splice( index, 1, {id: line.id, length: line.length, angle: line.angle, angleToNext : 0, angleLocked: false } );
                }
                
            }
            else {

                // Add new data.
                newLines.push( 
                    {id: line.id, length: line.length, angle: line.angle, angleToNext : 0, angleLocked: false }
                ) 
            }
            
        });

        // Calculate angle to previous line.
        if( newLines.length > 1 ) {
            for( let index = 0; index < newLines.length; index++ ) {
                const line = newLines[ index ];
                
                let nextIndex = GetNextLineIndex( index, newLines.length - 1 );
                const nextLine = newLines[ nextIndex ];

                let angleBetweenLines = nextLine.angle - line.angle;
                if( angleBetweenLines < 0 ) {
                    angleBetweenLines = 360 + angleBetweenLines;
                }

                newLines[ index ].angleToNext = angleBetweenLines; 
            }
        }
        

        setLinesData( newLines );
        CheckIfEnoughLinesAreLocked( newLines );

    }, [ lines ]);

    function handleSaveAllOnClick() {
        setAllCallback( linesData );
    }


    function HasLineChanged( line, newData ){
        if( line.length === newData.length && line.angle === newData.angle ) {
            return false;
        }

        return true;
    }

    const handleOneChange = ( data ) => {
        
        // Find the line.
        const currentLines = linesData.slice();
        if( !currentLines.some( ( element ) => element.id === data.id ) ) {
            return;
        }

        // Save length.
        const index = data.id - 1;
        if( currentLines[ index ].length !== data.length ) {
            currentLines[ index ].length = data.length;
        }

        // Check if angle is locked.
        if( currentLines[ index ].angleLocked !== data.angleLocked ) {
            
            // Set new state.
            currentLines[ index ].angleLocked = data.angleLocked;

            CheckIfEnoughLinesAreLocked( currentLines );
        }

        // Check angle between lines.
        if( currentLines[ index ].angleLocked ) {

            // Set angle.
            currentLines[ index ].angle = data.angle;

            // Set next line angle.
            currentLines[ index ].angleToNext = data.angleBetweenLines;
    
            // Set the next line to new angle.
            let nextIndex = GetNextLineIndex( index, currentLines.length - 1 );
            let newAngle = currentLines[ index ].angle + data.angleBetweenLines;
            if( newAngle >= 360 ) {
                newAngle = newAngle - 360;
            }
            currentLines[ nextIndex ].angle = newAngle;
        }
        

        setLinesData( currentLines );
    }

    function GetNextLineIndex( currentLineIndex, maxIndex ) {
        return currentLineIndex === maxIndex ? 0 : currentLineIndex + 1;
    }

    function CheckIfEnoughLinesAreLocked( currentLines ) {
        
        // Check if enough lines are locked for calculating area.
        let lockedAngles = 0;
        currentLines.forEach( line => {
            if( line.angleLocked ) {
                ++lockedAngles;
            }
        });

        // We can save if there is three less angles locked than there are lines.
        setCanSaveAll( lockedAngles === currentLines.length - 3 );
    }

    return(
        <div >
            <div className="lineinfos" >
                <div id='titlerow' style={linesData.length === 0 ? { display: 'none' } : {} } >
                    <span id='line-number'>#</span>
                    <span id='line-length'>Length</span>
                    <span id='line-angle'>Angle</span>
                    <span id='line-lock-angle'>Lock</span>
                </div>
                { linesData.map( linedata => 
                    <LineInfo
                        key={linedata.id}
                        saveCallback={setOneCallback}
                        onChangeCallback={ handleOneChange }
                        lineLength={linedata.length}
                        lineAngle={linedata.angle}
                        lineAngleToNext={linedata.angleToNext}
                        lineAngleLocked={linedata.angleLocked}
                        lineId={linedata.id}
                        lockButtonCanBeDisabled={canSaveAll}
                    /> 
                ) }
                <div id='saveall'>
                    <button  hidden={linesData.length === 0} disabled={!canSaveAll} onClick={ () => { handleSaveAllOnClick() }}>Save all</button>
                </div>
            </div>
            
            
        </div>
    );
}


