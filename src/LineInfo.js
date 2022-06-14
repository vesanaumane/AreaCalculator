import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { onChangeCallback, saveCallback, lineLength, lineAngle, lineAngleToNext, lineAngleLocked, lineId, lockButtonCanBeDisabled } ) {

    // Line info.
    const [ length, setLength ] = useState( lineLength );
    const [ angle, setAngle ] = useState( lineAngle );
    const [ angleLocked, setAngleLocked ] = useState( lineAngleLocked );
    const [ angleBetweenLines, setAngleBetweenLines ] = useState( lineAngleToNext );
    const [ angleBetweenLinesDisplay, setAngleBetweenLinesDisplay ] = useState( toInnerAngle( lineAngleToNext ) );
    const [ disableLockButton, setDisableLockButton ] = useState( lockButtonCanBeDisabled );

    useEffect( () => {

        if( length !== lineLength ) {
            setLength( lineLength )
        }
        
        if( angle !== lineAngle ) {
            setAngle( lineAngle )
        }

        if( toOuterAngle( angleBetweenLinesDisplay ) !==  lineAngleToNext  ) {
            setAngleBetweenLinesDisplay( toInnerAngle( lineAngleToNext ) );
        }

        if( angleLocked !== lineAngleLocked ) {
            setAngleLocked( lineAngleLocked )
        }

        if( angleLocked === false ) {
            setDisableLockButton( lockButtonCanBeDisabled );
        }

    }, [ lineLength, lineAngle, lineAngleLocked, lockButtonCanBeDisabled, lineAngleToNext ] );

    useEffect( () => {

        let outerAngle = toOuterAngle( angleBetweenLinesDisplay );
        onChangeCallback( { id: lineId, length: length, angle: angle, angleBetweenLines: outerAngle, angleLocked: angleLocked } );

    }, [ angle, length, angleBetweenLinesDisplay, angleLocked ]);


    // Convert angle between lines to shape inner angle.
    function toInnerAngle( angle ) {
        let innerAngle = 180 - angle;
        if( innerAngle < 0 ) {
            innerAngle = 360 + innerAngle;
        }
        return innerAngle;
    }

    // Convert angle between lines to shape outer angle.
    function toOuterAngle( angle ) {
        let outerAngle = 180 - angle;
        if( outerAngle < 0 ) {
            outerAngle = 360 + outerAngle;
        }
        return outerAngle;
    }

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
        setAngleBetweenLinesDisplay( parseFloat( input ) );
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
                        value={Math.round( angleBetweenLinesDisplay )}
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
                    <button disabled={true} hidden={true} onClick={ () => { handleOnClick() }}>Save</button>
                </div>

            </div> 
        );
}