import React, {useEffect, useState, useCallback} from 'react'
import ReactDOM from 'react-dom'
import {Tabs, Tab, TabList, TabPanel} from 'react-tabs'
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
                    <textarea value={responseBody || content} onChange={onChangeResponseBody}/>
                    <button onClick={onClickSubmit}>submit</button>
                </div>
            )}
        </div>
    )
};

const Mock = ({mock}) => {
    const [match, response ] = mock
    const { url } = match.$meta.originalNormal;
    const { raw } = response;

    return (
        <div style={{ display: 'flex'}}>
            <div>{url}</div>
            <div>{raw}</div>
        </div>
    )
};

const App = () => {
    const [connectErrored, setConnectErrored] = useState();
    const [connected, setConnected] = useState(false);
    const [harLog, setHarLog] = useState();
    const [mocks, setMocks] = useState();

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

                                    return <Entry entry={entry} getMocks={getMocks}/>
                                })
                                }
                            </div>
                        </TabPanel>

                        <TabPanel>
                            <div>
                                {mocks && mocks.map(mock => {
                                    return <Mock mock={mock}/>;
                                })}
                            </div>
                        </TabPanel>
                    </Tabs>
                </div>
            ) : null}
        </div>
    )
};

document.body.style.background = 'white';

ReactDOM.render(<App/>, document.getElementById('app'));
