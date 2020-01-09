import React, {useEffect, useState, useCallback} from 'react'
import ReactDOM from 'react-dom'
import {Tabs, Tab, TabList, TabPanel} from 'react-tabs'
import Modal from 'react-modal';
import {TabNetwork} from './TabNetwork';
import {TabMocks} from './TabMocks'
import {EditMockModal} from './EditMockModal'
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
        }, [connected, setMocks]);

        const editMock = useCallback((id, init) => {
            setEditingMockId(id);
            setEditingMockInit(init);
        }, [setEditingMockId, setEditingMockInit]);

        const closeEditMock = useCallback(() => {
            setEditingMockId(undefined);
            setEditingMockInit(undefined);
            getMocks(); // TODO: don't need to do this on close, only submit technically
        }, [setEditingMockId, setEditingMockInit, getMocks]);

        const refresh = useCallback(() => {
            getMocks();
            chrome.devtools.network.getHAR(_harLog => {
                setHarLog(_harLog)
            });
        }, [getMocks, setHarLog]);

        const unmock = useCallback(id => {
            const script = `
          window.__MOCKYEAH__.unmock('${id}');
        `;
            inspectEval(script);
            getMocks();
        }, [getMocks]);

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
        }, [unmock, closeEditMock]);

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
                                <TabNetwork editMock={editMock} harLog={harLog}/>
                            </TabPanel>

                            <TabPanel>
                                <TabMocks mocks={mocks} unmock={unmock} editMock={editMock}/>
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
