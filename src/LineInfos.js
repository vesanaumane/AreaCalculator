import { exportDefaultSpecifier } from '@babel/types';
import React from 'react';
import { useState, useEffect } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( { lines, setAllCallback, setOneCallback } ) {

    const [ linesData, setLinesData ] = useState( Array() );

    useEffect( () => {

        // Do nothing if there is no data.
        if( lines.length === 0 && linesData.length === 0 ) {
            return;
        }
        
        // Reset if new lines has no data.
        if( lines.length === 0 ) {
            setLinesData( Array() );
            return;
        }

        // Add new lines.
        const newLines = linesData.slice();
        lines.map( ( line ) => {
            
            var test = newLines.some( ( element ) => element.id == line.id );

            // Update existing data.
            if( newLines.some( ( element ) => element.id == line.id )  ) {
                const index = line.id - 1;
                newLines[ index ].length = line.length;
                newLines[ index ].angle = line.angle;
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

    const handleOneChange = ( data ) => {
        
        // Find the line.
        const currentLines = linesData.slice();
        if( !currentLines.some( ( element ) => element.id == data.id ) ) {
            return;
        }

        // Set data.
        const index = data.id - 1;
        currentLines[ index ].length = data.length;
        currentLines[ index ].angle = data.angle;
    }

    return(
        <div >
            <div className="lineinfos" >
                { linesData.map( linedata => 
                    <LineInfo
                        key={linedata.id}
                        saveCallback={setOneCallback}
                        onChangeCallback={ handleOneChange }
                        line={linedata}
                    /> 
                ) }
                
            </div>
            <button className='saveall' hidden={linesData.length === 0} onClick={ () => { handleSaveAllOnClick() }}>Save all</button>
        </div>
    );
}


