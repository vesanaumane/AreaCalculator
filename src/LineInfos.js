import { exportDefaultSpecifier } from '@babel/types';
import React from 'react';
import { useState, useEffect } from "react";
import LineInfo from "./LineInfo.js"

export default function LineInfos( { lines, inputCallback } ) {

    return(

        <div className="lineinfos">
            { lines.map( linedata => 
                <LineInfo
                    key={linedata.id}
                    inputCallback={inputCallback}
                    line={linedata}
                 /> 
            ) }
        </div>
    );
}


