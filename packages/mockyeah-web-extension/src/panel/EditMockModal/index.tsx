import React, { useState, useCallback} from 'react'
import Modal from 'react-modal';

const EditMockModal = ({id, init, saveMock, close}) => {
    const [method, setMethod] = useState(init?.method);
    const [url, setUrl] = useState(init?.url);
    const [body, setBody] = useState(init?.raw);

    const onChangeBody = useCallback(e => setBody(e.target.value));
    const onChangeUrl = useCallback(e => setUrl(e.target.value));
    const onChangeMethod = useCallback(e => setMethod(e.target.value));

    const onClickSubmit = useCallback(e => {
        saveMock(id, {
            method,
            url,
            body
        })
    });

    return (
        <Modal isOpen onRequestClose={close}>
            <h2>{id ? <>Edit Mock</> : <>Create Mock</>}</h2>

            <div>
                <label for="edit_method">Method</label>
                {(!method || typeof method === 'string') ? (
                    <input id="edit_method" value={method} onChange={onChangeMethod}/>
                ) : <>method isn't string</>}
            </div>

            <div>
                <label for="edit_url">URL</label>
                {(!url || typeof url === 'string') ? (
                    <textarea id="edit_url" style={{width: '100%'}} value={url} onChange={onChangeUrl}/>
                ) : <>url isn't string</>}
            </div>

            <div>
                <label for="edit_body">Body</label>
                {(!body || typeof body === 'string') ? (
                    <textarea id="edit_body" rows="15" style={{width: '100%'}} value={body} onChange={onChangeBody}/>
                ) : <>body isn't string</>}
            </div>

            <button onClick={onClickSubmit}>submit</button>
            <button onClick={close}>close</button>
        </Modal>
    )
};

export {EditMockModal }
