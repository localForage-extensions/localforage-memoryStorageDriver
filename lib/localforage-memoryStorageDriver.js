import { getSerializerPromise, executeCallback } from './utils';

var storageRepository = {};

// Config the localStorage backend, using options set in the config.
function _initStorage(options) {
    var self = this;

    var dbInfo = {};
    if (options) {
        for (var i in options) {
            dbInfo[i] = options[i];
        }
    }

    var database = storageRepository[dbInfo.name] = storageRepository[dbInfo.name] || {};
    var table = database[dbInfo.storeName] = database[dbInfo.storeName] || {};
    dbInfo.db = table;

    self._dbInfo = dbInfo;

    return getSerializerPromise(self).then(function(serializer) {
        dbInfo.serializer = serializer;
    });
}

function clear(callback) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var db = self._dbInfo.db;

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    delete db[key];
                    // db[key] = undefined;
                }
            }

            resolve();
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function getItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            try {
                var db = self._dbInfo.db;
                var result = db[key];

                if (result) {
                    result = self._dbInfo.serializer.deserialize(result);
                }

                resolve(result);
            } catch (e) {
                reject(e);
            }
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function iterate(callback) {
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            try {
                var db = self._dbInfo.db;

                for (var key in db) {
                    var result = db[key];

                    if (result) {
                        result = self._dbInfo.serializer.deserialize(result);
                    }

                    callback(result, key);
                }

                resolve();
            } catch (e) {
                reject(e);
            }
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function key(n, callback) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var db = self._dbInfo.db;
            var result = null;
            var index = 0;

            for (var key in db) {
                if (db.hasOwnProperty(key) && db[key] !== undefined) {
                    if (n === index) {
                        result = key;
                        break;
                    }
                    index++;
                }
            }

            resolve(result);
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var db = self._dbInfo.db;
            var keys = [];

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }

            resolve(keys);
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function length(callback) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        self.keys().then(function(keys) {
            resolve(keys.length);
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function removeItem(key, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            var db = self._dbInfo.db;
            if (db.hasOwnProperty(key)) {
                delete db[key];
                // db[key] = undefined;
            }

            resolve();
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function setItem(key, value, callback) {
    var self = this;

    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key +
            ' used as a key, but it is not a string.');
        key = String(key);
    }

    var promise = new Promise(function(resolve, reject) {
        self.ready().then(function() {
            // Convert undefined values to null.
            // https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            self._dbInfo.serializer.serialize(value, function(value, error) {
                if (error) {
                    reject(error);
                } else {
                    try {
                        var db = self._dbInfo.db;
                        db[key] = value;
                        resolve(originalValue);
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        }).catch(reject);
    });

    executeCallback(promise, callback);
    return promise;
}

var memoryStorageDriver = {
    _driver: 'memoryStorageDriver',
    _initStorage: _initStorage,
    // _supports: function() { return true; }
    iterate: iterate,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key,
    keys: keys
};

export default memoryStorageDriver;