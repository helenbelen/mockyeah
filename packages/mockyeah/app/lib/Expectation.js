'use strict';

const assert = require('assert');
const matches = require('./matches');
const { isPromise } = require('./helpers');

/**
 * Expectation
 *  Provides mock service assertion api
 */
function Expectation(route) {
  this.route = route;
  this.prefix = `[${this.route.method}] ${this.route.path} --`;
  this.called = 0;
  this.assertions = [];
  this.handlers = [];
  this.callback = undefined;
  return this;
}

Expectation.prototype.middleware = function middleware(req, res, next) {
  this.called += 1;
  this.handlers.forEach(handler => {
    this.assertions.push(handler.bind(this, req, res, next));
  });
  req.callCount = this.called;
  next();
};

const matchAssertion = (tryer, message) => {
  let result;
  try {
    result = tryer();
  } catch (err) {
    assert(false, message + (err && err.message ? `: ${err.message}` : ''));
  }
  assert(result, message);
};

Expectation.prototype.api = function api(predicateOrMatchObject) {
  const internal = this;

  if (typeof predicateOrMatchObject === 'function') {
    const predicate = predicateOrMatchObject;
    internal.handlers.push(req => {
      try {
        const { headers, query, body, _parsedUrl, method: _method } = req;
        const { pathname: path } = _parsedUrl;
        const method = _method.toLowerCase();

        const result = predicate({
          method,
          path,
          query,
          headers,
          body,
          req
        });

        if (typeof result !== 'undefined' && !result) {
          throw new Error('function returned false');
        }
      } catch (err) {
        const message = `${internal.prefix} Expect function did not match${
          err && err.message ? `: ${err.message}` : ''
        }`;
        assert(false, message);
      }
    });
  } else if (typeof predicateOrMatchObject === 'object') {
    const matchObject = predicateOrMatchObject;
    internal.handlers.push(req => {
      const { headers, query, body, _parsedUrl, method: _method } = req;
      const { pathname: path } = _parsedUrl;
      const method = _method.toLowerCase();

      assert(
        matches(
          {
            method,
            path,
            query,
            headers,
            body
          },
          matchObject
        ),
        'Expect object not match.'
      );
    });
  }

  const apiInstance = {
    atLeast: function atLeast(number) {
      internal.assertions.push(() => {
        assert(
          internal.called >= number,
          `${
            internal.prefix
          } Expected route to be called at least ${number} times, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    atMost: function atMost(number) {
      internal.assertions.push(() => {
        assert(
          internal.called <= number,
          `${
            internal.prefix
          } Expected route to be called at most ${number} times, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    never: function never() {
      internal.assertions.push(() => {
        assert(
          internal.called === 0,
          `${internal.prefix} Expected route to be called never, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    once: function once() {
      internal.assertions.push(() => {
        assert(
          internal.called === 1,
          `${internal.prefix} Expected route to be called once, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    twice: function twice() {
      internal.assertions.push(() => {
        assert(
          internal.called === 2,
          `${internal.prefix} Expected route to be called twice, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    thrice: function thrice() {
      internal.assertions.push(() => {
        assert(
          internal.called === 3,
          `${internal.prefix} Expected route to be called thrice, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    exactly: function exactly(number) {
      internal.assertions.push(() => {
        assert(
          internal.called === number,
          `${internal.prefix} Expected route to be called ${number} times, but it was called ${
            internal.called
          } times`
        );
      });
      return this;
    },
    header: function header(name, value) {
      const message = `${internal.prefix} Header "${name}" did not match expected`;

      internal.handlers.push(req => {
        matchAssertion(() => matches(req.get(name), value), message);
      });

      return this;
    },
    params: function params(value) {
      const message = `${internal.prefix} Params did not match expected`;

      internal.handlers.push(req => {
        matchAssertion(() => matches(req.query, value), message);
      });

      return this;
    },
    query: function query(value) {
      return this.params(value);
    },
    body: function body(value) {
      const message = `${internal.prefix} Body did not match expected`;

      internal.handlers.push(req => {
        matchAssertion(() => matches(req.body, value), message);
      });

      return this;
    },
    done: function done(callback) {
      internal.callback = callback;
      return this;
    },
    run: function run(handlerOrPromise) {
      if (isPromise(handlerOrPromise)) {
        // exposed only for testing
        // eslint-disable-next-line no-underscore-dangle
        apiInstance.__runPromise = handlerOrPromise
          .then(() => {
            apiInstance.verify();
          })
          .catch(err => {
            if (internal.callback) {
              internal.callback(err);
            } else {
              throw err;
            }
          });
      } else {
        setTimeout(() => {
          const result = handlerOrPromise(apiInstance.verify);

          if (isPromise(result)) {
            result
              .then(() => {
                apiInstance.verify();
              })
              .catch(err => {
                if (internal.callback) {
                  internal.callback(err);
                } else {
                  throw err;
                }
              });
          }
        });
      }

      return this;
    },
    verify: function verify(callbackOrErr) {
      // Detect if we're using it like `.done(expectation.verify)` (not `expectation.verify(err => {})`),
      //  where it will be called like a Node callback with optional error argument.
      if (callbackOrErr && typeof callbackOrErr !== 'function' && internal.callback) {
        internal.callback(callbackOrErr);
        return;
      }

      const argCallback = typeof callbackOrErr === 'function' ? callbackOrErr : undefined;
      const callback = internal.callback ? internal.callback : argCallback;

      try {
        internal.assertions.forEach(_assertion => _assertion());
        if (callback) {
          callback();
        }
      } catch (err) {
        if (callback) {
          callback(err);
        } else {
          throw err;
        }
      }
    }
  };

  return apiInstance;
};

module.exports = Expectation;
