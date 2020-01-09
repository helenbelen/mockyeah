import React from 'react'
import {NetworkEntry} from "../NetworkEntry";

const TabNetwork = ({editMock, harLog}) => {

    return (
        <div>
            {harLog &&
            harLog?.entries?.map(entry => {

                return <NetworkEntry entry={entry} editMock={editMock}/>
            })
            }
        </div>
    )
};

export {TabNetwork}
