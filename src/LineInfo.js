import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { inputCallback, line } ) {

    // Line.
    // const [ lineData, setLineData ] = useState( line );
    const [ length, setLength ] = useState( line.length );
    const [ angle, setAngle ] = useState( line.angle );

    function handleLengthInput( evt ) {
        const input = evt.target.value;
        const parseLength = parseFloat( input );
        setLength( parseLength );
    }

    function handleAngleInput( evt ) {
        const input = evt.target.value;
        setAngle( parseFloat( input ) );
    }

    function handleOnClick() {
        inputCallback( { id: line.id, length: length, angle: angle } );
    }

    const handleFocus = (event) => event.target.select();

    return(
            <div key={ line.id } className="lineInfo">
                <div className="lineInfo">
                    <label>{line.id}. </label>
                    <input 
                        type="number" 
                        step="0.01" 
                        defaultValue={line.length} 
                        onFocus={handleFocus} 
                        onChange={ evt => { handleLengthInput( evt ) } } 
                    />
                    <input 
                        type="number" 
                        step="1" 
                        min={-360} 
                        max={360} 
                        defaultValue={Math.round( line.angle )}
                        onFocus={handleFocus} 
                        onChange={ evt => { handleAngleInput( evt ) } } 
                    />
                    <button onClick={ () => { handleOnClick() }}>Save</button>
                </div>
            </div> 
        );
}