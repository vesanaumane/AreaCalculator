import React from 'react';
import { useState } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( props ) {

    // All the lines.
    const [ lines, setLines ] = useState( Array() );

    // Set all lines, if not set.
    if( lines.length < props.lines.length ) {
        props.lines.forEach( line => {
            addLine( line );
        });
    }

    function addLine( line ) {
        console.log( "hello" );

        // Check that the current line is not already there.
        const oldLines = lines.slice();
        let alreadyAdded = false;

        // Find if already added. Update data for it if needed.
        for( var i = 0; i < oldLines.length; ++i )
        {
            if( oldLines[ i ].id === line.id ) {
                alreadyAdded = true;

                // Update length.
                oldLines[ i ].length = line.length
            }
        };
        
        // Add new line.
        if( !alreadyAdded ) {
            const inputCallback = props.inputCallback;
            const newLineInfo = new LineInfo( { line, inputCallback } );
            oldLines.push(  newLineInfo.render() );
        }

        setLines( oldLines );
    }

    return(
        <ol>{lines}</ol>
    );
}


