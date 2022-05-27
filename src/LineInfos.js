import React from 'react';
import { useState, useEffect } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( { lines, setAllCallback, setOneCallback } ) {

    const [ linesData, setLinesData ] = useState( [] );

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
                    
                    // newLines[ index ].length = line.length;
                    // newLines[ index ].angle = line.angle;

                    newLines.splice( index, 1, {id: line.id, length: line.length, angle: line.angle } );
                    //newLines.push(  {id: line.id, length: line.length, angle: line.angle } );
                }

                

            }
            else {

                // Add new data.
                newLines.push( 
                    {id: line.id, length: line.length, angle: line.angle }
                ) 
            }
            
        });

        setLinesData( newLines );

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

        // Set data.
        const index = data.id - 1;
        if( HasLineChanged( currentLines[ index ], data ) ) {
            currentLines[ index ].length = data.length;
            currentLines[ index ].angle = data.angle;
        }
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
                        lineId={linedata.id}
                    /> 
                ) }
                <div id='saveall'>
                    <button  hidden={linesData.length === 0} onClick={ () => { handleSaveAllOnClick() }}>Save all</button>
                </div>
            </div>
            
            
        </div>
    );
}


