var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.production.js
var require_react_production = __commonJS({
  "node_modules/react/cjs/react.production.js"(exports2) {
    "use strict";
    var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
    var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
    var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
    var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
    var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
    var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
    var REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
    var ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function() {
      },
      enqueueReplaceState: function() {
      },
      enqueueSetState: function() {
      }
    };
    var assign = Object.assign;
    var emptyObject = {};
    function Component(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    Component.prototype.isReactComponent = {};
    Component.prototype.setState = function(partialState, callback) {
      if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables."
        );
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    function ComponentDummy() {
    }
    ComponentDummy.prototype = Component.prototype;
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
    pureComponentPrototype.constructor = PureComponent;
    assign(pureComponentPrototype, Component.prototype);
    pureComponentPrototype.isPureReactComponent = true;
    var isArrayImpl = Array.isArray;
    function noop() {
    }
    var ReactSharedInternals = { H: null, A: null, T: null, S: null };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function ReactElement(type, key, props) {
      var refProp = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== refProp ? refProp : null,
        props
      };
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      return ReactElement(oldElement.type, newKey, oldElement.props);
    }
    function isValidElement(object) {
      return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    var userProvidedKeyEscapeRegex = /\/+/g;
    function getElementKey(element, index) {
      return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
            function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            },
            function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          )), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if ("undefined" === type || "boolean" === type) children = null;
      var invokeCallback = false;
      if (null === children) invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(
                  invokeCallback(children._payload),
                  array,
                  escapedPrefix,
                  nameSoFar,
                  callback
                );
            }
        }
      if (invokeCallback)
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
        })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
          callback,
          escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
            userProvidedKeyEscapeRegex,
            "$&/"
          ) + "/") + invokeCallback
        )), array.push(callback)), 1;
      invokeCallback = 0;
      var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0; i < children.length; i++)
          nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if (i = getIteratorFn(children), "function" === typeof i)
        for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if ("object" === type) {
        if ("function" === typeof children.then)
          return mapIntoArray(
            resolveThenable(children),
            array,
            escapedPrefix,
            nameSoFar,
            callback
          );
        array = String(children);
        throw Error(
          "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
        );
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (null == children) return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (-1 === payload._status) {
        var ctor = payload._result, thenable = ctor();
        thenable.then(
          function(moduleObject) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 1, payload._result = moduleObject, void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
          },
          function(error) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 2, payload._result = error, void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
          }
        );
        -1 === payload._status && (payload._status = 0, payload._result = thenable);
      }
      if (1 === payload._status) return payload._result.default;
      throw payload._result;
    }
    var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
      if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event)) return;
      } else if ("object" === typeof process && "function" === typeof process.emit) {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    };
    function startTransition(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      currentTransition.types = null !== prevTransition ? prevTransition.types : null;
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
      } catch (error) {
        reportGlobalError(error);
      } finally {
        null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
      }
    }
    function addTransitionType(type) {
      var transition = ReactSharedInternals.T;
      if (null !== transition) {
        var transitionTypes = transition.types;
        null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
      } else startTransition(addTransitionType.bind(null, type));
    }
    var Children = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function() {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      },
      count: function(children) {
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement(children))
          throw Error(
            "React.Children.only expected to receive a single React element child."
          );
        return children;
      }
    };
    exports2.Activity = REACT_ACTIVITY_TYPE;
    exports2.Children = Children;
    exports2.Component = Component;
    exports2.Fragment = REACT_FRAGMENT_TYPE;
    exports2.Profiler = REACT_PROFILER_TYPE;
    exports2.PureComponent = PureComponent;
    exports2.StrictMode = REACT_STRICT_MODE_TYPE;
    exports2.Suspense = REACT_SUSPENSE_TYPE;
    exports2.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
    exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports2.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function(size) {
        return ReactSharedInternals.H.useMemoCache(size);
      }
    };
    exports2.addTransitionType = addTransitionType;
    exports2.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports2.cacheSignal = function() {
      return null;
    };
    exports2.cloneElement = function(element, config, children) {
      if (null === element || void 0 === element)
        throw Error(
          "The argument must be a React element, but you passed " + element + "."
        );
      var props = assign({}, element.props), key = element.key;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key, props);
    };
    exports2.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      return defaultValue;
    };
    exports2.createElement = function(type, config, children) {
      var propName, props = {}, key = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (1 === childrenLength) props.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          void 0 === props[propName] && (props[propName] = childrenLength[propName]);
      return ReactElement(type, key, props);
    };
    exports2.createRef = function() {
      return { current: null };
    };
    exports2.forwardRef = function(render) {
      return { $$typeof: REACT_FORWARD_REF_TYPE, render };
    };
    exports2.isValidElement = isValidElement;
    exports2.lazy = function(ctor) {
      return {
        $$typeof: REACT_LAZY_TYPE,
        _payload: { _status: -1, _result: ctor },
        _init: lazyInitializer
      };
    };
    exports2.memo = function(type, compare) {
      return {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: void 0 === compare ? null : compare
      };
    };
    exports2.startTransition = startTransition;
    exports2.unstable_useCacheRefresh = function() {
      return ReactSharedInternals.H.useCacheRefresh();
    };
    exports2.use = function(usable) {
      return ReactSharedInternals.H.use(usable);
    };
    exports2.useActionState = function(action, initialState, permalink) {
      return ReactSharedInternals.H.useActionState(action, initialState, permalink);
    };
    exports2.useCallback = function(callback, deps) {
      return ReactSharedInternals.H.useCallback(callback, deps);
    };
    exports2.useContext = function(Context) {
      return ReactSharedInternals.H.useContext(Context);
    };
    exports2.useDebugValue = function() {
    };
    exports2.useDeferredValue = function(value, initialValue) {
      return ReactSharedInternals.H.useDeferredValue(value, initialValue);
    };
    exports2.useEffect = function(create2, deps) {
      return ReactSharedInternals.H.useEffect(create2, deps);
    };
    exports2.useEffectEvent = function(callback) {
      return ReactSharedInternals.H.useEffectEvent(callback);
    };
    exports2.useId = function() {
      return ReactSharedInternals.H.useId();
    };
    exports2.useImperativeHandle = function(ref, create2, deps) {
      return ReactSharedInternals.H.useImperativeHandle(ref, create2, deps);
    };
    exports2.useInsertionEffect = function(create2, deps) {
      return ReactSharedInternals.H.useInsertionEffect(create2, deps);
    };
    exports2.useLayoutEffect = function(create2, deps) {
      return ReactSharedInternals.H.useLayoutEffect(create2, deps);
    };
    exports2.useMemo = function(create2, deps) {
      return ReactSharedInternals.H.useMemo(create2, deps);
    };
    exports2.useOptimistic = function(passthrough, reducer) {
      return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
    };
    exports2.useReducer = function(reducer, initialArg, init) {
      return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
    };
    exports2.useRef = function(initialValue) {
      return ReactSharedInternals.H.useRef(initialValue);
    };
    exports2.useState = function(initialState) {
      return ReactSharedInternals.H.useState(initialState);
    };
    exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return ReactSharedInternals.H.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
      );
    };
    exports2.useTransition = function() {
      return ReactSharedInternals.H.useTransition();
    };
    exports2.version = "19.3.0";
  }
});

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports2, module2) {
    "use strict";
    "production" !== process.env.NODE_ENV && (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
          case REACT_VIEW_TRANSITION_TYPE:
            return "ViewTransition";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
            resolveDebugValue = resolve;
            rejectDebugValue = reject;
          }));
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                if (null != _ioInfo) {
                  _ioInfo.end = performance.now();
                  var debugValue = null == moduleObject ? void 0 : moduleObject.default;
                  resolveDebugValue(debugValue);
                  _ioInfo.value.status = "fulfilled";
                  _ioInfo.value.value = debugValue;
                }
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop, noop), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function startTransition(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = null !== prevTransition ? prevTransition.types : null;
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function addTransitionType(type) {
        var transition = ReactSharedInternals.T;
        if (null !== transition) {
          var transitionTypes = transition.types;
          null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
        } else
          0 === ReactSharedInternals.asyncTransitions && console.error(
            "addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."
          ), startTransition(addTransitionType.bind(null, type));
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module2 && module2[requireString]).call(
              module2,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports2.Activity = REACT_ACTIVITY_TYPE;
      exports2.Children = fnName;
      exports2.Component = Component;
      exports2.Fragment = REACT_FRAGMENT_TYPE;
      exports2.Profiler = REACT_PROFILER_TYPE;
      exports2.PureComponent = PureComponent;
      exports2.StrictMode = REACT_STRICT_MODE_TYPE;
      exports2.Suspense = REACT_SUSPENSE_TYPE;
      exports2.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
      exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports2.__COMPILER_RUNTIME = deprecatedAPIs;
      exports2.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports2.addTransitionType = addTransitionType;
      exports2.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports2.cacheSignal = function() {
        return null;
      };
      exports2.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports2.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports2.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports2.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        var propName;
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          childrenLength,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports2.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports2.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports2.isValidElement = isValidElement;
      exports2.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports2.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports2.startTransition = startTransition;
      exports2.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports2.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports2.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports2.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports2.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports2.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports2.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports2.useEffect = function(create2, deps) {
        null == create2 && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create2, deps);
      };
      exports2.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports2.useId = function() {
        return resolveDispatcher().useId();
      };
      exports2.useImperativeHandle = function(ref, create2, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create2, deps);
      };
      exports2.useInsertionEffect = function(create2, deps) {
        null == create2 && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create2, deps);
      };
      exports2.useLayoutEffect = function(create2, deps) {
        null == create2 && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create2, deps);
      };
      exports2.useMemo = function(create2, deps) {
        return resolveDispatcher().useMemo(create2, deps);
      };
      exports2.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports2.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports2.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports2.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports2.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports2.version = "19.3.0";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_production();
    } else {
      module2.exports = require_react_development();
    }
  }
});

