import React, {useEffect, useState, useCallback} from 'react'
import ReactDOM from 'react-dom'
import {Tabs, Tab, TabList, TabPanel} from 'react-tabs'
import Modal from 'react-modal';
import 'react-tabs/style/react-tabs.css';

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

const Entry = ({entry, getMocks}) => {
    if (!entry) {
        return null;
    }

    const [isMocking, setIsMocking] = useState(false)
    const [content, setContent] = useState()
    const [responseBody, setResponseBody] = useState();

    const {request} = entry;
    const {url, method} = request ?? {};

    const onClickMock = useCallback(() => {
        setIsMocking(true)
    }, []);

    useEffect(() => {
        if (isMocking) {
            entry.getContent((content, encoding) => {
                setContent(content)
            })
        }
    }, [isMocking]);

    const onChangeResponseBody = useCallback(e => {
        setResponseBody(e.target.value)
    }, []);

    const onClickSubmit = useCallback(e => {
        const script = `
          window.__MOCKYEAH__.mock('${url}', { raw: \`${responseBody || content}\` });
          window.refetch();
        `;
        inspectEval(script);
        getMocks();
    });

    return (
        <div>
            <div style={{display: 'flex'}}>
                <div>{method}</div>
                <div>{url}</div>
                <div>
                    <button onClick={onClickMock}>mock</button>
                </div>
            </div>
            {isMocking && (
                <div>
                    <div>isMocking</div>
                    <textarea value={responseBody || content} onChange={onChangeResponseBody} />
                    <button onClick={onClickSubmit}>submit</button>
                </div>
            )}
        </div>
    )
};

const Mock = ({mock, getMocks, editMock}) => {
    const [match, response] = mock
    const { id } = match.$meta;
    const { url } = match.$meta.originalNormal;
    const { raw } = response;

    const onClickUnmock = useCallback(() => {
        const script = `
          window.__MOCKYEAH__.unmock('${id}');
          window.refetch();
        `;
        inspectEval(script);
        getMocks();
    });

    const onClickEdit = useCallback(() => {
      editMock(id)
    });

    return (
        <div style={{ display: 'flex'}}>
            <div><button onClick={onClickUnmock}>x</button></div>
            <div><button onClick={onClickEdit}>edit</button></div>
            <div>{id}</div>
            <div>{url}</div>
            <div>{raw}</div>
        </div>
    )
};

const EditMockModal = ({ id, mock, closeEditMock }) => {
    const [match, response] = mock

    const [url, setUrl] = useState(match?.$meta?.originalNormal?.url);
    const [body, setBody] = useState(response?.raw);

    const onChangeBody = useCallback(e => setBody(e.target.value));
    const onChangeUrl = useCallback(e => setUrl(e.target.value));

    return (
        <Modal isOpen onRequestClose={closeEditMock}>
            <h2>editing mock {id}</h2>
            <div><textarea value={url} onChange={onChangeUrl} /></div>

            <div><textarea value={body} onChange={onChangeBody} /></div>

                <button onClick={closeEditMock}>close</button>
            </Modal>
    )
};

const App = () => {
    const [connectErrored, setConnectErrored] = useState();
    const [connected, setConnected] = useState(false);
    const [harLog, setHarLog] = useState();
    const [mocks, setMocks] = useState();
    const [editingMockId, setEditingMockId] = useState(false);
    const [editingMock, setEditingMock] = useState();

    const refresh = useCallback(() => {
        chrome.devtools.network.getHAR(harLog => {
            setHarLog(harLog)
        });
    }, []);

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
        getMocks();
    }, [getMocks]);


    useEffect(() => {
        if (!mocks) return;
        const mock = mocks.find(mock => mock[0]?.$meta?.id === editingMockId);
        if (mock) {
            setEditingMock(mock);
        }
    }, [mocks, editingMockId]);

    const editMock = useCallback(id => {
        setEditingMockId(id);
    });

    const closeEditMock = useCallback(() => {
        setEditingMock(undefined);
    })

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

                                    return <Entry entry={entry} getMocks={getMocks} />
                                })
                                }
                            </div>
                        </TabPanel>

                        <TabPanel>
                            <div>
                                {mocks && mocks.map(mock => {
                                    return <Mock mock={mock} getMocks={getMocks} editMock={editMock} />;
                                })}
                            </div>
                        </TabPanel>
                    </Tabs>
                </div>
            ) : null}
            {editingMock && <EditMockModal id={editingMockId} mock={editingMock} closeEditMock={closeEditMock} />}
        </div>
    )
};

document.body.style.background = 'white';

ReactDOM.render(<App/>, document.getElementById('app'));
