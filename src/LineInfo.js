import React from 'react';
import { useState, useEffect } from "react";

export default function LineInfo( { onChangeCallback, saveCallback, lineLength, lineAngle, lineAngleToNext, lineAngleLocked, lineId, lockButtonCanBeDisabled, orientationSet } ) {

    // Line info.
    const [ length, setLength ] = useState( lineLength );
    const [ angle, setAngle ] = useState( lineAngle );
    const [ angleLocked, setAngleLocked ] = useState( lineAngleLocked );
    const [ angleBetweenLines, setAngleBetweenLines ] = useState( lineAngleToNext );
    const [ angleBetweenLinesDisplay, setAngleBetweenLinesDisplay ] = useState( toInnerAngle( lineAngleToNext ) );
    const [ disableLockButton, setDisableLockButton ] = useState( lockButtonCanBeDisabled );
    const [ orientation, setOrientation ] = useState( "" );
    const [ orientationSetElseWhere, setOrientationSetElseWhere ] = useState( orientationSet );
    const [ orientationVisible, setOrientatioVisible ] = useState( !orientationSet && lineAngleLocked )

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

        setOrientationSetElseWhere( orientationSet );
        if( !orientationVisible && !orientationSet && lineAngleLocked && orientation !== "" ) {
            let outerAngle = toOuterAngle( lineAngleToNext );
            onChangeCallback( { id: lineId, length: lineLength, angle: lineAngle, angleBetweenLines: outerAngle, angleLocked: lineAngleLocked, orientationSetInLine:  lineAngleLocked ? lineId : -1  } );
        }
        setOrientatioVisible( !orientationSet && lineAngleLocked );

    }, [ lineLength, lineAngle, lineAngleLocked, lockButtonCanBeDisabled, lineAngleToNext, orientationSet ] );

    useEffect( () => {

        // Adjust the angle if set to horizontal or vertical.
        let adjustAngle = false;
        let adjustedAngle = 0;
        if( !orientationSetElseWhere && angleLocked && orientation !== "" && orientation !== "Custom"  ) {

            // Act according to which direction this line is pointing towards.
            if( orientation === "Vertical" ) {

                // Vertical. If angle is already vertical, leave as is.
                // Otherwise adjust angle.
                if( !( angle === 90 || angle === 270 ) ){

                    // Adjust angle based on which direction it is pointing towards.
                    adjustAngle = true;
                    if( angle >= 0 && angle < 180) {
                    
                        // Line pointing down.
        
                        // Set to correct angle.
                        adjustedAngle = 90
        
                    } else if( angle >= 180 ) {
        
                        // Line pointing up.
                    
                        // Set to correct angle.
                        adjustedAngle = 270
                    }
                }
            }
            else if( orientation === "Horizontal" ) {

                // Horizontal. If angle is already horizontal, leave as is.
                // Otherwise adjust angle.
                if( !( angle === 0 || angle === 180 ) ){

                    // Adjust angle based on which direction it is pointing towards.
                    adjustAngle = true;
                    if( angle > 0 && angle < 180 ) {
                    
                        // Line pointing right.
        
                        // Set to correct angle.
                        adjustedAngle = 0;

                    } else if( angle > 180 ) {
        
                        // Line pointing left.
                    
                        // Set to correct angle.
                        adjustedAngle = 180;
                    }
                }
            } 
        }

        let outerAngle = toOuterAngle( angleBetweenLinesDisplay );
        onChangeCallback( { 
                id: lineId, 
                length: length, 
                angle: adjustAngle ? adjustedAngle : angle, 
                angleBetweenLines: outerAngle, 
                angleLocked: angleLocked, 
                orientationSetInLine: orientation !== "" && angleLocked ? lineId : -1  
            } );

    }, [ angle, length, angleBetweenLinesDisplay, angleLocked, orientation ]);


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
        setOrientatioVisible( !orientationSetElseWhere && !angleLocked );
    }

    function handleAngleBetweenLinesInput( evt ) {
        const input = evt.target.value;
        setAngleBetweenLinesDisplay( parseFloat( input ) );
    }

    function handleOnClick() {
        saveCallback( { id: lineId, length: length, angle: angle } );
    }

    function handleOrientation( evt) {
        setOrientation( evt.target.value );
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
                <input hidden={!orientationVisible} type="radio" checked={orientation === 'Horizontal'}  value="Horizontal" name={"orientation" + lineId} onChange={handleOrientation}/><label id='orientation-horizontal' hidden={!orientationVisible}>—</label>
                <input hidden={!orientationVisible} type="radio" checked={orientation === 'Vertical'} value="Vertical" name={"orientation" + lineId} onChange={handleOrientation} /><label id='orientation-vertical' hidden={!orientationVisible}>|</label>
                <input hidden={!orientationVisible} type="radio" checked={orientation === 'Custom'} value="Custom" name={"orientation" + lineId} onChange={handleOrientation}/><label id='orientation-custom' hidden={!orientationVisible}>Custom</label>
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
                    hidden={!orientationVisible || orientation !== "Custom"}
                />
                <div id="between-lines">
                    <label id="angle-to-next">∢</label>
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
                    <label id="lock-checkbox-label">Lock</label>
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