// node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
};
var createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

// node_modules/zustand/esm/react.mjs
var import_react = __toESM(require_react(), 1);
var identity = (arg) => arg;
function useStore(api, selector = identity) {
  const slice = import_react.default.useSyncExternalStore(
    api.subscribe,
    import_react.default.useCallback(() => selector(api.getState()), [api, selector]),
    import_react.default.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  import_react.default.useDebugValue(slice);
  return slice;
}
var createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
var create = ((createState) => createState ? createImpl(createState) : createImpl);

// src/engine/priority.ts
var DEFAULT_PRIORITY_RULES = {
  categoryBase: {
    database: 9,
    document: 9,
    code: 8,
    photo: 7,
    video: 6,
    archive: 4,
    audio: 5,
    log_temp: 2,
    other: 5
  },
  recencyBonusDays: 30,
  recencyBonusPoints: 2,
  agePenaltyDays: 730,
  // 2 years
  agePenaltyPoints: 2
};
var EXTENSION_MAP = {
  // Database
  sql: "database",
  db: "database",
  sqlite: "database",
  sqlite3: "database",
  mdb: "database",
  accdb: "database",
  dump: "database",
  // Documents
  pdf: "document",
  doc: "document",
  docx: "document",
  xls: "document",
  xlsx: "document",
  ppt: "document",
  pptx: "document",
  txt: "document",
  md: "document",
  rtf: "document",
  odt: "document",
  csv: "document",
  // Code
  ts: "code",
  tsx: "code",
  js: "code",
  jsx: "code",
  py: "code",
  java: "code",
  c: "code",
  cpp: "code",
  cs: "code",
  go: "code",
  rs: "code",
  php: "code",
  rb: "code",
  html: "code",
  css: "code",
  json: "code",
  yaml: "code",
  yml: "code",
  xml: "code",
  sh: "code",
  // Photos
  jpg: "photo",
  jpeg: "photo",
  png: "photo",
  gif: "photo",
  webp: "photo",
  svg: "photo",
  raw: "photo",
  cr2: "photo",
  nef: "photo",
  arw: "photo",
  dng: "photo",
  heic: "photo",
  // Videos
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  wmv: "video",
  webm: "video",
  m4v: "video",
  flv: "video",
  // Archives
  zip: "archive",
  tar: "archive",
  gz: "archive",
  "7z": "archive",
  rar: "archive",
  bz2: "archive",
  xz: "archive",
  // Audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  m4a: "audio",
  // Logs & Temp
  log: "log_temp",
  tmp: "log_temp",
  temp: "log_temp",
  bak: "log_temp",
  cache: "log_temp",
  ds_store: "log_temp"
};
function detectCategory(fileName, mimeType) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "photo";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text/plain")) return "document";
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("compressed")) return "archive";
  }
  return "other";
}
function suggestPriority(category, lastModified, nowMs = Date.now(), rules = DEFAULT_PRIORITY_RULES) {
  let score = rules.categoryBase[category] ?? 5;
  const ageDays = (nowMs - lastModified) / (1e3 * 60 * 60 * 24);
  let modifierNote = "";
  if (ageDays <= rules.recencyBonusDays) {
    score += rules.recencyBonusPoints;
    modifierNote = ` (+${rules.recencyBonusPoints} recency bonus)`;
  } else if (ageDays >= rules.agePenaltyDays) {
    score -= rules.agePenaltyPoints;
    modifierNote = ` (-${rules.agePenaltyPoints} inactive penalty)`;
  }
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const reason = `Base priority for ${category}: ${rules.categoryBase[category]}${modifierNote}`;
  return { priority: clamped, reason };
}
function recalculateFilePriorities(files, rules = DEFAULT_PRIORITY_RULES, forceAll = false) {
  const now = Date.now();
  return files.map((file) => {
    if (file.prioritySource === "edited" && !forceAll) {
      return file;
    }
    const { priority } = suggestPriority(file.category, file.lastModified, now, rules);
    return {
      ...file,
      priority,
      prioritySource: "auto"
    };
  });
}

// src/engine/normalizer.ts
var BYTE_UNITS = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024
};
var ROUNDING_UNIT_BYTES = {
  "1MB": 1 * BYTE_UNITS.MB,
  "10MB": 10 * BYTE_UNITS.MB,
  "100MB": 100 * BYTE_UNITS.MB,
  "1GB": 1 * BYTE_UNITS.GB
};
function getAutoUnitBytes(quotaBytes) {
  if (quotaBytes <= 0) return BYTE_UNITS.MB;
  const targetColumns = 2e3;
  const idealUnit = quotaBytes / targetColumns;
  if (idealUnit <= BYTE_UNITS.MB) return BYTE_UNITS.MB;
  if (idealUnit <= 10 * BYTE_UNITS.MB) return 10 * BYTE_UNITS.MB;
  if (idealUnit <= 100 * BYTE_UNITS.MB) return 100 * BYTE_UNITS.MB;
  if (idealUnit <= BYTE_UNITS.GB) return BYTE_UNITS.GB;
  if (idealUnit <= 5 * BYTE_UNITS.GB) return 5 * BYTE_UNITS.GB;
  return 10 * BYTE_UNITS.GB;
}
function resolveUnitBytes(quotaBytes, option) {
  if (option === "auto") {
    return getAutoUnitBytes(quotaBytes);
  }
  return ROUNDING_UNIT_BYTES[option] ?? BYTE_UNITS.MB;
}
function normaliseItemSize(sizeBytes, unitBytes) {
  if (sizeBytes <= 0) return 0;
  return Math.max(1, Math.ceil(sizeBytes / unitBytes));
}
function normaliseQuota(quotaBytes, unitBytes) {
  if (quotaBytes <= 0) return 0;
  return Math.floor(quotaBytes / unitBytes);
}

