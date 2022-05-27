import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { onChangeCallback, saveCallback, lineLength, lineAngle, lineId } ) {

    // Line info.
    const [ length, setLength ] = useState( lineLength );
    const [ angle, setAngle ] = useState( lineAngle );
    const [ angleLocked, setAngleLocked ] = useState( false );


    useEffect( () => {

        if( length !== lineLength ) {
            setLength( lineLength )
        }
        
        if( angle !== lineAngle ) {
            setAngle( lineAngle )
        }

    }, [ lineLength, lineAngle ] );

    useEffect( () => {

        onChangeCallback( { id: lineId, length: length, angle: angle, angleLocked: angleLocked } );

    }, [ angle, length ]);

    function handleLengthInput( evt ) {
        const input = evt.target.value;
        setLength( parseFloat( input ) );
    }

    function handleAngleInput( evt ) {
        const input = evt.target.value;
        setAngle( parseFloat( input ) );
    }

    function handleAngleLockedInput() {
        setAngleLocked( !angleLocked );
    }

    function handleOnClick() {
        saveCallback( { id: lineId, length: length, angle: angle } );
    }

    // Select all when clicking input.
    const handleFocus = (event) => event.target.select();

    return(
            <div key={ lineId } className="lineinfo">
                    <label>{lineId}.</label>
                    <input
                        id='input-length'
                        type="number" 
                        step="1"
                        value={length} 
                        onFocus={handleFocus} 
                        onChange={ evt => { handleLengthInput( evt ) } } 
                    />
                    <input
                        id='input-angle'
                        type="number" 
                        step="1" 
                        min={-360} 
                        max={360} 
                        value={Math.round( angle )}
                        onFocus={handleFocus} 
                        onChange={ evt => { handleAngleInput( evt ) } }
                        disabled={!angleLocked}
                    />
                    <input
                        id='input-lock-angle'
                        type="checkbox"
                        checked={angleLocked}
                        onChange={handleAngleLockedInput}
                    />
                    <button onClick={ () => { handleOnClick() }}>Save</button>
            </div> 
        );
}