import React, {useCallback} from 'react'

const NetworkEntry = ({entry, editMock}) => {
    if (!entry) {
        return null;
    }

    const {request} = entry;
    const {url, method} = request ?? {};

    const onClickMock = useCallback(() => {
        entry.getContent((content, encoding) => {
            editMock(null, {
                url,
                raw: content
            })
        })
    }, []);

    return (
        <div>
            <div style={{display: 'flex'}}>
                <div>{method}</div>
                <div>{url}</div>
                <div>
                    <button onClick={onClickMock}>mock</button>
                </div>
            </div>
        </div>
    )
};

export { NetworkEntry }