// src/data/sampleDatasets.ts
function createSampleFile(name, path, sizeBytes, daysAgo, manualPriority) {
  const lastModified = Date.now() - daysAgo * 24 * 60 * 60 * 1e3;
  const category = detectCategory(name);
  const { priority } = suggestPriority(category, lastModified);
  return {
    id: `sample-${name.replace(/[^a-zA-Z0-9]/g, "_")}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    path,
    size: sizeBytes,
    type: name.split(".").pop() || "bin",
    lastModified,
    category,
    priority: manualPriority ?? priority,
    prioritySource: manualPriority ? "edited" : "auto",
    isPinned: false,
    isExcluded: false
  };
}
var STUDENT_LAPTOP_DATASET = [
  createSampleFile("Algorithms_Final_Report.pdf", "/Documents/School/Algorithms_Final_Report.pdf", 8.4 * BYTE_UNITS.MB, 5, 10),
  createSampleFile("Machine_Learning_Thesis.docx", "/Documents/School/Machine_Learning_Thesis.docx", 18.2 * BYTE_UNITS.MB, 10, 9),
  createSampleFile("Compiler_Project_Repo.zip", "/Code/Compiler_Project_Repo.zip", 320 * BYTE_UNITS.MB, 12, 9),
  createSampleFile("Ubuntu_24_04_LTS.iso", "/Downloads/Ubuntu_24_04_LTS.iso", 4.8 * BYTE_UNITS.GB, 20, 4),
  createSampleFile("WebDev_Node_Modules_Backup.tar.gz", "/Code/Backups/WebDev_Node_Modules_Backup.tar.gz", 1.2 * BYTE_UNITS.GB, 25, 3),
  createSampleFile("Class_Lecture_Week10.mp4", "/Videos/Lectures/Class_Lecture_Week10.mp4", 1.8 * BYTE_UNITS.GB, 8, 7),
  createSampleFile("Class_Lecture_Week09.mp4", "/Videos/Lectures/Class_Lecture_Week09.mp4", 1.6 * BYTE_UNITS.GB, 15, 6),
  createSampleFile("Campus_Festival_Photos.zip", "/Photos/Campus_Festival_Photos.zip", 2.1 * BYTE_UNITS.GB, 30, 5),
  createSampleFile("Spotify_Offline_Cache.dat", "/AppData/Spotify/Spotify_Offline_Cache.dat", 3.4 * BYTE_UNITS.GB, 2, 2),
  createSampleFile("Project_Proposal.pdf", "/Documents/Work/Project_Proposal.pdf", 14 * BYTE_UNITS.MB, 14, 9),
  createSampleFile("Expense_Report_Q3.docx", "/Documents/Finance/Expense_Report_Q3.docx", 15 * BYTE_UNITS.MB, 5, 8),
  createSampleFile("System_Config_Backup.bin", "/Backups/System/System_Config_Backup.bin", 75 * BYTE_UNITS.MB, 20, 5)
];
var PHOTOGRAPHER_DATASET = [
  // Commercial project shoot
  createSampleFile("Vogue_Shoot_001.CR2", "/Client_Shoots/Vogue/RAW/Vogue_Shoot_001.CR2", 45 * BYTE_UNITS.MB, 4),
  createSampleFile("Vogue_Shoot_002.CR2", "/Client_Shoots/Vogue/RAW/Vogue_Shoot_002.CR2", 48 * BYTE_UNITS.MB, 4),
  createSampleFile("Vogue_Shoot_003.CR2", "/Client_Shoots/Vogue/RAW/Vogue_Shoot_003.CR2", 46 * BYTE_UNITS.MB, 4),
  createSampleFile("Vogue_Shoot_004.CR2", "/Client_Shoots/Vogue/RAW/Vogue_Shoot_004.CR2", 50 * BYTE_UNITS.MB, 4),
  createSampleFile("Vogue_Master_Retouch.psd", "/Client_Shoots/Vogue/Exports/Vogue_Master_Retouch.psd", 1.8 * BYTE_UNITS.GB, 2, 10),
  createSampleFile("Vogue_Editorial_Final.jpg", "/Client_Shoots/Vogue/Exports/Vogue_Editorial_Final.jpg", 24 * BYTE_UNITS.MB, 2, 9),
  // Wedding shoot
  createSampleFile("Wedding_Highlights_4K.mov", "/Weddings/Miller/Video/Wedding_Highlights_4K.mov", 14.5 * BYTE_UNITS.GB, 10, 8),
  createSampleFile("Wedding_Ceremony_RAW.mp4", "/Weddings/Miller/Video/Wedding_Ceremony_RAW.mp4", 28 * BYTE_UNITS.GB, 12, 6),
  createSampleFile("Wedding_Audio_Multitrack.wav", "/Weddings/Miller/Audio/Wedding_Audio_Multitrack.wav", 1.4 * BYTE_UNITS.GB, 12, 7),
  createSampleFile("Wedding_Album_Print_Ready.pdf", "/Weddings/Miller/Deliverables/Wedding_Album_Print_Ready.pdf", 380 * BYTE_UNITS.MB, 8, 9),
  // Landscape Portfolio
  createSampleFile("Patagonia_Glacier_Sunrise.DNG", "/Portfolio/Landscape/Patagonia_Glacier_Sunrise.DNG", 92 * BYTE_UNITS.MB, 400, 7),
  createSampleFile("Dolomites_Peak_Panorama.tiff", "/Portfolio/Landscape/Dolomites_Peak_Panorama.tiff", 450 * BYTE_UNITS.MB, 500, 7),
  createSampleFile("Iceland_Northern_Lights.RAW", "/Portfolio/Landscape/Iceland_Northern_Lights.RAW", 85 * BYTE_UNITS.MB, 650, 7),
  createSampleFile("Portfolio_Site_Assets.zip", "/Portfolio/Web/Portfolio_Site_Assets.zip", 750 * BYTE_UNITS.MB, 60, 6),
  // Drone Footage
  createSampleFile("Coastline_Drone_Take1.mp4", "/Stock_Footage/Drone/Coastline_Drone_Take1.mp4", 6.2 * BYTE_UNITS.GB, 25, 6),
  createSampleFile("Coastline_Drone_Take2.mp4", "/Stock_Footage/Drone/Coastline_Drone_Take2.mp4", 5.8 * BYTE_UNITS.GB, 25, 6),
  createSampleFile("Alpine_Forest_Fog.mp4", "/Stock_Footage/Drone/Alpine_Forest_Fog.mp4", 8.1 * BYTE_UNITS.GB, 80, 5),
  // Lightroom Catalog & Caches
  createSampleFile("Master_Lightroom_Catalog.lrcat", "/Lightroom/Master_Lightroom_Catalog.lrcat", 4.5 * BYTE_UNITS.GB, 1, 9),
  createSampleFile("Lightroom_Smart_Previews.lrdata", "/Lightroom/Lightroom_Smart_Previews.lrdata", 12 * BYTE_UNITS.GB, 1, 3),
  createSampleFile("Camera_Raw_Cache.tmp", "/Cache/Camera_Raw_Cache.tmp", 8.5 * BYTE_UNITS.GB, 1, 2),
  // Soundtracks & SFX
  createSampleFile("Cinematic_Epic_Strings.wav", "/Audio/SFX/Cinematic_Epic_Strings.wav", 65 * BYTE_UNITS.MB, 150, 5),
  createSampleFile("Ambient_Wind_Chimes.flac", "/Audio/SFX/Ambient_Wind_Chimes.flac", 42 * BYTE_UNITS.MB, 200, 4),
  createSampleFile("Podcast_Interview_Episode04.wav", "/Audio/Podcasts/Podcast_Interview_Episode04.wav", 820 * BYTE_UNITS.MB, 14, 7),
  // Archive & Outtakes
  createSampleFile("Discarded_Outtakes_2024.zip", "/Archives/Discarded_Outtakes_2024.zip", 35 * BYTE_UNITS.GB, 400, 2),
  createSampleFile("Expired_Client_Proofs.tar", "/Archives/Expired_Client_Proofs.tar", 18 * BYTE_UNITS.GB, 600, 2),
  // More RAW batch files to reach 40 files
  ...Array.from(
    { length: 15 },
    (_, i) => createSampleFile(
      `Tokyo_Street_Batch_${String(i + 1).padStart(3, "0")}.ARW`,
      `/Travel/Tokyo/RAW/Tokyo_Street_Batch_${String(i + 1).padStart(3, "0")}.ARW`,
      (38 + i % 7) * BYTE_UNITS.MB,
      45 + i * 2,
      6
    )
  )
];
var COMPANY_SERVER_DATASET = [
  // Database backups
  createSampleFile("production_postgres_dump_2026_09_28.sql.gz", "/Backups/PostgreSQL/production_postgres_dump_2026_09_28.sql.gz", 14.8 * BYTE_UNITS.GB, 1, 10),
  createSampleFile("production_postgres_dump_2026_09_21.sql.gz", "/Backups/PostgreSQL/production_postgres_dump_2026_09_21.sql.gz", 14.5 * BYTE_UNITS.GB, 8, 8),
  createSampleFile("staging_db_clone.sql", "/Backups/PostgreSQL/staging_db_clone.sql", 8.2 * BYTE_UNITS.GB, 30, 6),
  createSampleFile("analytics_clickhouse_backup.tar", "/Backups/ClickHouse/analytics_clickhouse_backup.tar", 42 * BYTE_UNITS.GB, 14, 7),
  createSampleFile("customer_crm_sqlite.db", "/Backups/CRM/customer_crm_sqlite.db", 1.8 * BYTE_UNITS.GB, 2, 9),
  // System & VM Images
  createSampleFile("k8s_worker_node_image.qcow2", "/VirtualMachines/k8s_worker_node_image.qcow2", 22.5 * BYTE_UNITS.GB, 90, 5),
  createSampleFile("legacy_windows_server_vm.vmdk", "/VirtualMachines/legacy_windows_server_vm.vmdk", 68 * BYTE_UNITS.GB, 450, 4),
  createSampleFile("ci_docker_builder_cache.tar", "/Docker/ci_docker_builder_cache.tar", 34 * BYTE_UNITS.GB, 3, 3),
  // Audit, Security & Financials
  createSampleFile("Q3_2026_Financial_Audit.xlsx", "/Corporate/Finance/Q3_2026_Financial_Audit.xlsx", 14.2 * BYTE_UNITS.MB, 5, 10),
  createSampleFile("SOC2_Compliance_Evidence_Bundle.zip", "/Security/SOC2_Compliance_Evidence_Bundle.zip", 3.2 * BYTE_UNITS.GB, 12, 10),
  createSampleFile("Employee_Contracts_Encrypted.tar.enc", "/Corporate/Legal/Employee_Contracts_Encrypted.tar.enc", 850 * BYTE_UNITS.MB, 20, 10),
  createSampleFile("SSL_Certs_And_Keys_Vault.tar.gz", "/Security/SSL_Certs_And_Keys_Vault.tar.gz", 4.5 * BYTE_UNITS.MB, 40, 10),
  // Logs & Debug dumps
  createSampleFile("nginx_access_log_august_2026.log", "/Logs/Nginx/nginx_access_log_august_2026.log", 19.5 * BYTE_UNITS.GB, 35, 2),
  createSampleFile("nginx_access_log_september_2026.log", "/Logs/Nginx/nginx_access_log_september_2026.log", 24.2 * BYTE_UNITS.GB, 2, 3),
  createSampleFile("api_gateway_error_traces.log", "/Logs/Gateway/api_gateway_error_traces.log", 7.4 * BYTE_UNITS.GB, 1, 3),
  createSampleFile("core_memory_dump_crash_2026_08.dmp", "/Crashes/core_memory_dump_crash_2026_08.dmp", 16 * BYTE_UNITS.GB, 50, 2),
  // Git repositories & Releases
  createSampleFile("monorepo_mirror_bundle.bundle", "/Git/monorepo_mirror_bundle.bundle", 5.6 * BYTE_UNITS.GB, 3, 9),
  createSampleFile("release_v4_2_0_linux_x86_64.tar.gz", "/Releases/release_v4_2_0_linux_x86_64.tar.gz", 420 * BYTE_UNITS.MB, 15, 8),
  createSampleFile("release_v4_1_9_linux_x86_64.tar.gz", "/Releases/release_v4_1_9_linux_x86_64.tar.gz", 415 * BYTE_UNITS.MB, 45, 6),
  createSampleFile("release_v4_0_0_legacy.tar.gz", "/Releases/release_v4_0_0_legacy.tar.gz", 390 * BYTE_UNITS.MB, 180, 5),
  // Additional realistic server entries to make 60 files
  ...Array.from({ length: 40 }, (_, i) => {
    const isOld = i > 25;
    const cat = i % 3 === 0 ? "Logs" : i % 3 === 1 ? "Backups" : "Documents";
    const ext = i % 3 === 0 ? "log" : i % 3 === 1 ? "sql.gz" : "pdf";
    return createSampleFile(
      `department_archive_shard_${String(i + 1).padStart(2, "0")}.${ext}`,
      `/${cat}/Shards/department_archive_shard_${String(i + 1).padStart(2, "0")}.${ext}`,
      (0.8 + i % 6 * 1.5) * BYTE_UNITS.GB,
      isOld ? 800 + i * 10 : 10 + i * 5,
      isOld ? 2 : 5 + i % 5
    );
  })
];

// src/engine/fileUtils.ts
function markDuplicates(files) {
  const groups = /* @__PURE__ */ new Map();
  for (const file of files) {
    const key = `${file.name.toLowerCase()}___${file.size}`;
    const list = groups.get(key) || [];
    list.push(file);
    groups.set(key, list);
  }
  return files.map((file) => {
    const key = `${file.name.toLowerCase()}___${file.size}`;
    const group = groups.get(key);
    const isDuplicate = !!group && group.length > 1;
    return {
      ...file,
      isDuplicate,
      duplicateGroup: isDuplicate ? key : void 0
    };
  });
}
function resolveDuplicatesKeepOne(files) {
  const seen = /* @__PURE__ */ new Set();
  return files.map((file) => {
    if (!file.isDuplicate || !file.duplicateGroup) {
      return file;
    }
    if (seen.has(file.duplicateGroup)) {
      return {
        ...file,
        isExcluded: true
      };
    }
    seen.add(file.duplicateGroup);
    return file;
  });
}
function aggregateFolders(files, depth = 1) {
  const folderMap = /* @__PURE__ */ new Map();
  for (const file of files) {
    if (file.isExcluded) continue;
    const cleanPath = file.path.replace(/\\/g, "/");
    const segments = cleanPath.split("/").filter(Boolean);
    let folderPath = "Root Files";
    if (segments.length > 1) {
      const takeSegments = segments.slice(0, Math.min(depth, segments.length - 1));
      folderPath = "/" + takeSegments.join("/");
    }
    const current = folderMap.get(folderPath) || {
      files: [],
      totalSize: 0,
      weightedPrioritySum: 0
    };
    current.files.push(file);
    current.totalSize += file.size;
    current.weightedPrioritySum += file.size * file.priority;
    folderMap.set(folderPath, current);
  }
  const result = [];
  folderMap.forEach((data, folderPath) => {
    const avgPriority = data.totalSize > 0 ? Math.max(1, Math.min(10, Math.round(data.weightedPrioritySum / data.totalSize))) : 5;
    const folderName = folderPath === "Root Files" ? "Root Files" : folderPath.split("/").pop() || folderPath;
    const hasPinned = data.files.some((f) => f.isPinned);
    result.push({
      id: `folder-${folderPath.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: folderName,
      path: folderPath,
      size: data.totalSize,
      fileCount: data.files.length,
      priority: avgPriority,
      prioritySource: "auto",
      isPinned: hasPinned,
      isExcluded: false,
      childFileIds: data.files.map((f) => f.id)
    });
  });
  return result.sort((a, b) => b.size - a.size);
}
function applyCapStrategy(files, strategy, unitBytes, smallThresholdBytes = 5 * 1024 * 1024) {
  const activeFiles = files.filter((f) => !f.isExcluded);
  if (activeFiles.length <= 500) {
    const items2 = activeFiles.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded
    }));
    return { items: items2 };
  }
  if (strategy === "largest_500") {
    const sorted = [...activeFiles].sort((a, b) => b.size - a.size);
    const top500 = sorted.slice(0, 500);
    const items2 = top500.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded
    }));
    return {
      items: items2,
      strategyAppliedNote: `Cap active: Limited to the 500 largest files out of ${files.length}.`
    };
  }
  if (strategy === "bundle_small_files") {
    const largeFiles = activeFiles.filter((f) => f.size >= smallThresholdBytes);
    const smallFiles = activeFiles.filter((f) => f.size < smallThresholdBytes);
    const items2 = largeFiles.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      normalizedSize: normaliseItemSize(f.size, unitBytes),
      value: f.priority,
      category: f.category,
      isPinned: f.isPinned,
      isExcluded: f.isExcluded
    }));
    if (smallFiles.length > 0) {
      const bundleSize = smallFiles.reduce((acc, f) => acc + f.size, 0);
      const bundleWeightedVal = bundleSize > 0 ? Math.round(smallFiles.reduce((acc, f) => acc + f.size * f.priority, 0) / bundleSize) : 6;
      items2.push({
        id: "bundle-small-files",
        name: `[Bundle: ${smallFiles.length} files under ${(smallThresholdBytes / 1024 / 1024).toFixed(0)} MB]`,
        originalSize: bundleSize,
        normalizedSize: normaliseItemSize(bundleSize, unitBytes),
        value: bundleWeightedVal,
        isPinned: smallFiles.some((f) => f.isPinned),
        isExcluded: false
      });
    }
    return {
      items: items2,
      strategyAppliedNote: `Cap active: Consolidated ${smallFiles.length} files under 5 MB into a single bundle item.`
    };
  }
  const items = activeFiles.slice(0, 500).map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    originalSize: f.size,
    normalizedSize: normaliseItemSize(f.size, unitBytes),
    value: f.priority,
    category: f.category,
    isPinned: f.isPinned,
    isExcluded: f.isExcluded
  }));
  return { items };
}

