import React from 'react';

export default class LineInfo extends React.Component {

    constructor( props ) {
        super( props );
        this.state = {
            line: props.line,
            length: props.line.length,
            angle: props.line.angle,
            inputCallback: props.inputCallback
        };
    }

    handleLengthInput( evt ) {
        const input = evt.target.value;
        this.state.length = input;
    }

    handleAngleInput( evt ) {
        const input = evt.target.value;
        this.state.angle = input;
    }

    handleOnClick() {
        this.state.inputCallback( { id: this.state.line.id, length: this.state.length, angle: this.state.angle } );
    }

    render() { 
        return(
            <li key={ this.state.line.id }>
                <div className="lineInfo">
                    <input type="number" step="0.01" defaultValue={this.state.length} onChange={ evt => { this.handleLengthInput( evt ) } } />
                    <input type="number" step="1" min={0} max={360} defaultValue={this.state.angle} onChange={ evt => { this.handleAngleInput( evt ) } } />
                    <button onClick={ () => { this.handleOnClick() }}>Save</button>
                </div>
            </li> 
        );
    }
}