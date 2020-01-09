import React from 'react';
import {Table } from '../Table'
import { MockActionsCell } from "./MockActionsCell";

const TabMocks = ({mocks, unmock, editMock}) => {
    if (!mocks) return null;

    const columns = [
        {
            Header: () => null,
            id: 'actions',
            Cell: ({row}) => <MockActionsCell row={row} unmock={unmock} editMock={editMock}/>
        },
        // {
        //     Header: 'ID',
        //     accessor: 'id'
        // },
        {
            Header: 'Method',
            accessor: 'method'
        },
        {
            Header: 'URL',
            accessor: 'url'
        },
        {
            Header: 'Body',
            accessor: 'body'
        }
    ];

    const data = mocks.map(mock => {
        const [match, response] = mock;
        const {id} = match.$meta;
        const {url, method} = match.$meta.originalNormal;
        const {raw} = response;

        const body = raw;

        return {
            id,
            method: typeof method === 'string' ? method : typeof method,
            url: typeof url === 'string' ? url : typeof url,
            body: typeof body === 'string' ? body : typeof body,
        }
    });

    return (
        <div>
            <Table data={data} columns={columns}/>
        </div>
    );
};

export { TabMocks }
