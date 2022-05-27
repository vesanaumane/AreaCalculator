import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { onChangeCallback, saveCallback, line } ) {

    // Line info.
    const [ length, setLength ] = useState( line.length );
    const [ angle, setAngle ] = useState( line.angle );


    useEffect( () => {

        onChangeCallback( { id: line.id, length: length, angle: angle } );

    }, [ angle, length ]);

    function handleLengthInput( evt ) {
        const input = evt.target.value;
        setLength( parseFloat( input ) );
    }

    function handleAngleInput( evt ) {
        const input = evt.target.value;
        setAngle( parseFloat( input ) );
    }

    function handleOnClick() {
        saveCallback( { id: line.id, length: length, angle: angle } );
    }

    // Select all when clicking input.
    const handleFocus = (event) => event.target.select();

    return(
            <div key={ line.id } className="lineinfo">
                    <label>{line.id}.</label>
                    <input
                        id='input-length'
                        type="number" 
                        step="1"
                        defaultValue={line.length} 
                        onFocus={handleFocus} 
                        onChange={ evt => { handleLengthInput( evt ) } } 
                    />
                    <input
                        id='input-angle'
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
        );
}