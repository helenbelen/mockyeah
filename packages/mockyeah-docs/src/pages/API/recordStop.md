---
title: recordStop | API
---

# `recordStop()`

`mockyeah.recordStop(options, callback)`

Configures mockyeah to stop recording and capturing service requests,
to be called after a call to [`record`](record).
Recorded responses are written to `./mockyeah`
(or `config.suitesDir` - see [Configuration](../../Configuration)).