// src/engine/greedy.ts
function solveGreedy(items, options) {
  const { quotaUnits: W } = options;
  const active = items.filter((item) => !item.isExcluded);
  const pinned = active.filter((i) => i.isPinned);
  const regular = active.filter((i) => !i.isPinned);
  let currentQuota = W;
  let totalValue = 0;
  let totalSizeKept = 0;
  const kept = [];
  const dropped = [];
  const steps = [];
  for (const item of pinned) {
    if (item.normalizedSize <= currentQuota) {
      kept.push(item);
      currentQuota -= item.normalizedSize;
      totalValue += item.value;
      totalSizeKept += item.originalSize;
      steps.push({
        item,
        ratio: item.value / Math.max(1, item.normalizedSize),
        fits: true,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Pinned item "${item.name}" was forcibly included first.`
      });
    } else {
      dropped.push(item);
      steps.push({
        item,
        ratio: item.value / Math.max(1, item.normalizedSize),
        fits: false,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Pinned item "${item.name}" exceeds remaining quota.`
      });
    }
  }
  const sorted = [...regular].sort((a, b) => {
    const ratioA = a.value / Math.max(1, a.normalizedSize);
    const ratioB = b.value / Math.max(1, b.normalizedSize);
    if (Math.abs(ratioA - ratioB) > 1e-9) {
      return ratioB - ratioA;
    }
    if (a.value !== b.value) {
      return b.value - a.value;
    }
    return a.normalizedSize - b.normalizedSize;
  });
  for (const item of sorted) {
    const ratio = item.value / Math.max(1, item.normalizedSize);
    if (item.normalizedSize <= currentQuota) {
      kept.push(item);
      currentQuota -= item.normalizedSize;
      totalValue += item.value;
      totalSizeKept += item.originalSize;
      steps.push({
        item,
        ratio,
        fits: true,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Density ${ratio.toFixed(2)} pts/unit. Fits in remaining capacity (${currentQuota + item.normalizedSize} -> ${currentQuota}). Included.`
      });
    } else {
      dropped.push(item);
      steps.push({
        item,
        ratio,
        fits: false,
        cumulativeValue: totalValue,
        cumulativeSize: totalSizeKept,
        reason: `Density ${ratio.toFixed(2)} pts/unit. Needs ${item.normalizedSize} units, but only ${currentQuota} available. Dropped.`
      });
    }
  }
  return {
    keptItems: kept,
    droppedItems: dropped,
    totalValue,
    totalSizeKept,
    steps
  };
}
var GREEDY_COUNTEREXAMPLE_DATASET = {
  quota: 10,
  items: [
    {
      id: "counter-a",
      name: "System_VM_Snapshot.raw",
      originalSize: 6 * 1024 * 1024 * 1024,
      normalizedSize: 6,
      value: 30,
      category: "archive"
    },
    {
      id: "counter-b",
      name: "Client_Project_Assets.tar",
      originalSize: 5 * 1024 * 1024 * 1024,
      normalizedSize: 5,
      value: 24,
      category: "document"
    },
    {
      id: "counter-c",
      name: "Financial_Records_2025.sql",
      originalSize: 5 * 1024 * 1024 * 1024,
      normalizedSize: 5,
      value: 24,
      category: "database"
    }
  ]
};

// src/engine/knapsack.ts
function solveFullKnapsack(items, options) {
  const startTime = performance.now();
  const { quotaUnits: W, quotaBytes, unitBytes } = options;
  const activeCandidates = items.filter((item) => !item.isExcluded);
  const pinnedItems = [];
  const regularItems = [];
  let pinnedUnits = 0;
  let pinnedValue = 0;
  let pinnedBytes = 0;
  for (const item of activeCandidates) {
    if (item.isPinned) {
      pinnedItems.push(item);
      pinnedUnits += item.normalizedSize;
      pinnedValue += item.value;
      pinnedBytes += item.originalSize;
    } else {
      regularItems.push(item);
    }
  }
  const maxPossibleValue = activeCandidates.reduce((acc, it) => acc + it.value, 0);
  if (pinnedUnits > W) {
    const errorMsg = `Pinned files (${pinnedUnits} units / ${(pinnedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB) exceed the selected quota (${W} units). Please unpin some files or increase quota.`;
    return {
      keptItems: pinnedItems,
      droppedItems: regularItems,
      totalValue: pinnedValue,
      maxPossibleValue,
      totalSizeKept: pinnedBytes,
      totalSizeDropped: regularItems.reduce((acc, it) => acc + it.originalSize, 0),
      normalizedSizeKept: pinnedUnits,
      quotaUnits: W,
      quotaBytes,
      unitBytes,
      quotaCurve: [],
      cellsComputed: 0,
      executionTimeMs: performance.now() - startTime,
      error: errorMsg
    };
  }
  const remainingQuota = W - pinnedUnits;
  const n = regularItems.length;
  if (n === 0 || remainingQuota <= 0) {
    const kept = [...pinnedItems];
    const dropped = [...regularItems];
    const totalBytesKept = kept.reduce((a, b) => a + b.originalSize, 0);
    const totalBytesDropped = dropped.reduce((a, b) => a + b.originalSize, 0);
    return {
      keptItems: kept,
      droppedItems: dropped,
      totalValue: pinnedValue,
      maxPossibleValue,
      totalSizeKept: totalBytesKept,
      totalSizeDropped: totalBytesDropped,
      normalizedSizeKept: pinnedUnits,
      quotaUnits: W,
      quotaBytes,
      unitBytes,
      quotaCurve: [{ quotaUnits: W, quotaBytes, totalValue: pinnedValue }],
      cellsComputed: 0,
      executionTimeMs: performance.now() - startTime
    };
  }
  const cols = remainingQuota + 1;
  const totalBits = n * cols;
  const decisionBytes = Math.ceil(totalBits / 8);
  const decisions = new Uint8Array(decisionBytes);
  const setDecision = (itemIdx, w, taken) => {
    if (!taken) return;
    const bitPos = itemIdx * cols + w;
    const byteIdx = bitPos >> 3;
    const bitOffset = bitPos & 7;
    decisions[byteIdx] |= 1 << bitOffset;
  };
  const getDecision = (itemIdx, w) => {
    const bitPos = itemIdx * cols + w;
    const byteIdx = bitPos >> 3;
    const bitOffset = bitPos & 7;
    return (decisions[byteIdx] & 1 << bitOffset) !== 0;
  };
  let prevRow = new Float64Array(cols);
  let currRow = new Float64Array(cols);
  let prevCount = new Uint16Array(cols);
  let currCount = new Uint16Array(cols);
  let cellsComputed = 0;
  for (let i = 0; i < n; i++) {
    const item = regularItems[i];
    const itemSize = item.normalizedSize;
    const itemVal = item.value;
    for (let w = 0; w <= remainingQuota; w++) {
      cellsComputed++;
      const skipVal = prevRow[w];
      const skipCount = prevCount[w];
      if (itemSize > w) {
        currRow[w] = skipVal;
        currCount[w] = skipCount;
        setDecision(i, w, false);
      } else {
        const takeVal = itemVal + prevRow[w - itemSize];
        const takeCount = 1 + prevCount[w - itemSize];
        if (takeVal > skipVal) {
          currRow[w] = takeVal;
          currCount[w] = takeCount;
          setDecision(i, w, true);
        } else if (takeVal < skipVal) {
          currRow[w] = skipVal;
          currCount[w] = skipCount;
          setDecision(i, w, false);
        } else {
          if (takeCount < skipCount) {
            currRow[w] = takeVal;
            currCount[w] = takeCount;
            setDecision(i, w, true);
          } else {
            currRow[w] = skipVal;
            currCount[w] = skipCount;
            setDecision(i, w, false);
          }
        }
      }
    }
    prevRow.set(currRow);
    prevCount.set(currCount);
  }
  const keptRegular = [];
  const droppedRegular = [];
  let curW = remainingQuota;
  for (let i = n - 1; i >= 0; i--) {
    const taken = getDecision(i, curW);
    const item = regularItems[i];
    if (taken) {
      keptRegular.push(item);
      curW -= item.normalizedSize;
    } else {
      droppedRegular.push(item);
    }
  }
  keptRegular.reverse();
  droppedRegular.reverse();
  const keptItems = [...pinnedItems, ...keptRegular];
  const droppedItems = [...droppedRegular];
  const totalValue = keptItems.reduce((acc, it) => acc + it.value, 0);
  const totalSizeKept = keptItems.reduce((acc, it) => acc + it.originalSize, 0);
  const totalSizeDropped = droppedItems.reduce((acc, it) => acc + it.originalSize, 0);
  const normalizedSizeKept = keptItems.reduce((acc, it) => acc + it.normalizedSize, 0);
  const quotaCurve = [];
  const step = Math.max(1, Math.floor(remainingQuota / 100));
  for (let w = 0; w <= remainingQuota; w += step) {
    const actualUnits = pinnedUnits + w;
    quotaCurve.push({
      quotaUnits: actualUnits,
      quotaBytes: actualUnits * unitBytes,
      totalValue: Math.round(pinnedValue + prevRow[w])
    });
  }
  if (quotaCurve.length === 0 || quotaCurve[quotaCurve.length - 1].quotaUnits !== W) {
    quotaCurve.push({
      quotaUnits: W,
      quotaBytes: W * unitBytes,
      totalValue: Math.round(pinnedValue + prevRow[remainingQuota])
    });
  }
  const greedy = solveGreedy(items, options);
  return {
    keptItems,
    droppedItems,
    totalValue,
    maxPossibleValue,
    totalSizeKept,
    totalSizeDropped,
    normalizedSizeKept,
    quotaUnits: W,
    quotaBytes,
    unitBytes,
    quotaCurve,
    cellsComputed,
    executionTimeMs: performance.now() - startTime,
    greedyResult: {
      keptItems: greedy.keptItems,
      droppedItems: greedy.droppedItems,
      totalValue: greedy.totalValue,
      totalSizeKept: greedy.totalSizeKept
    }
  };
}

// src/workers/solverClient.ts
var import_meta = {};
var workerInstance = null;
var currentRequestId = 0;
var pendingResolvers = /* @__PURE__ */ new Map();
function getWorker() {
  if (typeof window === "undefined") return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL("./solver.worker.ts", import_meta.url), {
        type: "module"
      });
      workerInstance.onmessage = (e) => {
        const { id, result } = e.data;
        const resolver = pendingResolvers.get(id);
        if (resolver) {
          resolver(result);
          pendingResolvers.delete(id);
        }
      };
      workerInstance.onerror = (err) => {
        console.error("Worker error:", err);
      };
    } catch (err) {
      console.warn("Worker creation failed, falling back to main thread solver:", err);
      workerInstance = null;
    }
  }
  return workerInstance;
}
function runFullKnapsackAsync(items, options) {
  const worker = getWorker();
  if (!worker) {
    return Promise.resolve(solveFullKnapsack(items, options));
  }
  const id = ++currentRequestId;
  return new Promise((resolve) => {
    pendingResolvers.set(id, resolve);
    const req = { id, items, options };
    worker.postMessage(req);
  });
}

// node_modules/idb/build/index.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(this.request);
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));
var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
var methodMap = {};
var advanceResults = /* @__PURE__ */ new WeakMap();
var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
var cursorIteratorTraps = {
  get(target, prop) {
    if (!advanceMethodProps.includes(prop))
      return target[prop];
    let cachedFunc = methodMap[prop];
    if (!cachedFunc) {
      cachedFunc = methodMap[prop] = function(...args) {
        advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
      };
    }
    return cachedFunc;
  }
};
async function* iterate(...args) {
  let cursor = this;
  if (!(cursor instanceof IDBCursor)) {
    cursor = await cursor.openCursor(...args);
  }
  if (!cursor)
    return;
  cursor = cursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));
  while (cursor) {
    yield proxiedCursor;
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}
function isIteratorProp(target, prop) {
  return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop, receiver) {
    if (isIteratorProp(target, prop))
      return iterate;
    return oldTraps.get(target, prop, receiver);
  },
  has(target, prop) {
    return isIteratorProp(target, prop) || oldTraps.has(target, prop);
  }
}));

// src/engine/storageDb.ts
var DB_NAME = "vaultline_db";
var DB_VERSION = 1;
var dbPromise = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("scenarios")) {
          const scenarioStore = db.createObjectStore("scenarios", { keyPath: "id" });
          scenarioStore.createIndex("by-timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("currentSession")) {
          db.createObjectStore("currentSession");
        }
      }
    });
  }
  return dbPromise;
}
async function saveAutoSession(state) {
  try {
    const db = await getDb();
    await db.put("currentSession", state, "latest");
  } catch (err) {
  }
}

// src/engine/profiles.ts
var IMPORTANCE_PROFILES = {
  balanced: {
    id: "balanced",
    name: "Balanced",
    description: "Values documents and photos highest, keeps a fair balance across other formats.",
    categoryScores: {
      document: 9,
      // Important
      photo: 8,
      // Important
      video: 5,
      // Normal
      audio: 5,
      // Normal
      code: 7,
      // Normal
      archive: 5,
      // Normal
      database: 9,
      // Important
      log_temp: 2,
      // Can go
      other: 5
      // Normal
    }
  },
  work_first: {
    id: "work_first",
    name: "Work first",
    description: "Prioritizes work assets, spreadsheets, databases and business docs over leisure media.",
    categoryScores: {
      document: 9,
      database: 10,
      code: 8,
      archive: 6,
      photo: 5,
      video: 3,
      audio: 2,
      log_temp: 1,
      other: 4
    }
  },
  student: {
    id: "student",
    name: "Student",
    description: "Protects assignments, lecture PDFs, project code and notes while deprioritizing large recordings.",
    categoryScores: {
      document: 10,
      code: 9,
      photo: 6,
      archive: 5,
      database: 7,
      video: 3,
      audio: 4,
      log_temp: 1,
      other: 4
    }
  },
  photos_first: {
    id: "photos_first",
    name: "Photos and memories first",
    description: "Puts personal memories, photo libraries, and camera RAWs above temporary files and software.",
    categoryScores: {
      photo: 10,
      video: 8,
      document: 6,
      audio: 5,
      archive: 4,
      code: 3,
      database: 4,
      log_temp: 1,
      other: 3
    }
  },
  videos_first: {
    id: "videos_first",
    name: "Videos first",
    description: "Maximizes retention of movie clips, tutorials and high-res video captures.",
    categoryScores: {
      video: 10,
      audio: 7,
      photo: 7,
      document: 5,
      archive: 4,
      code: 4,
      database: 5,
      log_temp: 1,
      other: 3
    }
  },
  free_space: {
    id: "free_space",
    name: "Free up the most space",
    description: "Favors compact, high-value files and marks heavy media for relocation to archive.",
    categoryScores: {
      document: 9,
      code: 9,
      database: 8,
      archive: 5,
      photo: 4,
      audio: 3,
      video: 2,
      log_temp: 1,
      other: 3
    }
  }
};
function calculateFileImportance(file, profileId, toggles, now = Date.now()) {
  const profile = IMPORTANCE_PROFILES[profileId] || IMPORTANCE_PROFILES.balanced;
  let score = profile.categoryScores[file.category] ?? 5;
  if (toggles.documentsMatterMore && (file.category === "document" || file.category === "code")) {
    score += 2;
  }
  if (toggles.newerFilesMatterMore) {
    const ageDays = (now - file.lastModified) / (1e3 * 60 * 60 * 24);
    if (ageDays <= 30) {
      score += 2;
    } else if (ageDays <= 90) {
      score += 1;
    } else if (ageDays > 365) {
      score -= 1;
    }
  }
  if (toggles.rareBigFilesMatterLess) {
    const ageDays = (now - file.lastModified) / (1e3 * 60 * 60 * 24);
    if (file.size > 500 * 1024 * 1024 && ageDays > 180) {
      score -= 3;
    }
  }
  return Math.max(1, Math.min(10, score));
}
function applyProfileToFiles(files, profileId, toggles, overrideEdited = false) {
  const now = Date.now();
  return files.map((file) => {
    if (file.prioritySource === "edited" && !overrideEdited) {
      return file;
    }
    const newPriority = calculateFileImportance(file, profileId, toggles, now);
    return {
      ...file,
      priority: newPriority,
      prioritySource: "auto"
    };
  });
}

// src/store/useAppStore.ts
var initialFiles = markDuplicates(STUDENT_LAPTOP_DATASET);
var initialQuota = 15 * BYTE_UNITS.GB;
var computeTimer = null;
var useAppStore = create((set, get) => ({
  theme: "light",
  isPresentMode: false,
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", nextTheme);
      }
      return { theme: nextTheme };
    });
  },
  togglePresentMode: () => {
    set((state) => ({ isPresentMode: !state.isPresentMode }));
  },
  complexityMode: "simple",
  setComplexityMode: (complexityMode) => set({ complexityMode }),
  isSidebarCollapsed: localStorage.getItem("vaultline_sidebar_collapsed") === "true" || typeof window !== "undefined" && window.innerWidth < 1100,
  isMobileDrawerOpen: false,
  toggleSidebar: () => set((state) => {
    const next = !state.isSidebarCollapsed;
    localStorage.setItem("vaultline_sidebar_collapsed", String(next));
    return { isSidebarCollapsed: next };
  }),
  setMobileDrawerOpen: (isOpen) => set({ isMobileDrawerOpen: isOpen }),
  files: initialFiles,
  isScanning: false,
  scanProgress: null,
  folderMode: false,
  capStrategy: "largest_500",
  searchQuery: "",
  categoryFilter: "all",
  sortBy: "size",
  sortOrder: "desc",
  quotaBytes: initialQuota,
  quotaUnitOption: "auto",
  priorityRules: DEFAULT_PRIORITY_RULES,
  places: [
    { id: "p1", name: "Primary Storage", quotaBytes: initialQuota, color: "var(--color-primary)" }
  ],
  profileId: "balanced",
  profileToggles: {
    newerFilesMatterMore: false,
    rareBigFilesMatterLess: false,
    documentsMatterMore: false
  },
  packingMode: "auto",
  manualKeptIds: [],
  savedPlanA: null,
  isComputing: false,
  computeProgress: null,
  knapsackResult: null,
  lastComputeError: null,
  isPlanStale: false,
  autoRunOptimizer: true,
  setAutoRunOptimizer: (auto) => set({ autoRunOptimizer: auto }),
  cancelCompute: () => {
    if (computeTimer) clearTimeout(computeTimer);
    set({ isComputing: false, computeProgress: null });
  },
  markPlanStale: () => {
    set({ isPlanStale: true });
    const { autoRunOptimizer, files } = get();
    if (autoRunOptimizer && files.length <= 2e3) {
      get().triggerRecompute();
    }
  },
  setFiles: (files) => {
    set({ files: markDuplicates(files) });
    get().markPlanStale();
  },
  addFiles: (newFiles) => {
    set((state) => {
      const combined = [...state.files, ...newFiles];
      return { files: markDuplicates(combined) };
    });
    get().markPlanStale();
  },
  removeFile: (id) => {
    set((state) => {
      const next = state.files.filter((f) => f.id !== id);
      return { files: markDuplicates(next) };
    });
    get().markPlanStale();
  },
  clearFiles: () => {
    set({ files: [], knapsackResult: null, manualKeptIds: [] });
  },
  togglePin: (id) => {
    set((state) => ({
      files: state.files.map(
        (f) => f.id === id ? { ...f, isPinned: !f.isPinned, isExcluded: f.isPinned ? f.isExcluded : false } : f
      )
    }));
    get().markPlanStale();
  },
  toggleExclude: (id) => {
    set((state) => ({
      files: state.files.map(
        (f) => f.id === id ? { ...f, isExcluded: !f.isExcluded, isPinned: f.isExcluded ? f.isPinned : false } : f
      )
    }));
    get().markPlanStale();
  },
  setFilePlacement: (id, placement) => {
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        if (placement === "always_keep") {
          return { ...f, isPinned: true, isExcluded: false };
        } else if (placement === "never_keep") {
          return { ...f, isPinned: false, isExcluded: true };
        } else {
          return { ...f, isPinned: false, isExcluded: false };
        }
      })
    }));
    get().markPlanStale();
  },
  setFileImportanceTier: (id, tier) => {
    const priority = tier === "important" ? 9 : tier === "normal" ? 5 : 2;
    set((state) => ({
      files: state.files.map(
        (f) => f.id === id ? { ...f, priority, prioritySource: "edited" } : f
      )
    }));
    get().markPlanStale();
  },
  bulkSetPlacement: (ids, placement) => {
    const idSet = new Set(ids);
    set((state) => ({
      files: state.files.map((f) => {
        if (!idSet.has(f.id)) return f;
        if (placement === "always_keep") {
          return { ...f, isPinned: true, isExcluded: false };
        } else if (placement === "never_keep") {
          return { ...f, isPinned: false, isExcluded: true };
        } else {
          return { ...f, isPinned: false, isExcluded: false };
        }
      })
    }));
    get().markPlanStale();
  },
  bulkSetImportance: (ids, priority) => {
    const idSet = new Set(ids);
    set((state) => ({
      files: state.files.map(
        (f) => idSet.has(f.id) ? { ...f, priority, prioritySource: "edited" } : f
      )
    }));
    get().markPlanStale();
  },
  updatePriority: (id, priority) => {
    set((state) => ({
      files: state.files.map(
        (f) => f.id === id ? { ...f, priority, prioritySource: "edited" } : f
      )
    }));
    get().markPlanStale();
  },
  resetPrioritySuggestion: (id, priority) => {
    set((state) => ({ files: state.files.map((f) => f.id === id ? { ...f, priority, prioritySource: "auto" } : f) }));
    get().markPlanStale();
  },
  loadPreset: (type) => {
    let dataset = STUDENT_LAPTOP_DATASET;
    let defaultQuota = 15 * BYTE_UNITS.GB;
    let prof = "student";
    if (type === "photographer") {
      dataset = PHOTOGRAPHER_DATASET;
      defaultQuota = 64 * BYTE_UNITS.GB;
      prof = "photos_first";
    } else if (type === "company") {
      dataset = COMPANY_SERVER_DATASET;
      defaultQuota = 128 * BYTE_UNITS.GB;
      prof = "work_first";
    }
    set({
      files: markDuplicates(dataset),
      quotaBytes: defaultQuota,
      profileId: prof,
      places: [{ id: "p1", name: "Primary Storage", quotaBytes: defaultQuota, color: "var(--color-primary)" }],
      searchQuery: "",
      categoryFilter: "all",
      manualKeptIds: []
    });
    get().markPlanStale();
  },
  deduplicateKeepOneAction: () => {
    set((state) => ({
      files: resolveDuplicatesKeepOne(state.files)
    }));
    get().markPlanStale();
  },
  setFolderMode: (enabled) => {
    set({ folderMode: enabled });
    get().markPlanStale();
  },
  setCapStrategy: (strategy) => {
    set({ capStrategy: strategy });
    get().markPlanStale();
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSort: (sortBy, order) => {
    set((state) => ({
      sortBy,
      sortOrder: order ?? (state.sortBy === sortBy ? state.sortOrder === "asc" ? "desc" : "asc" : "desc")
    }));
  },
  setQuotaBytes: (quotaBytes) => {
    set((state) => ({
      quotaBytes,
      places: state.places.map((p, idx) => idx === 0 ? { ...p, quotaBytes } : p)
    }));
    get().markPlanStale();
  },
  setRoundingUnitOption: (quotaUnitOption) => {
    set({ quotaUnitOption });
    get().markPlanStale();
  },
  setPriorityRules: (priorityRules) => {
    set({ priorityRules });
    get().recalculatePrioritiesAction();
  },
  setProfile: (profileId) => {
    set((state) => {
      const updatedFiles = applyProfileToFiles(state.files, profileId, state.profileToggles, false);
      return { profileId, files: updatedFiles };
    });
    get().markPlanStale();
  },
  setProfileToggle: (key, value) => {
    set((state) => {
      const nextToggles = { ...state.profileToggles, [key]: value };
      const updatedFiles = applyProfileToFiles(state.files, state.profileId, nextToggles, false);
      return { profileToggles: nextToggles, files: updatedFiles };
    });
    get().markPlanStale();
  },
  setPackingMode: (packingMode) => {
    set((state) => {
      if (packingMode === "manual" && state.manualKeptIds.length === 0 && state.knapsackResult) {
        return {
          packingMode,
          manualKeptIds: state.knapsackResult.keptItems.map((i) => i.id)
        };
      }
      return { packingMode };
    });
  },
  toggleManualKept: (id) => {
    set((state) => {
      const file = state.files.find((f) => f.id === id);
      if (file?.isPinned) {
        return state;
      }
      const isAlreadyKept = state.manualKeptIds.includes(id);
      const next = isAlreadyKept ? state.manualKeptIds.filter((kId) => kId !== id) : [...state.manualKeptIds, id];
      return { manualKeptIds: next };
    });
  },
  saveCurrentAsPlanA: () => {
    const state = get();
    if (!state.knapsackResult) return;
    set({
      savedPlanA: {
        name: "Plan A",
        quotaBytes: state.quotaBytes,
        keptIds: state.knapsackResult.keptItems.map((i) => i.id),
        totalValue: state.knapsackResult.totalValue,
        totalSize: state.knapsackResult.totalSizeKept,
        savedAt: Date.now()
      }
    });
  },
  clearPlanA: () => set({ savedPlanA: null }),
  addPlace: (place) => {
    set((state) => ({ places: [...state.places, place] }));
  },
  removePlace: (id) => {
    set((state) => ({ places: state.places.filter((p) => p.id !== id) }));
  },
  updatePlace: (id, updates) => {
    set((state) => ({
      places: state.places.map((p) => p.id === id ? { ...p, ...updates } : p)
    }));
  },
  recalculatePrioritiesAction: () => {
    set((state) => ({
      files: recalculateFilePriorities(state.files, state.priorityRules, false)
    }));
    get().markPlanStale();
  },
  setIsScanning: (isScanning, scanProgress = null) => {
    set({ isScanning, scanProgress });
  },
  triggerRecompute: async () => {
    if (computeTimer) {
      clearTimeout(computeTimer);
    }
    computeTimer = setTimeout(async () => {
      const state = get();
      const { files, quotaBytes, quotaUnitOption, folderMode, capStrategy } = state;
      if (files.length === 0 || quotaBytes <= 0) {
        set({ knapsackResult: null, isComputing: false });
        return;
      }
      set({
        isComputing: true,
        lastComputeError: null,
        computeProgress: { stage: "Preparing files", percent: 5, cellsComputed: 0 }
      });
      const unitBytes = resolveUnitBytes(quotaBytes, quotaUnitOption);
      const quotaUnits = normaliseQuota(quotaBytes, unitBytes);
      let itemsToSolve = [];
      if (folderMode) {
        const folders = aggregateFolders(files);
        itemsToSolve = folders.map((folder) => ({
          id: folder.id,
          name: `${folder.name} (${folder.fileCount} files)`,
          path: folder.path,
          originalSize: folder.size,
          normalizedSize: normaliseItemSize(folder.size, unitBytes),
          value: folder.priority,
          category: "other",
          isPinned: folder.isPinned,
          isExcluded: folder.isExcluded
        }));
      } else {
        const { items } = applyCapStrategy(files, capStrategy, unitBytes);
        itemsToSolve = items;
      }
      try {
        set({ computeProgress: { stage: "Rounding sizes", percent: 15, cellsComputed: 0 } });
        await new Promise((r) => setTimeout(r, 200));
        set({ computeProgress: { stage: "Building the table", percent: 40, cellsComputed: 0 } });
        const result = await runFullKnapsackAsync(itemsToSolve, {
          quotaUnits,
          quotaBytes,
          unitBytes
        });
        set({ computeProgress: { stage: "Tracing back", percent: 85, cellsComputed: result.cellsComputed, totalCells: itemsToSolve.length * quotaUnits } });
        await new Promise((r) => setTimeout(r, 300));
        set({ computeProgress: { stage: "Done", percent: 100, cellsComputed: result.cellsComputed, totalCells: itemsToSolve.length * quotaUnits } });
        await new Promise((r) => setTimeout(r, 200));
        if (!get().isComputing) return;
        set({
          knapsackResult: result,
          isComputing: false,
          computeProgress: null,
          isPlanStale: false,
          lastComputeError: result.error || null
        });
        saveAutoSession({
          quotaBytes,
          quotaUnitOption,
          folderMode,
          filesCount: files.length,
          savedAt: Date.now()
        });
      } catch (err) {
        console.error("Computation failed:", err);
        set({
          isComputing: false,
          lastComputeError: err.message || "Unknown algorithm error"
        });
      }
    }, 120);
  }
}));

// test.ts
globalThis.localStorage = { getItem: () => null, setItem: () => null, removeItem: () => null };
globalThis.sessionStorage = { getItem: () => null, setItem: () => null, removeItem: () => null };
console.log(useAppStore.getState().files.map((f) => f.id + " " + f.name + " " + f.size));
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
