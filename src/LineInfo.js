import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { onChangeCallback, saveCallback, lineLength, lineAngle, lineAngleToNext, lineAngleLocked, lineId, lockButtonCanBeDisabled } ) {

    // Line info.
    const [ length, setLength ] = useState( lineLength );
    const [ angle, setAngle ] = useState( lineAngle );
    const [ angleLocked, setAngleLocked ] = useState( lineAngleLocked );
    const [ angleBetweenLines, setAngleBetweenLines ] = useState( lineAngleToNext );
    const [ disableLockButton, setDisableLockButton ] = useState( lockButtonCanBeDisabled );

    useEffect( () => {

        if( length !== lineLength ) {
            setLength( lineLength )
        }
        
        if( angle !== lineAngle ) {
            setAngle( lineAngle )
        }

        if( angleBetweenLines !== lineAngleToNext ) {
            setAngleBetweenLines( lineAngleToNext )
        }

        if( angleLocked !== lineAngleLocked ) {
            setAngleLocked( lineAngleLocked )
        }

        if( angleLocked === false ) {
            setDisableLockButton( lockButtonCanBeDisabled );
        }

    }, [ lineLength, lineAngle, lineAngleLocked, lockButtonCanBeDisabled ] );

    useEffect( () => {

        onChangeCallback( { id: lineId, length: length, angle: angle, angleBetweenLines: angleBetweenLines, angleLocked: angleLocked } );

    }, [ angle, length, angleBetweenLines, angleLocked ]);

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

    function handleAngleBetweenLinesInput( evt ) {
        const input = evt.target.value;
        setAngleBetweenLines( parseFloat( input ) );
    }

    function handleOnClick() {
        saveCallback( { id: lineId, length: length, angle: angle } );
    }

    // Select all when clicking input.
    const handleFocus = (event) => event.target.select();

    return(
            <div key={ lineId } className="lineinfo">
                <label id="line-id">{lineId}.</label>
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
                    min={0} 
                    max={360} 
                    value={Math.round( angle )}
                    onFocus={handleFocus} 
                    onChange={ evt => { handleAngleInput( evt ) } }
                    disabled={!angleLocked}
                />
                <div id="between-lines">
                    <label id="angle-to-next">To next: </label>
                    <input
                        id='input-angle-to-next'
                        type="number" 
                        step="1" 
                        min={0} 
                        max={180} 
                        value={Math.round( angleBetweenLines )}
                        onFocus={handleFocus} 
                        onChange={ evt => { handleAngleBetweenLinesInput( evt ) } }
                        disabled={!angleLocked}
                    />
                    <input
                        id='input-lock-angle'
                        type="checkbox"
                        checked={angleLocked}
                        onChange={handleAngleLockedInput}
                        disabled={disableLockButton}
                    />
                    <button disabled={true} onClick={ () => { handleOnClick() }}>Save</button>
                </div>

            </div> 
        );
}