"use strict";
var __extends = (this && this.__extends) || (function() {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function(d, b) { d.__proto__ = b; }) ||
        function(d, b) { for (var p in b)
                if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function(d, b) {
        extendStatics(d, b);

        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var uuidv1 = require("uuid/v1");
exports.PromiseContext = {
    refs: 0
};
var CancelledPromiseError = (function(_super) {
    __extends(CancelledPromiseError, _super);

    function CancelledPromiseError(message) {
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, CancelledPromiseError.prototype);
        return _this;
    }
    return CancelledPromiseError;
}(Error));
exports.CancelledPromiseError = CancelledPromiseError;
var handler = {
    construct: function(target, argumentList, newTarget) {
        exports.PromiseContext.refs++;
        var executor = argumentList[0],
            _a = argumentList[1],
            id = _a === void 0 ? uuidv1() : _a;
        exports.PromiseContext[id] = {
            cancelled: false
        };
        var instance = Object.assign(new Proxy(new target(executor), {
            get: function(target, property) {
                if (exports.PromiseContext[id].cancelled) {
                    exports.PromiseContext.refs--;
                    throw new CancelledPromiseError(id);
                }
                return (target[property] &&
                    target[property].bind &&
                    target[property].bind(target));
            }
        }), {
            cancel: function() {
                exports.PromiseContext[id].cancelled = true;
            },
            id: id
        });
        instance.then(function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            exports.PromiseContext.refs--;
            if (exports.PromiseContext[instance.id].cancelled) {
                console.log("Cancelling promise " + instance.id + " " + args);
                throw new CancelledPromiseError(id);
            }
        });
        instance["catch"](function(error) {
            exports.PromiseContext.refs--;
            throw error;
        });
        return instance;
    }
};
exports.promise = new Proxy(global.Promise, handler);
