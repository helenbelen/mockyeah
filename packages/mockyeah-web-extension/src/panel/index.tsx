import React, {useEffect, useState, useCallback} from 'react'
import ReactDOM from 'react-dom'
import {Tabs, Tab, TabList, TabPanel} from 'react-tabs'
import Modal from 'react-modal';
import {Table} from './Table';
import 'react-tabs/style/react-tabs.css';
import './index.css'

console.log('panel')

const inspectEval = (...args: Partial<Parameters<typeof chrome.devtools.inspectedWindow.eval>>) => {
    const [script, options, callback] = args;
    if (!script) return;
    console.log('eval script', {script});
    chrome.devtools.inspectedWindow.eval(script, options || {}, (result, exceptionInfo) => {
        console.log('ADJ result', result);
        console.log('ADJ exceptionInfo', exceptionInfo);

        if (callback) callback(result, exceptionInfo);
    });
};

const Entry = ({entry, editMock}) => {
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

const MocksTab = ({mocks, unmock, editMock}) => {
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

const App = () => {
    const [connectErrored, setConnectErrored] = useState();
    const [connected, setConnected] = useState(false);
    const [harLog, setHarLog] = useState();
    const [mocks, setMocks] = useState();
    const [editingMockId, setEditingMockId] = useState(false);
    const [editingMockInit, setEditingMockInit] = useState();

    const getMocks = useCallback(() => {
        if (!connected) return;

        const script = `window.__MOCKYEAH__.__private.mocks`;

        inspectEval(script, undefined, (result, exceptionInfo) => {
            console.log('ADJ result', result);
            console.log('ADJ exceptionInfo', exceptionInfo);

            if (exceptionInfo) {
                return;
            } else if (result) {
                setMocks(result);
            }
        });
    }, [connected]);

    const editMock = useCallback((id, init) => {
        setEditingMockId(id);
        setEditingMockInit(init);
    });

    const closeEditMock = useCallback(() => {
        setEditingMockId(undefined);
        setEditingMockInit(undefined);
        getMocks(); // TODO: don't need to do this on close, only submit technically
    });

    const refresh = useCallback(() => {
        getMocks();
        chrome.devtools.network.getHAR(harLog => {
            setHarLog(harLog)
        });
    }, []);

    const unmock = useCallback(id => {
        const script = `
          window.__MOCKYEAH__.unmock('${id}');
        `;
        inspectEval(script);
        getMocks();
    });

    const saveMock = useCallback((id, init) => {
        const {body, url, method} = init;

        if (id) {
            unmock(id);
        }

        const script = `
          window.__MOCKYEAH__.mock({
            ${method ? `method: '${method}',` : ''}
            url: '${url}'
          }, {
            raw: \`${body}\`
          });
        `;
        inspectEval(script);
        closeEditMock();
    });

    useEffect(() => {
        getMocks();
    }, [getMocks]);

    useEffect(() => {
        const script = `Boolean(window.__MOCKYEAH__)`;

        inspectEval(script, undefined, (result, exceptionInfo) => {
            console.log('ADJ result', result);
            console.log('ADJ exceptionInfo', exceptionInfo);

            if (exceptionInfo) {
                setConnectErrored(true)
            } else if (result) {
                setConnected(true);
            }
        });

        chrome.devtools.network.onRequestFinished.addListener(
            (request) => {
                refresh();
            });

        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!mocks) return;
        const mock = mocks.find(mock => mock[0]?.$meta?.id === editingMockId);
        if (mock) {
            const [match, response] = mock || [];

            setEditingMockInit({
                url: match?.$meta?.originalNormal?.url,
                raw: response?.raw
            })
        }
    }, [mocks, editingMockId]);

    return (
        <div>
            <h1>Mockyeah</h1>
            {connectErrored ? (
                <div>connect error!</div>
            ) : connected ? (
                <div>
                    <div>connected</div>

                    <button onClick={refresh}>refresh</button>

                    <Tabs>
                        <TabList>
                            <Tab>Network</Tab>
                            <Tab>Mocks</Tab>
                        </TabList>

                        <TabPanel>
                            <div>
                                {harLog &&
                                harLog?.entries?.map(entry => {

                                    return <Entry entry={entry} editMock={editMock}/>
                                })
                                }
                            </div>
                        </TabPanel>

                        <TabPanel>
                            <MocksTab mocks={mocks} unmock={unmock} editMock={editMock}/>
                        </TabPanel>
                    </Tabs>
                </div>
            ) : null}
            {editingMockInit &&
            <EditMockModal id={editingMockId} init={editingMockInit} saveMock={saveMock} close={closeEditMock}/>}
        </div>
    )
}
;

document.body.style.background = 'white';

const appElement = document.getElementById('app')

Modal.setAppElement(appElement);

ReactDOM.render(<App/>, appElement);
