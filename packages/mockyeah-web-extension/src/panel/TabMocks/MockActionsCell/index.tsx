import React, { useCallback } from 'react'

const MockActionsCell = ({row, unmock, editMock}) => {
    const {original} = row;
    const {id} = original;

    const onClickUnmock = useCallback(() => {
        unmock(id);
    });

    const onClickEdit = useCallback(() => {
        editMock(id)
    });

    return (
        <>
            <button onClick={onClickUnmock}>x</button>
            <button onClick={onClickEdit}>edit</button>
        </>
    )
};

export { MockActionsCell };
