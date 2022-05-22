import { exportDefaultSpecifier } from '@babel/types';
import React from 'react';
import { useState, useEffect } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( props ) {

    // All the lines.
    const [ lines, setLines ] = useState( Array() );

    // All data for the lines.
    const [ lineData, setLineData ] = useState( Array() );

    // Version number for the lines.
    const [ linesVersion, setLinesVersion ] = useState( 0 );

    // Set all lines, if not set. lines.length < props.lines.length && linesVersion != props.linesVersion 
    if( linesVersion != props.linesVersion ) {

        if(  lines.length < props.lines.length  ) {

            //Add or update lines.
            props.lines.forEach( line => {
                addOrUpdate( line, false );
            });            
        } else {

           //Add or update lines.
           props.lines.forEach( line => {
           addOrUpdate( line, true );
        }); 
        }
    
        // Update lines version.
        setLinesVersion( props.linesVersion );
    }
    
    
    

    // Add or update a line.
    function addOrUpdate( line, doNotAdd ) {

        // Check that the current line is not already there.
        const oldLines = lines.slice();
        const oldLineData = lineData.slice();
        var alreadyAdded = false;

        // Find if already added. Update data for it if needed.
        for( var i = 0; i < oldLines.length; ++i )
        {
            if( oldLines[ i ].id === line.id ) {

                // This line is already added.
                alreadyAdded = true;

                // Update data.
                if( linesVersion != props.linesVersion ) {
                    oldLines[ i ].length = line.length;
                    oldLines[ i ].angle = line.angle;
                    oldLines[ i ].line = line;
                    oldLineData[ i ] = line;
                }
                
                break;
            }
        };
        
        // Add new line.
        if( !alreadyAdded && !doNotAdd ) {
            const inputCallback = props.inputCallback;
            const newLineInfo = new LineInfo( { line, inputCallback } );
            oldLines.push(  newLineInfo.render() );
            oldLineData.push( line );
        }

        setLines( oldLines );
        setLineData( oldLineData );
    }

    return(
        <ol>{lines}</ol>
    );
}


