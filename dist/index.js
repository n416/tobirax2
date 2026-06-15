var __create = Object.create;
var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __template = (cooked, raw3) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw3 || cooked.slice()) }));

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    if (!("__unenv__" in performance)) {
      const proto = Performance.prototype;
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== "constructor" && !(key in performance)) {
          const desc = Object.getOwnPropertyDescriptor(proto, key);
          if (desc) {
            Object.defineProperty(performance, key, desc);
          }
        }
      }
    }
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// node-built-in-modules:crypto
import libDefault from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault;
  }
});

// node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return require_crypto()["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick2(function() {
            try {
              callback2(null, bcrypt.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt.compareSync = function(s, hash2) {
        if (typeof s !== "string" || typeof hash2 !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash2);
        if (hash2.length !== 60)
          return false;
        return safeStringCompare(bcrypt.hashSync(s, hash2.substr(0, hash2.length - 31)), hash2);
      };
      bcrypt.compare = function(s, hash2, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash2 !== "string") {
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash2)));
            return;
          }
          if (hash2.length !== 60) {
            nextTick2(callback2.bind(this, null, false));
            return;
          }
          bcrypt.hash(s, hash2.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash2));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.getRounds = function(hash2) {
        if (typeof hash2 !== "string")
          throw Error("Illegal arguments: " + typeof hash2);
        return parseInt(hash2.split("$")[2], 10);
      };
      bcrypt.getSalt = function(hash2) {
        if (typeof hash2 !== "string")
          throw Error("Illegal arguments: " + typeof hash2);
        if (hash2.length !== 60)
          throw Error("Illegal hash length: " + hash2.length + " != 60");
        return hash2.substring(0, 29);
      };
      var nextTick2 = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off2 = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off2 < len) {
          c1 = b[off2++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off2 < slen - 1 && olen < len) {
          code = s.charCodeAt(off2++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off2++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off2 = 0; off2 < olen; off2++)
          res.push(rs[off2].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off2, P, S) {
        var n, l = lr[off2], r = lr[off2 + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off2] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off2 + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick2(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick2(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt.encodeBase64 = base64_encode;
      bcrypt.decodeBase64 = base64_decode;
      return bcrypt;
    });
  }
});

// node_modules/@otplib/plugin-crypto/index.js
var require_plugin_crypto = __commonJS({
  "node_modules/@otplib/plugin-crypto/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    __name(_interopDefault, "_interopDefault");
    var crypto2 = _interopDefault(require_crypto());
    var createDigest = /* @__PURE__ */ __name((algorithm, hmacKey, counter) => {
      const hmac = crypto2.createHmac(algorithm, Buffer.from(hmacKey, "hex"));
      const digest = hmac.update(Buffer.from(counter, "hex")).digest();
      return digest.toString("hex");
    }, "createDigest");
    var createRandomBytes = /* @__PURE__ */ __name((size, encoding) => {
      return crypto2.randomBytes(size).toString(encoding);
    }, "createRandomBytes");
    exports.createDigest = createDigest;
    exports.createRandomBytes = createRandomBytes;
  }
});

// node_modules/thirty-two/lib/thirty-two/thirty-two.js
var require_thirty_two = __commonJS({
  "node_modules/thirty-two/lib/thirty-two/thirty-two.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var charTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var byteTable = [
      255,
      255,
      26,
      27,
      28,
      29,
      30,
      31,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      255,
      255,
      255,
      255,
      255,
      255,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      255,
      255,
      255,
      255,
      255
    ];
    function quintetCount(buff) {
      var quintets = Math.floor(buff.length / 5);
      return buff.length % 5 === 0 ? quintets : quintets + 1;
    }
    __name(quintetCount, "quintetCount");
    exports.encode = function(plain) {
      if (!Buffer.isBuffer(plain)) {
        plain = new Buffer(plain);
      }
      var i = 0;
      var j = 0;
      var shiftIndex = 0;
      var digit = 0;
      var encoded = new Buffer(quintetCount(plain) * 8);
      while (i < plain.length) {
        var current = plain[i];
        if (shiftIndex > 3) {
          digit = current & 255 >> shiftIndex;
          shiftIndex = (shiftIndex + 5) % 8;
          digit = digit << shiftIndex | (i + 1 < plain.length ? plain[i + 1] : 0) >> 8 - shiftIndex;
          i++;
        } else {
          digit = current >> 8 - (shiftIndex + 5) & 31;
          shiftIndex = (shiftIndex + 5) % 8;
          if (shiftIndex === 0) i++;
        }
        encoded[j] = charTable.charCodeAt(digit);
        j++;
      }
      for (i = j; i < encoded.length; i++) {
        encoded[i] = 61;
      }
      return encoded;
    };
    exports.decode = function(encoded) {
      var shiftIndex = 0;
      var plainDigit = 0;
      var plainChar;
      var plainPos = 0;
      if (!Buffer.isBuffer(encoded)) {
        encoded = new Buffer(encoded);
      }
      var decoded = new Buffer(Math.ceil(encoded.length * 5 / 8));
      for (var i = 0; i < encoded.length; i++) {
        if (encoded[i] === 61) {
          break;
        }
        var encodedByte = encoded[i] - 48;
        if (encodedByte < byteTable.length) {
          plainDigit = byteTable[encodedByte];
          if (shiftIndex <= 3) {
            shiftIndex = (shiftIndex + 5) % 8;
            if (shiftIndex === 0) {
              plainChar |= plainDigit;
              decoded[plainPos] = plainChar;
              plainPos++;
              plainChar = 0;
            } else {
              plainChar |= 255 & plainDigit << 8 - shiftIndex;
            }
          } else {
            shiftIndex = (shiftIndex + 5) % 8;
            plainChar |= 255 & plainDigit >>> shiftIndex;
            decoded[plainPos] = plainChar;
            plainPos++;
            plainChar = 255 & plainDigit << 8 - shiftIndex;
          }
        } else {
          throw new Error("Invalid input - it is not base32 encoded string");
        }
      }
      return decoded.slice(0, plainPos);
    };
  }
});

// node_modules/thirty-two/lib/thirty-two/index.js
var require_thirty_two2 = __commonJS({
  "node_modules/thirty-two/lib/thirty-two/index.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var base32 = require_thirty_two();
    exports.encode = base32.encode;
    exports.decode = base32.decode;
  }
});

// node_modules/@otplib/plugin-thirty-two/index.js
var require_plugin_thirty_two = __commonJS({
  "node_modules/@otplib/plugin-thirty-two/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    __name(_interopDefault, "_interopDefault");
    var thirtyTwo = _interopDefault(require_thirty_two2());
    var keyDecoder = /* @__PURE__ */ __name((encodedSecret, encoding) => {
      return thirtyTwo.decode(encodedSecret).toString(encoding);
    }, "keyDecoder");
    var keyEncoder = /* @__PURE__ */ __name((secret, encoding) => {
      return thirtyTwo.encode(Buffer.from(secret, encoding).toString("ascii")).toString().replace(/=/g, "");
    }, "keyEncoder");
    exports.keyDecoder = keyDecoder;
    exports.keyEncoder = keyEncoder;
  }
});

// node_modules/@otplib/core/index.js
var require_core = __commonJS({
  "node_modules/@otplib/core/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    function objectValues(value) {
      return Object.keys(value).map((key) => value[key]);
    }
    __name(objectValues, "objectValues");
    (function(HashAlgorithms) {
      HashAlgorithms["SHA1"] = "sha1";
      HashAlgorithms["SHA256"] = "sha256";
      HashAlgorithms["SHA512"] = "sha512";
    })(exports.HashAlgorithms || (exports.HashAlgorithms = {}));
    var HASH_ALGORITHMS = objectValues(exports.HashAlgorithms);
    (function(KeyEncodings) {
      KeyEncodings["ASCII"] = "ascii";
      KeyEncodings["BASE64"] = "base64";
      KeyEncodings["HEX"] = "hex";
      KeyEncodings["LATIN1"] = "latin1";
      KeyEncodings["UTF8"] = "utf8";
    })(exports.KeyEncodings || (exports.KeyEncodings = {}));
    var KEY_ENCODINGS = objectValues(exports.KeyEncodings);
    (function(Strategy) {
      Strategy["HOTP"] = "hotp";
      Strategy["TOTP"] = "totp";
    })(exports.Strategy || (exports.Strategy = {}));
    var STRATEGY = objectValues(exports.Strategy);
    var createDigestPlaceholder = /* @__PURE__ */ __name(() => {
      throw new Error("Please provide an options.createDigest implementation.");
    }, "createDigestPlaceholder");
    function isTokenValid(value) {
      return /^(\d+)$/.test(value);
    }
    __name(isTokenValid, "isTokenValid");
    function padStart(value, maxLength, fillString) {
      if (value.length >= maxLength) {
        return value;
      }
      const padding = Array(maxLength + 1).join(fillString);
      return `${padding}${value}`.slice(-1 * maxLength);
    }
    __name(padStart, "padStart");
    function keyuri(options) {
      const tmpl = `otpauth://${options.type}/{labelPrefix}:{accountName}?secret={secret}{query}`;
      const params = [];
      if (STRATEGY.indexOf(options.type) < 0) {
        throw new Error(`Expecting options.type to be one of ${STRATEGY.join(", ")}. Received ${options.type}.`);
      }
      if (options.type === "hotp") {
        if (options.counter == null || typeof options.counter !== "number") {
          throw new Error('Expecting options.counter to be a number when options.type is "hotp".');
        }
        params.push(`&counter=${options.counter}`);
      }
      if (options.type === "totp" && options.step) {
        params.push(`&period=${options.step}`);
      }
      if (options.digits) {
        params.push(`&digits=${options.digits}`);
      }
      if (options.algorithm) {
        params.push(`&algorithm=${options.algorithm.toUpperCase()}`);
      }
      if (options.issuer) {
        params.push(`&issuer=${encodeURIComponent(options.issuer)}`);
      }
      return tmpl.replace("{labelPrefix}", encodeURIComponent(options.issuer || options.accountName)).replace("{accountName}", encodeURIComponent(options.accountName)).replace("{secret}", options.secret).replace("{query}", params.join(""));
    }
    __name(keyuri, "keyuri");
    var OTP = class _OTP {
      static {
        __name(this, "OTP");
      }
      constructor(defaultOptions = {}) {
        this._defaultOptions = Object.freeze({
          ...defaultOptions
        });
        this._options = Object.freeze({});
      }
      create(defaultOptions = {}) {
        return new _OTP(defaultOptions);
      }
      clone(defaultOptions = {}) {
        const instance = this.create({
          ...this._defaultOptions,
          ...defaultOptions
        });
        instance.options = this._options;
        return instance;
      }
      get options() {
        return Object.freeze({
          ...this._defaultOptions,
          ...this._options
        });
      }
      set options(options) {
        this._options = Object.freeze({
          ...this._options,
          ...options
        });
      }
      allOptions() {
        return this.options;
      }
      resetOptions() {
        this._options = Object.freeze({});
      }
    };
    function hotpOptionsValidator(options) {
      if (typeof options.createDigest !== "function") {
        throw new Error("Expecting options.createDigest to be a function.");
      }
      if (typeof options.createHmacKey !== "function") {
        throw new Error("Expecting options.createHmacKey to be a function.");
      }
      if (typeof options.digits !== "number") {
        throw new Error("Expecting options.digits to be a number.");
      }
      if (!options.algorithm || HASH_ALGORITHMS.indexOf(options.algorithm) < 0) {
        throw new Error(`Expecting options.algorithm to be one of ${HASH_ALGORITHMS.join(", ")}. Received ${options.algorithm}.`);
      }
      if (!options.encoding || KEY_ENCODINGS.indexOf(options.encoding) < 0) {
        throw new Error(`Expecting options.encoding to be one of ${KEY_ENCODINGS.join(", ")}. Received ${options.encoding}.`);
      }
    }
    __name(hotpOptionsValidator, "hotpOptionsValidator");
    var hotpCreateHmacKey = /* @__PURE__ */ __name((algorithm, secret, encoding) => {
      return Buffer.from(secret, encoding).toString("hex");
    }, "hotpCreateHmacKey");
    function hotpDefaultOptions() {
      const options = {
        algorithm: exports.HashAlgorithms.SHA1,
        createHmacKey: hotpCreateHmacKey,
        createDigest: createDigestPlaceholder,
        digits: 6,
        encoding: exports.KeyEncodings.ASCII
      };
      return options;
    }
    __name(hotpDefaultOptions, "hotpDefaultOptions");
    function hotpOptions(opt) {
      const options = {
        ...hotpDefaultOptions(),
        ...opt
      };
      hotpOptionsValidator(options);
      return Object.freeze(options);
    }
    __name(hotpOptions, "hotpOptions");
    function hotpCounter(counter) {
      const hexCounter = counter.toString(16);
      return padStart(hexCounter, 16, "0");
    }
    __name(hotpCounter, "hotpCounter");
    function hotpDigestToToken(hexDigest, digits) {
      const digest = Buffer.from(hexDigest, "hex");
      const offset = digest[digest.length - 1] & 15;
      const binary = (digest[offset] & 127) << 24 | (digest[offset + 1] & 255) << 16 | (digest[offset + 2] & 255) << 8 | digest[offset + 3] & 255;
      const token = binary % Math.pow(10, digits);
      return padStart(String(token), digits, "0");
    }
    __name(hotpDigestToToken, "hotpDigestToToken");
    function hotpDigest(secret, counter, options) {
      const hexCounter = hotpCounter(counter);
      const hmacKey = options.createHmacKey(options.algorithm, secret, options.encoding);
      return options.createDigest(options.algorithm, hmacKey, hexCounter);
    }
    __name(hotpDigest, "hotpDigest");
    function hotpToken(secret, counter, options) {
      const hexDigest = options.digest || hotpDigest(secret, counter, options);
      return hotpDigestToToken(hexDigest, options.digits);
    }
    __name(hotpToken, "hotpToken");
    function hotpCheck(token, secret, counter, options) {
      if (!isTokenValid(token)) {
        return false;
      }
      const systemToken = hotpToken(secret, counter, options);
      return token === systemToken;
    }
    __name(hotpCheck, "hotpCheck");
    function hotpKeyuri(accountName, issuer, secret, counter, options) {
      return keyuri({
        algorithm: options.algorithm,
        digits: options.digits,
        type: exports.Strategy.HOTP,
        accountName,
        counter,
        issuer,
        secret
      });
    }
    __name(hotpKeyuri, "hotpKeyuri");
    var HOTP = class _HOTP extends OTP {
      static {
        __name(this, "HOTP");
      }
      create(defaultOptions = {}) {
        return new _HOTP(defaultOptions);
      }
      allOptions() {
        return hotpOptions(this.options);
      }
      generate(secret, counter) {
        return hotpToken(secret, counter, this.allOptions());
      }
      check(token, secret, counter) {
        return hotpCheck(token, secret, counter, this.allOptions());
      }
      verify(opts) {
        if (typeof opts !== "object") {
          throw new Error("Expecting argument 0 of verify to be an object");
        }
        return this.check(opts.token, opts.secret, opts.counter);
      }
      keyuri(accountName, issuer, secret, counter) {
        return hotpKeyuri(accountName, issuer, secret, counter, this.allOptions());
      }
    };
    function parseWindowBounds(win) {
      if (typeof win === "number") {
        return [Math.abs(win), Math.abs(win)];
      }
      if (Array.isArray(win)) {
        const [past, future] = win;
        if (typeof past === "number" && typeof future === "number") {
          return [Math.abs(past), Math.abs(future)];
        }
      }
      throw new Error("Expecting options.window to be an number or [number, number].");
    }
    __name(parseWindowBounds, "parseWindowBounds");
    function totpOptionsValidator(options) {
      hotpOptionsValidator(options);
      parseWindowBounds(options.window);
      if (typeof options.epoch !== "number") {
        throw new Error("Expecting options.epoch to be a number.");
      }
      if (typeof options.step !== "number") {
        throw new Error("Expecting options.step to be a number.");
      }
    }
    __name(totpOptionsValidator, "totpOptionsValidator");
    var totpPadSecret = /* @__PURE__ */ __name((secret, encoding, minLength) => {
      const currentLength = secret.length;
      const hexSecret = Buffer.from(secret, encoding).toString("hex");
      if (currentLength < minLength) {
        const newSecret = new Array(minLength - currentLength + 1).join(hexSecret);
        return Buffer.from(newSecret, "hex").slice(0, minLength).toString("hex");
      }
      return hexSecret;
    }, "totpPadSecret");
    var totpCreateHmacKey = /* @__PURE__ */ __name((algorithm, secret, encoding) => {
      switch (algorithm) {
        case exports.HashAlgorithms.SHA1:
          return totpPadSecret(secret, encoding, 20);
        case exports.HashAlgorithms.SHA256:
          return totpPadSecret(secret, encoding, 32);
        case exports.HashAlgorithms.SHA512:
          return totpPadSecret(secret, encoding, 64);
        default:
          throw new Error(`Expecting algorithm to be one of ${HASH_ALGORITHMS.join(", ")}. Received ${algorithm}.`);
      }
    }, "totpCreateHmacKey");
    function totpDefaultOptions() {
      const options = {
        algorithm: exports.HashAlgorithms.SHA1,
        createDigest: createDigestPlaceholder,
        createHmacKey: totpCreateHmacKey,
        digits: 6,
        encoding: exports.KeyEncodings.ASCII,
        epoch: Date.now(),
        step: 30,
        window: 0
      };
      return options;
    }
    __name(totpDefaultOptions, "totpDefaultOptions");
    function totpOptions(opt) {
      const options = {
        ...totpDefaultOptions(),
        ...opt
      };
      totpOptionsValidator(options);
      return Object.freeze(options);
    }
    __name(totpOptions, "totpOptions");
    function totpCounter(epoch, step) {
      return Math.floor(epoch / step / 1e3);
    }
    __name(totpCounter, "totpCounter");
    function totpToken(secret, options) {
      const counter = totpCounter(options.epoch, options.step);
      return hotpToken(secret, counter, options);
    }
    __name(totpToken, "totpToken");
    function totpEpochsInWindow(epoch, direction, deltaPerEpoch, numOfEpoches) {
      const result = [];
      if (numOfEpoches === 0) {
        return result;
      }
      for (let i = 1; i <= numOfEpoches; i++) {
        const delta = direction * i * deltaPerEpoch;
        result.push(epoch + delta);
      }
      return result;
    }
    __name(totpEpochsInWindow, "totpEpochsInWindow");
    function totpEpochAvailable(epoch, step, win) {
      const bounds = parseWindowBounds(win);
      const delta = step * 1e3;
      return {
        current: epoch,
        past: totpEpochsInWindow(epoch, -1, delta, bounds[0]),
        future: totpEpochsInWindow(epoch, 1, delta, bounds[1])
      };
    }
    __name(totpEpochAvailable, "totpEpochAvailable");
    function totpCheck(token, secret, options) {
      if (!isTokenValid(token)) {
        return false;
      }
      const systemToken = totpToken(secret, options);
      return token === systemToken;
    }
    __name(totpCheck, "totpCheck");
    function totpCheckByEpoch(epochs, token, secret, options) {
      let position = null;
      epochs.some((epoch, idx) => {
        if (totpCheck(token, secret, {
          ...options,
          epoch
        })) {
          position = idx + 1;
          return true;
        }
        return false;
      });
      return position;
    }
    __name(totpCheckByEpoch, "totpCheckByEpoch");
    function totpCheckWithWindow(token, secret, options) {
      if (totpCheck(token, secret, options)) {
        return 0;
      }
      const epochs = totpEpochAvailable(options.epoch, options.step, options.window);
      const backward = totpCheckByEpoch(epochs.past, token, secret, options);
      if (backward !== null) {
        return backward * -1;
      }
      return totpCheckByEpoch(epochs.future, token, secret, options);
    }
    __name(totpCheckWithWindow, "totpCheckWithWindow");
    function totpTimeUsed(epoch, step) {
      return Math.floor(epoch / 1e3) % step;
    }
    __name(totpTimeUsed, "totpTimeUsed");
    function totpTimeRemaining(epoch, step) {
      return step - totpTimeUsed(epoch, step);
    }
    __name(totpTimeRemaining, "totpTimeRemaining");
    function totpKeyuri(accountName, issuer, secret, options) {
      return keyuri({
        algorithm: options.algorithm,
        digits: options.digits,
        step: options.step,
        type: exports.Strategy.TOTP,
        accountName,
        issuer,
        secret
      });
    }
    __name(totpKeyuri, "totpKeyuri");
    var TOTP = class _TOTP extends HOTP {
      static {
        __name(this, "TOTP");
      }
      create(defaultOptions = {}) {
        return new _TOTP(defaultOptions);
      }
      allOptions() {
        return totpOptions(this.options);
      }
      generate(secret) {
        return totpToken(secret, this.allOptions());
      }
      checkDelta(token, secret) {
        return totpCheckWithWindow(token, secret, this.allOptions());
      }
      check(token, secret) {
        const delta = this.checkDelta(token, secret);
        return typeof delta === "number";
      }
      verify(opts) {
        if (typeof opts !== "object") {
          throw new Error("Expecting argument 0 of verify to be an object");
        }
        return this.check(opts.token, opts.secret);
      }
      timeRemaining() {
        const options = this.allOptions();
        return totpTimeRemaining(options.epoch, options.step);
      }
      timeUsed() {
        const options = this.allOptions();
        return totpTimeUsed(options.epoch, options.step);
      }
      keyuri(accountName, issuer, secret) {
        return totpKeyuri(accountName, issuer, secret, this.allOptions());
      }
    };
    function authenticatorOptionValidator(options) {
      totpOptionsValidator(options);
      if (typeof options.keyDecoder !== "function") {
        throw new Error("Expecting options.keyDecoder to be a function.");
      }
      if (options.keyEncoder && typeof options.keyEncoder !== "function") {
        throw new Error("Expecting options.keyEncoder to be a function.");
      }
    }
    __name(authenticatorOptionValidator, "authenticatorOptionValidator");
    function authenticatorDefaultOptions() {
      const options = {
        algorithm: exports.HashAlgorithms.SHA1,
        createDigest: createDigestPlaceholder,
        createHmacKey: totpCreateHmacKey,
        digits: 6,
        encoding: exports.KeyEncodings.HEX,
        epoch: Date.now(),
        step: 30,
        window: 0
      };
      return options;
    }
    __name(authenticatorDefaultOptions, "authenticatorDefaultOptions");
    function authenticatorOptions(opt) {
      const options = {
        ...authenticatorDefaultOptions(),
        ...opt
      };
      authenticatorOptionValidator(options);
      return Object.freeze(options);
    }
    __name(authenticatorOptions, "authenticatorOptions");
    function authenticatorEncoder(secret, options) {
      return options.keyEncoder(secret, options.encoding);
    }
    __name(authenticatorEncoder, "authenticatorEncoder");
    function authenticatorDecoder(secret, options) {
      return options.keyDecoder(secret, options.encoding);
    }
    __name(authenticatorDecoder, "authenticatorDecoder");
    function authenticatorGenerateSecret(numberOfBytes, options) {
      const key = options.createRandomBytes(numberOfBytes, options.encoding);
      return authenticatorEncoder(key, options);
    }
    __name(authenticatorGenerateSecret, "authenticatorGenerateSecret");
    function authenticatorToken(secret, options) {
      return totpToken(authenticatorDecoder(secret, options), options);
    }
    __name(authenticatorToken, "authenticatorToken");
    function authenticatorCheckWithWindow(token, secret, options) {
      return totpCheckWithWindow(token, authenticatorDecoder(secret, options), options);
    }
    __name(authenticatorCheckWithWindow, "authenticatorCheckWithWindow");
    var Authenticator = class _Authenticator extends TOTP {
      static {
        __name(this, "Authenticator");
      }
      create(defaultOptions = {}) {
        return new _Authenticator(defaultOptions);
      }
      allOptions() {
        return authenticatorOptions(this.options);
      }
      generate(secret) {
        return authenticatorToken(secret, this.allOptions());
      }
      checkDelta(token, secret) {
        return authenticatorCheckWithWindow(token, secret, this.allOptions());
      }
      encode(secret) {
        return authenticatorEncoder(secret, this.allOptions());
      }
      decode(secret) {
        return authenticatorDecoder(secret, this.allOptions());
      }
      generateSecret(numberOfBytes = 10) {
        return authenticatorGenerateSecret(numberOfBytes, this.allOptions());
      }
    };
    exports.Authenticator = Authenticator;
    exports.HASH_ALGORITHMS = HASH_ALGORITHMS;
    exports.HOTP = HOTP;
    exports.KEY_ENCODINGS = KEY_ENCODINGS;
    exports.OTP = OTP;
    exports.STRATEGY = STRATEGY;
    exports.TOTP = TOTP;
    exports.authenticatorCheckWithWindow = authenticatorCheckWithWindow;
    exports.authenticatorDecoder = authenticatorDecoder;
    exports.authenticatorDefaultOptions = authenticatorDefaultOptions;
    exports.authenticatorEncoder = authenticatorEncoder;
    exports.authenticatorGenerateSecret = authenticatorGenerateSecret;
    exports.authenticatorOptionValidator = authenticatorOptionValidator;
    exports.authenticatorOptions = authenticatorOptions;
    exports.authenticatorToken = authenticatorToken;
    exports.createDigestPlaceholder = createDigestPlaceholder;
    exports.hotpCheck = hotpCheck;
    exports.hotpCounter = hotpCounter;
    exports.hotpCreateHmacKey = hotpCreateHmacKey;
    exports.hotpDefaultOptions = hotpDefaultOptions;
    exports.hotpDigestToToken = hotpDigestToToken;
    exports.hotpKeyuri = hotpKeyuri;
    exports.hotpOptions = hotpOptions;
    exports.hotpOptionsValidator = hotpOptionsValidator;
    exports.hotpToken = hotpToken;
    exports.isTokenValid = isTokenValid;
    exports.keyuri = keyuri;
    exports.objectValues = objectValues;
    exports.padStart = padStart;
    exports.totpCheck = totpCheck;
    exports.totpCheckByEpoch = totpCheckByEpoch;
    exports.totpCheckWithWindow = totpCheckWithWindow;
    exports.totpCounter = totpCounter;
    exports.totpCreateHmacKey = totpCreateHmacKey;
    exports.totpDefaultOptions = totpDefaultOptions;
    exports.totpEpochAvailable = totpEpochAvailable;
    exports.totpKeyuri = totpKeyuri;
    exports.totpOptions = totpOptions;
    exports.totpOptionsValidator = totpOptionsValidator;
    exports.totpPadSecret = totpPadSecret;
    exports.totpTimeRemaining = totpTimeRemaining;
    exports.totpTimeUsed = totpTimeUsed;
    exports.totpToken = totpToken;
  }
});

// node_modules/@otplib/preset-default/index.js
var require_preset_default = __commonJS({
  "node_modules/@otplib/preset-default/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var pluginCrypto = require_plugin_crypto();
    var pluginThirtyTwo = require_plugin_thirty_two();
    var core = require_core();
    var hotp = new core.HOTP({
      createDigest: pluginCrypto.createDigest
    });
    var totp = new core.TOTP({
      createDigest: pluginCrypto.createDigest
    });
    var authenticator2 = new core.Authenticator({
      createDigest: pluginCrypto.createDigest,
      createRandomBytes: pluginCrypto.createRandomBytes,
      keyDecoder: pluginThirtyTwo.keyDecoder,
      keyEncoder: pluginThirtyTwo.keyEncoder
    });
    exports.authenticator = authenticator2;
    exports.hotp = hotp;
    exports.totp = totp;
  }
});

// node_modules/otplib/index.js
var require_otplib = __commonJS({
  "node_modules/otplib/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    var presetDefault = require_preset_default();
    Object.keys(presetDefault).forEach(function(k) {
      if (k !== "default") Object.defineProperty(exports, k, {
        enumerable: true,
        get: /* @__PURE__ */ __name(function() {
          return presetDefault[k];
        }, "get")
      });
    });
  }
});

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = /* @__PURE__ */ __name(function getSymbolSize(version2) {
      if (!version2) throw new Error('"version" cannot be null or undefined');
      if (version2 < 1 || version2 > 40) throw new Error('"version" should be in range from 1 to 40');
      return version2 * 4 + 17;
    }, "getSymbolSize");
    exports.getSymbolTotalCodewords = /* @__PURE__ */ __name(function getSymbolTotalCodewords(version2) {
      return CODEWORDS_COUNT[version2];
    }, "getSymbolTotalCodewords");
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = /* @__PURE__ */ __name(function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    }, "setToSJISFunction");
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = /* @__PURE__ */ __name(function toSJIS(kanji) {
      return toSJISFunction(kanji);
    }, "toSJIS");
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    __name(BitBuffer, "BitBuffer");
    BitBuffer.prototype = {
      get: /* @__PURE__ */ __name(function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      }, "get"),
      put: /* @__PURE__ */ __name(function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      }, "put"),
      getLengthInBits: /* @__PURE__ */ __name(function() {
        return this.length;
      }, "getLengthInBits"),
      putBit: /* @__PURE__ */ __name(function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }, "putBit")
    };
    module.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    __name(BitMatrix, "BitMatrix");
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = /* @__PURE__ */ __name(function getRowColCoords(version2) {
      if (version2 === 1) return [];
      const posCount = Math.floor(version2 / 7) + 2;
      const size = getSymbolSize(version2);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    }, "getRowColCoords");
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version2) {
      const coords = [];
      const pos = exports.getRowColCoords(version2);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version2) {
      const size = getSymbolSize(version2);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = /* @__PURE__ */ __name(function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    }, "from");
    exports.getPenaltyN1 = /* @__PURE__ */ __name(function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    }, "getPenaltyN1");
    exports.getPenaltyN2 = /* @__PURE__ */ __name(function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    }, "getPenaltyN2");
    exports.getPenaltyN3 = /* @__PURE__ */ __name(function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    }, "getPenaltyN3");
    exports.getPenaltyN4 = /* @__PURE__ */ __name(function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    }, "getPenaltyN4");
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    __name(getMaskAt, "getMaskAt");
    exports.applyMask = /* @__PURE__ */ __name(function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    }, "applyMask");
    exports.getBestMask = /* @__PURE__ */ __name(function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    }, "getBestMask");
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = /* @__PURE__ */ __name(function getBlocksCount(version2, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version2 - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version2 - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version2 - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version2 - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getBlocksCount");
    exports.getTotalCodewordsCount = /* @__PURE__ */ __name(function getTotalCodewordsCount(version2, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version2 - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version2 - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version2 - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version2 - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getTotalCodewordsCount");
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (/* @__PURE__ */ __name(function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    }, "initTables"))();
    exports.log = /* @__PURE__ */ __name(function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    }, "log");
    exports.exp = /* @__PURE__ */ __name(function exp(n) {
      return EXP_TABLE[n];
    }, "exp");
    exports.mul = /* @__PURE__ */ __name(function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    }, "mul");
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var GF = require_galois_field();
    exports.mul = /* @__PURE__ */ __name(function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    }, "mul");
    exports.mod = /* @__PURE__ */ __name(function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    }, "mod");
    exports.generateECPolynomial = /* @__PURE__ */ __name(function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    }, "generateECPolynomial");
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    __name(ReedSolomonEncoder, "ReedSolomonEncoder");
    ReedSolomonEncoder.prototype.initialize = /* @__PURE__ */ __name(function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    }, "initialize");
    ReedSolomonEncoder.prototype.encode = /* @__PURE__ */ __name(function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    }, "encode");
    module.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    exports.isValid = /* @__PURE__ */ __name(function isValid(version2) {
      return !isNaN(version2) && version2 >= 1 && version2 <= 40;
    }, "isValid");
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = /* @__PURE__ */ __name(function testKanji(str) {
      return TEST_KANJI.test(str);
    }, "testKanji");
    exports.testNumeric = /* @__PURE__ */ __name(function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    }, "testNumeric");
    exports.testAlphanumeric = /* @__PURE__ */ __name(function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    }, "testAlphanumeric");
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = /* @__PURE__ */ __name(function getCharCountIndicator(mode, version2) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version2)) {
        throw new Error("Invalid version: " + version2);
      }
      if (version2 >= 1 && version2 < 10) return mode.ccBits[0];
      else if (version2 < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    }, "getCharCountIndicator");
    exports.getBestModeForData = /* @__PURE__ */ __name(function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    }, "getBestModeForData");
    exports.toString = /* @__PURE__ */ __name(function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    }, "toString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    }, "isValid");
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForDataLength, "getBestVersionForDataLength");
    function getReservedBitsCount(mode, version2) {
      return Mode.getCharCountIndicator(mode, version2) + 4;
    }
    __name(getReservedBitsCount, "getReservedBitsCount");
    function getTotalBitsFromDataArray(segments, version2) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version2);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    __name(getTotalBitsFromDataArray, "getTotalBitsFromDataArray");
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForMixedData, "getBestVersionForMixedData");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    }, "from");
    exports.getCapacity = /* @__PURE__ */ __name(function getCapacity(version2, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version2)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version2);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version2, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version2);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    }, "getCapacity");
    exports.getBestVersionForData = /* @__PURE__ */ __name(function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    }, "getBestVersionForData");
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(version2) {
      if (!VersionCheck.isValid(version2) || version2 < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version2 << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version2 << 12 | d;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    __name(NumericData, "NumericData");
    NumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    }, "getBitsLength");
    NumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    NumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    NumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    }, "write");
    module.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    __name(AlphanumericData, "AlphanumericData");
    AlphanumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    }, "getBitsLength");
    AlphanumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    AlphanumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    AlphanumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    }, "write");
    module.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    __name(ByteData, "ByteData");
    ByteData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 8;
    }, "getBitsLength");
    ByteData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    ByteData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    }, "getBitsLength");
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    __name(KanjiData, "KanjiData");
    KanjiData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 13;
    }, "getBitsLength");
    KanjiData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    KanjiData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    }, "getBitsLength");
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var dijkstra = {
      single_source_shortest_paths: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      }, "single_source_shortest_paths"),
      extract_shortest_path_from_predecessor_list: /* @__PURE__ */ __name(function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      }, "extract_shortest_path_from_predecessor_list"),
      find_path: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      }, "find_path"),
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: /* @__PURE__ */ __name(function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        }, "make"),
        default_sorter: /* @__PURE__ */ __name(function(a, b) {
          return a.cost - b.cost;
        }, "default_sorter"),
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: /* @__PURE__ */ __name(function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        }, "push"),
        /**
         * Return the highest priority element in the queue.
         */
        pop: /* @__PURE__ */ __name(function() {
          return this.queue.shift();
        }, "pop"),
        empty: /* @__PURE__ */ __name(function() {
          return this.queue.length === 0;
        }, "empty")
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    __name(getStringByteLength, "getStringByteLength");
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    __name(getSegments, "getSegments");
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    __name(getSegmentsFromString, "getSegmentsFromString");
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    __name(getSegmentBitsLength, "getSegmentBitsLength");
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    __name(mergeSegments, "mergeSegments");
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    __name(buildNodes, "buildNodes");
    function buildGraph(nodes, version2) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version2);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    __name(buildGraph, "buildGraph");
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    __name(buildSingleSegment, "buildSingleSegment");
    exports.fromArray = /* @__PURE__ */ __name(function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    }, "fromArray");
    exports.fromString = /* @__PURE__ */ __name(function fromString(data, version2) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version2);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    }, "fromString");
    exports.rawSplit = /* @__PURE__ */ __name(function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    }, "rawSplit");
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version2) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version2);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupFinderPattern, "setupFinderPattern");
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    __name(setupTimingPattern, "setupTimingPattern");
    function setupAlignmentPattern(matrix, version2) {
      const pos = AlignmentPattern.getPositions(version2);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupAlignmentPattern, "setupAlignmentPattern");
    function setupVersionInfo(matrix, version2) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version2);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    __name(setupVersionInfo, "setupVersionInfo");
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    __name(setupFormatInfo, "setupFormatInfo");
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    __name(setupData, "setupData");
    function createData(version2, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version2));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version2);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version2, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version2, errorCorrectionLevel);
    }
    __name(createData, "createData");
    function createCodewords(bitBuffer, version2, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version2);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version2, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version2, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    __name(createCodewords, "createCodewords");
    function createSymbol(data, version2, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version2;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version2) {
        version2 = bestVersion;
      } else if (version2 < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version2, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version2);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version2);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version2);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version2 >= 7) {
        setupVersionInfo(modules, version2);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version: version2,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    __name(createSymbol, "createSymbol");
    exports.create = /* @__PURE__ */ __name(function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version2;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version2 = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version2, errorCorrectionLevel, mask);
    }, "create");
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    __name(hex2rgba, "hex2rgba");
    exports.getOptions = /* @__PURE__ */ __name(function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    }, "getOptions");
    exports.getScale = /* @__PURE__ */ __name(function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    }, "getScale");
    exports.getImageWidth = /* @__PURE__ */ __name(function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    }, "getImageWidth");
    exports.qrToImageData = /* @__PURE__ */ __name(function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    }, "qrToImageData");
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    __name(clearCanvas, "clearCanvas");
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    __name(getCanvasElement, "getCanvasElement");
    exports.render = /* @__PURE__ */ __name(function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    }, "render");
    exports.renderToDataURL = /* @__PURE__ */ __name(function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    }, "renderToDataURL");
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    __name(getColorAttrib, "getColorAttrib");
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    __name(svgCmd, "svgCmd");
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    __name(qrToPath, "qrToPath");
    exports.render = /* @__PURE__ */ __name(function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    }, "render");
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    __name(renderCanvas, "renderCanvas");
    exports.create = QRCode2.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// src/index.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/middleware/jwt/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/middleware/jwt/jwt.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/helper/cookie/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/utils/cookie.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/utils/url.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = /* @__PURE__ */ __name((value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}, "trimCookieWhitespace");
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// node_modules/hono/dist/http-exception.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/utils/jwt/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/utils/jwt/jwt.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/utils/encode.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/hono/dist/utils/jwt/jwa.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// node_modules/hono/dist/utils/jwt/jws.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/helper/adapter/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform2) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform2);
}, "checkUserAgentEquals");

// node_modules/hono/dist/utils/jwt/types.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var JwtAlgorithmNotImplemented = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotImplemented");
  }
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
};
var JwtAlgorithmRequired = class extends Error {
  static {
    __name(this, "JwtAlgorithmRequired");
  }
  constructor() {
    super('JWT verification requires "alg" option to be specified');
    this.name = "JwtAlgorithmRequired";
  }
};
var JwtAlgorithmMismatch = class extends Error {
  static {
    __name(this, "JwtAlgorithmMismatch");
  }
  constructor(expected, actual) {
    super(`JWT algorithm mismatch: expected "${expected}", got "${actual}"`);
    this.name = "JwtAlgorithmMismatch";
  }
};
var JwtTokenInvalid = class extends Error {
  static {
    __name(this, "JwtTokenInvalid");
  }
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
};
var JwtTokenNotBefore = class extends Error {
  static {
    __name(this, "JwtTokenNotBefore");
  }
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
};
var JwtTokenExpired = class extends Error {
  static {
    __name(this, "JwtTokenExpired");
  }
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
};
var JwtTokenIssuedAt = class extends Error {
  static {
    __name(this, "JwtTokenIssuedAt");
  }
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
};
var JwtTokenIssuer = class extends Error {
  static {
    __name(this, "JwtTokenIssuer");
  }
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
};
var JwtHeaderInvalid = class extends Error {
  static {
    __name(this, "JwtHeaderInvalid");
  }
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
};
var JwtHeaderRequiresKid = class extends Error {
  static {
    __name(this, "JwtHeaderRequiresKid");
  }
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
};
var JwtSymmetricAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtSymmetricAlgorithmNotAllowed");
  }
  constructor(alg) {
    super(`symmetric algorithm "${alg}" is not allowed for JWK verification`);
    this.name = "JwtSymmetricAlgorithmNotAllowed";
  }
};
var JwtAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotAllowed");
  }
  constructor(alg, allowedAlgorithms) {
    super(`algorithm "${alg}" is not in the allowed list: [${allowedAlgorithms.join(", ")}]`);
    this.name = "JwtAlgorithmNotAllowed";
  }
};
var JwtTokenSignatureMismatched = class extends Error {
  static {
    __name(this, "JwtTokenSignatureMismatched");
  }
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
};
var JwtPayloadRequiresAud = class extends Error {
  static {
    __name(this, "JwtPayloadRequiresAud");
  }
  constructor(payload) {
    super(`required "aud" in jwt payload: ${JSON.stringify(payload)}`);
    this.name = "JwtPayloadRequiresAud";
  }
};
var JwtTokenAudience = class extends Error {
  static {
    __name(this, "JwtTokenAudience");
  }
  constructor(expected, aud) {
    super(
      `expected audience "${Array.isArray(expected) ? expected.join(", ") : expected}", got "${aud}"`
    );
    this.name = "JwtTokenAudience";
  }
};
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// node_modules/hono/dist/utils/jwt/utf8.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*?-+/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
        // 256 >> 3
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
        // 384 >> 3
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
        // 512 >> 3,
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  if (!algOrOptions) {
    throw new JwtAlgorithmRequired();
  }
  const {
    alg,
    iss,
    nbf = true,
    exp = true,
    iat = true,
    aud
  } = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions;
  if (!alg) {
    throw new JwtAlgorithmRequired();
  }
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (header.alg !== alg) {
    throw new JwtAlgorithmMismatch(alg, header.alg);
  }
  const now = Math.floor(Date.now() / 1e3);
  if (nbf && payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || payload.nbf > now) {
      throw new JwtTokenNotBefore(token);
    }
  }
  if (exp && payload.exp !== void 0) {
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now) {
      throw new JwtTokenExpired(token);
    }
  }
  if (iat && payload.iat !== void 0) {
    if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || now < payload.iat) {
      throw new JwtTokenIssuedAt(now, payload.iat);
    }
  }
  if (iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(iss, null);
    }
    if (typeof iss === "string" && payload.iss !== iss) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
    if (iss instanceof RegExp && !iss.test(payload.iss)) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
  }
  if (aud) {
    if (!payload.aud) {
      throw new JwtPayloadRequiresAud(payload);
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matched = audiences.some(
      (payloadAud) => aud instanceof RegExp ? aud.test(payloadAud) : typeof aud === "string" ? payloadAud === aud : Array.isArray(aud) && aud.includes(payloadAud)
    );
    if (!matched) {
      throw new JwtTokenAudience(aud, payload.aud);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var symmetricAlgorithms = [
  AlgorithmTypes.HS256,
  AlgorithmTypes.HS384,
  AlgorithmTypes.HS512
];
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (symmetricAlgorithms.includes(header.alg)) {
    throw new JwtSymmetricAlgorithmNotAllowed(header.alg);
  }
  if (!options.allowedAlgorithms.includes(header.alg)) {
    throw new JwtAlgorithmNotAllowed(header.alg, options.allowedAlgorithms);
  }
  let verifyKeys = options.keys ? [...options.keys] : void 0;
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    verifyKeys ??= [];
    verifyKeys.push(...data.keys);
  } else if (!verifyKeys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = verifyKeys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  if (matchingKey.alg && matchingKey.alg !== header.alg) {
    throw new JwtAlgorithmMismatch(matchingKey.alg, header.alg);
  }
  return await verify(token, matchingKey, {
    alg: header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    const header = decodeJwtPart(parts[0]);
    const payload = decodeJwtPart(parts[1]);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    return decodeJwtPart(parts[0]);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyWithJwks };

// node_modules/hono/dist/context.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/request.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/request/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form2, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw3 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw3[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var escapeRe = /[&<>'"]/;
var stringBufferToString = /* @__PURE__ */ __name(async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
}, "stringBufferToString");
var escapeToBuffer = /* @__PURE__ */ __name((str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match2; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
}, "escapeToBuffer");
var resolveCallbackSync = /* @__PURE__ */ __name((str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
}, "resolveCallbackSync");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html2, arg, headers) => {
    const res = /* @__PURE__ */ __name((html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/middleware/jwt/jwt.js
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// node_modules/hono/dist/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/hono.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/hono-base.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/compose.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input2, requestInit, Env, executionCtx) => {
    if (input2 instanceof Request) {
      return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
    }
    input2 = input2.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/reg-exp-router/matcher.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/smart-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/smart-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/trie-router/router.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/router/trie-router/node.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/csrf/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var secFetchSiteValues = ["same-origin", "same-site", "none", "cross-site"];
var isSecFetchSite = /* @__PURE__ */ __name((value) => secFetchSiteValues.includes(value), "isSecFetchSite");
var isSafeMethodRe = /^(GET|HEAD)$/;
var isRequestedByFormElementRe = /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;
var csrf = /* @__PURE__ */ __name((options) => {
  const originHandler = ((optsOrigin) => {
    if (!optsOrigin) {
      return (origin, c) => origin === new URL(c.req.url).origin;
    } else if (typeof optsOrigin === "string") {
      return (origin) => origin === optsOrigin;
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin);
    }
  })(options?.origin);
  const isAllowedOrigin = /* @__PURE__ */ __name(async (origin, c) => {
    if (origin === void 0) {
      return false;
    }
    return await originHandler(origin, c);
  }, "isAllowedOrigin");
  const secFetchSiteHandler = ((optsSecFetchSite) => {
    if (!optsSecFetchSite) {
      return (secFetchSite) => secFetchSite === "same-origin";
    } else if (typeof optsSecFetchSite === "string") {
      return (secFetchSite) => secFetchSite === optsSecFetchSite;
    } else if (typeof optsSecFetchSite === "function") {
      return optsSecFetchSite;
    } else {
      return (secFetchSite) => optsSecFetchSite.includes(secFetchSite);
    }
  })(options?.secFetchSite);
  const isAllowedSecFetchSite = /* @__PURE__ */ __name(async (secFetchSite, c) => {
    if (secFetchSite === void 0) {
      return false;
    }
    if (!isSecFetchSite(secFetchSite)) {
      return false;
    }
    return await secFetchSiteHandler(secFetchSite, c);
  }, "isAllowedSecFetchSite");
  return /* @__PURE__ */ __name(async function csrf2(c, next) {
    if (!isSafeMethodRe.test(c.req.method) && isRequestedByFormElementRe.test(c.req.header("content-type") || "text/plain") && !await isAllowedSecFetchSite(c.req.header("sec-fetch-site"), c) && !await isAllowedOrigin(c.req.header("origin"), c)) {
      const res = new Response("Forbidden", { status: 403 });
      throw new HTTPException(403, { res });
    }
    await next();
  }, "csrf2");
}, "csrf");

// src/utils/auth.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var import_bcryptjs = __toESM(require_bcrypt());
async function hashPassword(password) {
  return await (0, import_bcryptjs.hash)(password, 10);
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hashStr) {
  return await (0, import_bcryptjs.compare)(password, hashStr);
}
__name(verifyPassword, "verifyPassword");
function generateToken() {
  return crypto.randomUUID();
}
__name(generateToken, "generateToken");
function getCookieOptions(expiresAt) {
  return {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "Lax",
    expires: new Date(expiresAt * 1e3)
  };
}
__name(getCookieOptions, "getCookieOptions");

// src/utils/totp.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var import_otplib = __toESM(require_otplib());
var import_qrcode = __toESM(require_browser());
import_otplib.authenticator.options = {
  window: 6,
  // Allow 1 step window for time drift
  step: 30
};
function generateSecret() {
  return import_otplib.authenticator.generateSecret();
}
__name(generateSecret, "generateSecret");
function verifyToken(token, secret) {
  try {
    return import_otplib.authenticator.verify({ token, secret });
  } catch (e) {
    return false;
  }
}
__name(verifyToken, "verifyToken");
async function generateQRCode(secret, accountName, issuer) {
  const otpauth = import_otplib.authenticator.keyuri(accountName, issuer, secret);
  const svgString = await import_qrcode.default.toString(otpauth, { type: "svg", margin: 2 });
  const base64Svg = btoa(svgString);
  return `data:image/svg+xml;base64,${base64Svg}`;
}
__name(generateQRCode, "generateQRCode");

// src/utils/mail.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
async function sendEmail(env2, to, subject, html2) {
  if (!env2.RESEND_API_KEY) {
    console.warn("[Mail Mock] API Key missing. Log only.");
    console.log(`To: ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env2.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        // Updated to the custom domain
        from: "tobira <noreply@tobiras.work>",
        to: [to],
        subject,
        html: html2
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Mail Error]", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Mail Exception]", e);
    return false;
  }
}
__name(sendEmail, "sendEmail");

// src/utils/icon.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
async function fetchAppIcon(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      headers: { "User-Agent": "Tobira-Auth-Bot/1.0" },
      cf: { cacheTtl: 3600 }
    });
    if (!response.ok) return null;
    const html2 = await response.text();
    let iconUrl = null;
    const sizeMatch = html2.match(/<link[^>]+(?:rel=["'](?:apple-touch-icon|icon)["'][^>]*sizes=["']512x512["']|sizes=["']512x512["'][^>]*rel=["'](?:apple-touch-icon|icon)["'])[^>]*href=["']([^"']+)["']/i);
    if (sizeMatch && sizeMatch[1]) {
      iconUrl = sizeMatch[1];
    }
    if (!iconUrl) {
      const touchMatch = html2.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      if (touchMatch && touchMatch[1]) iconUrl = touchMatch[1];
    }
    if (!iconUrl) {
      const favMatch = html2.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
      if (favMatch && favMatch[1]) iconUrl = favMatch[1];
    }
    if (iconUrl) {
      try {
        return new URL(iconUrl, baseUrl).href;
      } catch (e) {
        return null;
      }
    }
    try {
      const defaultFavicon = new URL("/favicon.ico", baseUrl).href;
      const check = await fetch(defaultFavicon, { method: "HEAD" });
      if (check.ok) return defaultFavicon;
    } catch (e) {
    }
    return null;
  } catch (e) {
    console.error("Icon fetch failed", e);
    return null;
  }
}
__name(fetchAppIcon, "fetchAppIcon");

// src/oidc/jwt.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/oidc/keys.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var KEYS_ROW = "oidc_keys";
var te = new TextEncoder();
var td = new TextDecoder();
var ROTATION_INTERVAL_S = 30 * 24 * 3600;
var RETENTION_S = ROTATION_INTERVAL_S + 7 * 24 * 3600;
var cache = null;
var CACHE_TTL_S = 300;
var b64u = /* @__PURE__ */ __name((b) => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b);
  let bin = "";
  for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}, "b64u");
var fromB64u = /* @__PURE__ */ __name((s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}, "fromB64u");
async function deriveKek(kek) {
  const material = kek || "dev-only-insecure-oidc-kek-change-me";
  const hash2 = await crypto.subtle.digest("SHA-256", te.encode(material));
  return crypto.subtle.importKey("raw", hash2, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
__name(deriveKek, "deriveKek");
async function decryptPrivate(env2, kekKey) {
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64u(env2.iv) }, kekKey, fromB64u(env2.ct));
    return JSON.parse(td.decode(pt));
  } catch {
    return null;
  }
}
__name(decryptPrivate, "decryptPrivate");
async function buildEnvelope(kekKey, now) {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const publicJwk = { kty: pub.kty, n: pub.n, e: pub.e };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kekKey, te.encode(JSON.stringify(privateJwk)));
  return { kid: crypto.randomUUID(), publicJwk, iv: b64u(iv), ct: b64u(ct), createdAt: now };
}
__name(buildEnvelope, "buildEnvelope");
function parseStored(value, now) {
  if (!value) return { envs: [], wasV3: false };
  let v;
  try {
    v = JSON.parse(value);
  } catch {
    return { envs: [], wasV3: false };
  }
  if (v && v.v === 3 && Array.isArray(v.keys)) return { envs: v.keys, wasV3: true };
  if (v && v.v === 2 && v.iv && v.ct && v.kid && v.publicJwk) {
    return { envs: [{ kid: v.kid, publicJwk: v.publicJwk, iv: v.iv, ct: v.ct, createdAt: now }], wasV3: false };
  }
  return { envs: [], wasV3: false };
}
__name(parseStored, "parseStored");
async function loadKeyset(db, kek) {
  const now = Math.floor(Date.now() / 1e3);
  const kekKey = await deriveKek(kek);
  const read = /* @__PURE__ */ __name(async () => {
    const row = await db.prepare("SELECT value FROM system_config WHERE key = ?").bind(KEYS_ROW).first();
    const { envs: envs2, wasV3: wasV32 } = parseStored(row?.value, now);
    envs2.sort((a, b) => b.createdAt - a.createdAt);
    return { envs: envs2, wasV3: wasV32, hadRow: !!row?.value };
  }, "read");
  const findActive = /* @__PURE__ */ __name(async (envs2) => {
    for (const e of envs2) {
      const priv = await decryptPrivate(e, kekKey);
      if (priv) return { env: e, priv };
    }
    return null;
  }, "findActive");
  let { envs, wasV3, hadRow } = await read();
  let act = await findActive(envs);
  let changed = hadRow && !wasV3;
  if (!act) {
    const fresh = await buildEnvelope(kekKey, now);
    await db.prepare("INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)").bind(KEYS_ROW, JSON.stringify({ v: 3, keys: [fresh] })).run();
    ({ envs } = await read());
    act = await findActive(envs);
    if (!act) {
      await db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)").bind(KEYS_ROW, JSON.stringify({ v: 3, keys: [fresh] })).run();
      envs = [fresh];
      act = { env: fresh, priv: await decryptPrivate(fresh, kekKey) };
    }
    changed = false;
  }
  if (act.env.createdAt < now - ROTATION_INTERVAL_S) {
    const fresh = await buildEnvelope(kekKey, now);
    envs = [fresh, ...envs];
    act = { env: fresh, priv: await decryptPrivate(fresh, kekKey) };
    changed = true;
  }
  const kept = envs.filter((e) => e.kid === act.env.kid || e.createdAt >= now - RETENTION_S);
  if (kept.length !== envs.length) changed = true;
  envs = kept;
  if (changed) {
    await db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)").bind(KEYS_ROW, JSON.stringify({ v: 3, keys: envs })).run();
  }
  return {
    active: { kid: act.env.kid, privateJwk: act.priv, publicJwk: act.env.publicJwk },
    jwks: envs.map((e) => ({ ...e.publicJwk, kid: e.kid }))
  };
}
__name(loadKeyset, "loadKeyset");
async function getKeyset(db, kek) {
  const now = Math.floor(Date.now() / 1e3);
  if (cache && cache.expires > now) return cache.keyset;
  const keyset = await loadKeyset(db, kek);
  cache = { keyset, expires: now + CACHE_TTL_S };
  return keyset;
}
__name(getKeyset, "getKeyset");
async function getOidcKeys(db, kek) {
  return (await getKeyset(db, kek)).active;
}
__name(getOidcKeys, "getOidcKeys");
async function getJwksKeys(db, kek) {
  return (await getKeyset(db, kek)).jwks;
}
__name(getJwksKeys, "getJwksKeys");

// src/oidc/jwt.ts
function bytesToBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(bytesToBase64Url, "bytesToBase64Url");
function strToBase64Url(str) {
  return bytesToBase64Url(new TextEncoder().encode(str));
}
__name(strToBase64Url, "strToBase64Url");
function base64UrlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(base64UrlToBytes, "base64UrlToBytes");
var signingKeyCache = null;
async function getSigningKey(db, kek) {
  const { kid, privateJwk } = await getOidcKeys(db, kek);
  if (signingKeyCache && signingKeyCache.kid === kid) return signingKeyCache;
  const key = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  signingKeyCache = { kid, key };
  return signingKeyCache;
}
__name(getSigningKey, "getSigningKey");
async function signRS256(payload, db, kek, typ = "JWT") {
  const { kid, key } = await getSigningKey(db, kek);
  const header = { alg: "RS256", typ, kid };
  const signingInput = `${strToBase64Url(JSON.stringify(header))}.${strToBase64Url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`;
}
__name(signRS256, "signRS256");
var verifyKeyCache = /* @__PURE__ */ new Map();
async function verifyRS256(token, db, kek) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header;
  let payload;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
  } catch {
    return null;
  }
  if (header.alg !== "RS256") return null;
  const jwks = await getJwksKeys(db, kek);
  const candidates = header.kid ? jwks.filter((k) => k.kid === header.kid) : jwks;
  const sig = base64UrlToBytes(parts[2]);
  const signedBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  for (const jwk of candidates) {
    let key = verifyKeyCache.get(jwk.kid);
    if (!key) {
      try {
        key = await crypto.subtle.importKey(
          "jwk",
          { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"]
        );
      } catch {
        continue;
      }
      verifyKeyCache.set(jwk.kid, key);
    }
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, signedBytes);
    if (ok) return payload;
  }
  return null;
}
__name(verifyRS256, "verifyRS256");
async function verifyPkce(verifier, challenge, method) {
  if (!challenge) return true;
  if (!verifier) return false;
  if (!method || method.toUpperCase() !== "S256") return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return bytesToBase64Url(new Uint8Array(digest)) === challenge;
}
__name(verifyPkce, "verifyPkce");

// src/views/Login.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/helper/html/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var html = /* @__PURE__ */ __name((strings, ...values) => {
  const buffer = [""];
  for (let i = 0, len = strings.length - 1; i < len; i++) {
    buffer[0] += strings[i];
    const children = Array.isArray(values[i]) ? values[i].flat(Infinity) : [values[i]];
    for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
      const child = children[i2];
      if (typeof child === "string") {
        escapeToBuffer(child, buffer);
      } else if (typeof child === "number") {
        ;
        buffer[0] += child;
      } else if (typeof child === "boolean" || child === null || child === void 0) {
        continue;
      } else if (typeof child === "object" && child.isEscaped) {
        if (child.callbacks) {
          buffer.unshift("", child);
        } else {
          const tmp = child.toString();
          if (tmp instanceof Promise) {
            buffer.unshift("", tmp);
          } else {
            buffer[0] += tmp;
          }
        }
      } else if (child instanceof Promise) {
        buffer.unshift("", child);
      } else {
        escapeToBuffer(child.toString(), buffer);
      }
    }
  }
  buffer[0] += strings.at(-1);
  return buffer.length === 1 ? "callbacks" in buffer ? raw(resolveCallbackSync(raw(buffer[0], buffer.callbacks))) : raw(buffer[0]) : stringBufferToString(buffer, buffer.callbacks);
}, "html");

// node_modules/hono/dist/helper/css/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/constants.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var PERMALINK = /* @__PURE__ */ Symbol("PERMALINK");

// node_modules/hono/dist/jsx/dom/css.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/helper/css/common.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var PSEUDO_GLOBAL_SELECTOR = ":-hono-global";
var isPseudoGlobalSelectorRe = new RegExp(`^${PSEUDO_GLOBAL_SELECTOR}{(.*)}$`);
var DEFAULT_STYLE_ID = "hono-css";
var SELECTOR = /* @__PURE__ */ Symbol();
var CLASS_NAME = /* @__PURE__ */ Symbol();
var STYLE_STRING = /* @__PURE__ */ Symbol();
var SELECTORS = /* @__PURE__ */ Symbol();
var EXTERNAL_CLASS_NAMES = /* @__PURE__ */ Symbol();
var CSS_ESCAPED = /* @__PURE__ */ Symbol();
var toHash = /* @__PURE__ */ __name((str) => {
  let i = 0, out = 11;
  while (i < str.length) {
    out = 101 * out + str.charCodeAt(i++) >>> 0;
  }
  return "css-" + out;
}, "toHash");
var normalizeLabel = /* @__PURE__ */ __name((label) => {
  return label.trim().replace(/\s+/g, "-");
}, "normalizeLabel");
var isValidClassName = /* @__PURE__ */ __name((name) => /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(name), "isValidClassName");
var RESERVED_KEYFRAME_NAMES = /* @__PURE__ */ new Set([
  "default",
  "inherit",
  "initial",
  "none",
  "revert",
  "revert-layer",
  "unset"
]);
var isValidKeyframeName = /* @__PURE__ */ __name((name) => isValidClassName(name) && !RESERVED_KEYFRAME_NAMES.has(name.toLowerCase()), "isValidKeyframeName");
var defaultOnInvalidSlug = /* @__PURE__ */ __name((slug) => {
  console.warn(`Invalid slug: ${slug}`);
}, "defaultOnInvalidSlug");
var cssStringReStr = [
  '"(?:(?:\\\\[\\s\\S]|[^"\\\\])*)"',
  // double quoted string
  "'(?:(?:\\\\[\\s\\S]|[^'\\\\])*)'"
  // single quoted string
].join("|");
var minifyCssRe = new RegExp(
  [
    "(" + cssStringReStr + ")",
    // $1: quoted string
    "(?:" + [
      "^\\s+",
      // head whitespace
      "\\/\\*.*?\\*\\/\\s*",
      // multi-line comment
      "\\/\\/.*\\n\\s*",
      // single-line comment
      "\\s+$"
      // tail whitespace
    ].join("|") + ")",
    "\\s*;\\s*(}|$)\\s*",
    // $2: trailing semicolon
    "\\s*([{};:,])\\s*",
    // $3: whitespace around { } : , ;
    "(\\s)\\s+"
    // $4: 2+ spaces
  ].join("|"),
  "g"
);
var minify = /* @__PURE__ */ __name((css3) => {
  return css3.replace(minifyCssRe, (_, $1, $2, $3, $4) => $1 || $2 || $3 || $4 || "");
}, "minify");
var buildStyleString = /* @__PURE__ */ __name((strings, values) => {
  const selectors = [];
  const externalClassNames = [];
  const label = strings[0].match(/^\s*\/\*(.*?)\*\//)?.[1] || "";
  let styleString = "";
  for (let i = 0, len = strings.length; i < len; i++) {
    styleString += strings[i];
    let vArray = values[i];
    if (typeof vArray === "boolean" || vArray === null || vArray === void 0) {
      continue;
    }
    if (!Array.isArray(vArray)) {
      vArray = [vArray];
    }
    for (let j = 0, len2 = vArray.length; j < len2; j++) {
      let value = vArray[j];
      if (typeof value === "boolean" || value === null || value === void 0) {
        continue;
      }
      if (typeof value === "string") {
        if (/([\\"'\/])/.test(value)) {
          styleString += value.replace(/([\\"']|(?<=<)\/)/g, "\\$1");
        } else {
          styleString += value;
        }
      } else if (typeof value === "number") {
        styleString += value;
      } else if (value[CSS_ESCAPED]) {
        styleString += value[CSS_ESCAPED];
      } else if (value[CLASS_NAME].startsWith("@keyframes ")) {
        selectors.push(value);
        styleString += ` ${value[CLASS_NAME].substring(11)} `;
      } else {
        if (strings[i + 1]?.match(/^\s*{/)) {
          selectors.push(value);
          value = `.${value[CLASS_NAME]}`;
        } else {
          selectors.push(...value[SELECTORS]);
          externalClassNames.push(...value[EXTERNAL_CLASS_NAMES]);
          value = value[STYLE_STRING];
          const valueLen = value.length;
          if (valueLen > 0) {
            const lastChar = value[valueLen - 1];
            if (lastChar !== ";" && lastChar !== "}") {
              value += ";";
            }
          }
        }
        styleString += `${value || ""}`;
      }
    }
  }
  return [label, minify(styleString), selectors, externalClassNames];
}, "buildStyleString");
var cssCommon = /* @__PURE__ */ __name((strings, values, classNameSlug, onInvalidSlug) => {
  let [label, thisStyleString, selectors, externalClassNames] = buildStyleString(strings, values);
  const isPseudoGlobal = isPseudoGlobalSelectorRe.exec(thisStyleString);
  if (isPseudoGlobal) {
    thisStyleString = isPseudoGlobal[1];
  }
  const hash2 = toHash(label + thisStyleString);
  let customSlug;
  if (classNameSlug) {
    const slug = classNameSlug(hash2, normalizeLabel(label), thisStyleString);
    if (slug) {
      if (isValidClassName(slug)) {
        customSlug = slug;
      } else {
        ;
        (onInvalidSlug || defaultOnInvalidSlug)(slug);
      }
    }
  }
  const selector = (isPseudoGlobal ? PSEUDO_GLOBAL_SELECTOR : "") + (customSlug || hash2);
  const className = (isPseudoGlobal ? selectors.map((s) => s[CLASS_NAME]) : [selector, ...externalClassNames]).join(" ");
  return {
    [SELECTOR]: selector,
    [CLASS_NAME]: className,
    [STYLE_STRING]: thisStyleString,
    [SELECTORS]: selectors,
    [EXTERNAL_CLASS_NAMES]: externalClassNames
  };
}, "cssCommon");
var cxCommon = /* @__PURE__ */ __name((args) => {
  for (let i = 0, len = args.length; i < len; i++) {
    const arg = args[i];
    if (typeof arg === "string") {
      args[i] = {
        [SELECTOR]: "",
        [CLASS_NAME]: "",
        [STYLE_STRING]: "",
        [SELECTORS]: [],
        [EXTERNAL_CLASS_NAMES]: [arg]
      };
    }
  }
  return args;
}, "cxCommon");
var keyframesCommon = /* @__PURE__ */ __name((strings, values, classNameSlug, onInvalidSlug) => {
  const [label, styleString] = buildStyleString(strings, values);
  const hash2 = toHash(label + styleString);
  let customSlug;
  if (classNameSlug) {
    const slug = classNameSlug(hash2, normalizeLabel(label), styleString);
    if (slug) {
      if (isValidKeyframeName(slug)) {
        customSlug = slug;
      } else {
        ;
        (onInvalidSlug || defaultOnInvalidSlug)(slug);
      }
    }
  }
  return {
    [SELECTOR]: "",
    [CLASS_NAME]: `@keyframes ${customSlug || hash2}`,
    [STYLE_STRING]: styleString,
    [SELECTORS]: [],
    [EXTERNAL_CLASS_NAMES]: []
  };
}, "keyframesCommon");
var viewTransitionNameIndex = 0;
var viewTransitionCommon = /* @__PURE__ */ __name(((strings, values, classNameSlug, onInvalidSlug) => {
  if (!strings) {
    strings = [`/* h-v-t ${viewTransitionNameIndex++} */`];
  }
  const content = Array.isArray(strings) ? cssCommon(strings, values, classNameSlug, onInvalidSlug) : strings;
  const transitionName = content[CLASS_NAME];
  const res = cssCommon(
    ["view-transition-name:", ""],
    // eslint-disable-line @typescript-eslint/no-explicit-any
    [transitionName],
    classNameSlug,
    onInvalidSlug
  );
  content[CLASS_NAME] = PSEUDO_GLOBAL_SELECTOR + content[CLASS_NAME];
  content[STYLE_STRING] = content[STYLE_STRING].replace(
    /(?<=::view-transition(?:[a-z-]*)\()(?=\))/g,
    transitionName
  );
  res[CLASS_NAME] = res[SELECTOR] = transitionName;
  res[SELECTORS] = [...content[SELECTORS], content];
  return res;
}), "viewTransitionCommon");

// node_modules/hono/dist/jsx/dom/css.js
var splitRule = /* @__PURE__ */ __name((rule) => {
  const result = [];
  let startPos = 0;
  let depth = 0;
  for (let i = 0, len = rule.length; i < len; i++) {
    const char = rule[i];
    if (char === "'" || char === '"') {
      const quote = char;
      i++;
      for (; i < len; i++) {
        if (rule[i] === "\\") {
          i++;
          continue;
        }
        if (rule[i] === quote) {
          break;
        }
      }
      continue;
    }
    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      depth--;
      if (depth === 0) {
        result.push(rule.slice(startPos, i + 1));
        startPos = i + 1;
      }
      continue;
    }
  }
  return result;
}, "splitRule");
var createCssJsxDomObjects = /* @__PURE__ */ __name(({ id }) => {
  let styleSheet = void 0;
  const findStyleSheet = /* @__PURE__ */ __name(() => {
    if (!styleSheet) {
      styleSheet = document.querySelector(`style#${id}`)?.sheet;
      if (styleSheet) {
        ;
        styleSheet.addedStyles = /* @__PURE__ */ new Set();
      }
    }
    return styleSheet ? [styleSheet, styleSheet.addedStyles] : [];
  }, "findStyleSheet");
  const insertRule = /* @__PURE__ */ __name((className, styleString) => {
    const [sheet, addedStyles] = findStyleSheet();
    if (!sheet || !addedStyles) {
      Promise.resolve().then(() => {
        if (!findStyleSheet()[0]) {
          throw new Error("style sheet not found");
        }
        insertRule(className, styleString);
      });
      return;
    }
    if (!addedStyles.has(className)) {
      addedStyles.add(className);
      (className.startsWith(PSEUDO_GLOBAL_SELECTOR) ? splitRule(styleString) : [`${className[0] === "@" ? "" : "."}${className}{${styleString}}`]).forEach((rule) => {
        sheet.insertRule(rule, sheet.cssRules.length);
      });
    }
  }, "insertRule");
  const cssObject = {
    toString() {
      const selector = this[SELECTOR];
      insertRule(selector, this[STYLE_STRING]);
      this[SELECTORS].forEach(({ [CLASS_NAME]: className, [STYLE_STRING]: styleString }) => {
        insertRule(className, styleString);
      });
      return this[CLASS_NAME];
    }
  };
  const Style22 = /* @__PURE__ */ __name(({ children, nonce }) => ({
    tag: "style",
    props: {
      id,
      nonce,
      children: children && (Array.isArray(children) ? children : [children]).map(
        (c) => c[STYLE_STRING]
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }), "Style2");
  return [cssObject, Style22];
}, "createCssJsxDomObjects");
var createCssContext = /* @__PURE__ */ __name(({
  id,
  classNameSlug,
  onInvalidSlug
}) => {
  const [cssObject, Style22] = createCssJsxDomObjects({ id });
  const newCssClassNameObject = /* @__PURE__ */ __name((cssClassName) => {
    cssClassName.toString = cssObject.toString;
    return cssClassName;
  }, "newCssClassNameObject");
  const css22 = /* @__PURE__ */ __name((strings, ...values) => {
    return newCssClassNameObject(cssCommon(strings, values, classNameSlug, onInvalidSlug));
  }, "css2");
  const cx22 = /* @__PURE__ */ __name((...args) => {
    args = cxCommon(args);
    return css22(Array(args.length).fill(""), ...args);
  }, "cx2");
  const keyframes22 = /* @__PURE__ */ __name((strings, ...values) => keyframesCommon(strings, values, classNameSlug, onInvalidSlug), "keyframes2");
  const viewTransition22 = /* @__PURE__ */ __name(((strings, ...values) => {
    return newCssClassNameObject(
      viewTransitionCommon(strings, values, classNameSlug, onInvalidSlug)
      // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }), "viewTransition2");
  return {
    css: css22,
    cx: cx22,
    keyframes: keyframes22,
    viewTransition: viewTransition22,
    Style: Style22
  };
}, "createCssContext");
var defaultContext = createCssContext({ id: DEFAULT_STYLE_ID });
var css = defaultContext.css;
var cx = defaultContext.cx;
var keyframes = defaultContext.keyframes;
var viewTransition = defaultContext.viewTransition;
var Style = defaultContext.Style;

// node_modules/hono/dist/helper/css/index.js
var createCssContext2 = /* @__PURE__ */ __name(({
  id,
  classNameSlug,
  onInvalidSlug
}) => {
  const [cssJsxDomObject, StyleRenderToDom] = createCssJsxDomObjects({ id });
  const contextMap = /* @__PURE__ */ new WeakMap();
  const nonceMap = /* @__PURE__ */ new WeakMap();
  const replaceStyleRe = new RegExp(`(<style id="${id}"(?: nonce="[^"]*")?>.*?)(</style>)`);
  const newCssClassNameObject = /* @__PURE__ */ __name((cssClassName) => {
    const appendStyle = /* @__PURE__ */ __name(({ buffer, context }) => {
      const [toAdd, added] = contextMap.get(context);
      const names = Object.keys(toAdd);
      if (!names.length) {
        return;
      }
      let stylesStr = "";
      names.forEach((className2) => {
        added[className2] = true;
        stylesStr += className2.startsWith(PSEUDO_GLOBAL_SELECTOR) ? toAdd[className2] : `${className2[0] === "@" ? "" : "."}${className2}{${toAdd[className2]}}`;
      });
      contextMap.set(context, [{}, added]);
      if (buffer && replaceStyleRe.test(buffer[0])) {
        buffer[0] = buffer[0].replace(replaceStyleRe, (_, pre, post) => `${pre}${stylesStr}${post}`);
        return;
      }
      const nonce = nonceMap.get(context);
      const appendStyleScript = `<script${nonce ? ` nonce="${nonce}"` : ""}>document.querySelector('#${id}').textContent+=${JSON.stringify(stylesStr)}<\/script>`;
      if (buffer) {
        buffer[0] = `${appendStyleScript}${buffer[0]}`;
        return;
      }
      return Promise.resolve(appendStyleScript);
    }, "appendStyle");
    const addClassNameToContext = /* @__PURE__ */ __name(({ context }) => {
      if (!contextMap.has(context)) {
        contextMap.set(context, [{}, {}]);
      }
      const [toAdd, added] = contextMap.get(context);
      let allAdded = true;
      if (!added[cssClassName[SELECTOR]]) {
        allAdded = false;
        toAdd[cssClassName[SELECTOR]] = cssClassName[STYLE_STRING];
      }
      cssClassName[SELECTORS].forEach(
        ({ [CLASS_NAME]: className2, [STYLE_STRING]: styleString }) => {
          if (!added[className2]) {
            allAdded = false;
            toAdd[className2] = styleString;
          }
        }
      );
      if (allAdded) {
        return;
      }
      return Promise.resolve(raw("", [appendStyle]));
    }, "addClassNameToContext");
    const className = new String(cssClassName[CLASS_NAME]);
    Object.assign(className, cssClassName);
    className.isEscaped = true;
    className.callbacks = [addClassNameToContext];
    const promise = Promise.resolve(className);
    Object.assign(promise, cssClassName);
    promise.toString = cssJsxDomObject.toString;
    return promise;
  }, "newCssClassNameObject");
  const css22 = /* @__PURE__ */ __name((strings, ...values) => {
    return newCssClassNameObject(cssCommon(strings, values, classNameSlug, onInvalidSlug));
  }, "css2");
  const cx22 = /* @__PURE__ */ __name((...args) => {
    args = cxCommon(args);
    return css22(Array(args.length).fill(""), ...args);
  }, "cx2");
  const keyframes22 = /* @__PURE__ */ __name((strings, ...values) => keyframesCommon(strings, values, classNameSlug, onInvalidSlug), "keyframes2");
  const viewTransition22 = /* @__PURE__ */ __name(((strings, ...values) => {
    return newCssClassNameObject(
      viewTransitionCommon(strings, values, classNameSlug, onInvalidSlug)
      // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }), "viewTransition2");
  const Style22 = /* @__PURE__ */ __name(({ children, nonce } = {}) => raw(
    `<style id="${id}"${nonce ? ` nonce="${nonce}"` : ""}>${children ? children[STYLE_STRING] : ""}</style>`,
    [
      ({ context }) => {
        nonceMap.set(context, nonce);
        return void 0;
      }
    ]
  ), "Style2");
  Style22[DOM_RENDERER] = StyleRenderToDom;
  return {
    css: css22,
    cx: cx22,
    keyframes: keyframes22,
    viewTransition: viewTransition22,
    Style: Style22
  };
}, "createCssContext");
var defaultContext2 = createCssContext2({
  id: DEFAULT_STYLE_ID
});
var css2 = defaultContext2.css;
var cx2 = defaultContext2.cx;
var keyframes2 = defaultContext2.keyframes;
var viewTransition2 = defaultContext2.viewTransition;
var Style2 = defaultContext2.Style;

// src/views/Login.tsx
var Login = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const signupParams = new URLSearchParams();
  if (props.redirectTo) signupParams.set("redirect_to", props.redirectTo);
  if (props.returnTo) signupParams.set("return_to", props.returnTo);
  const signupQs = signupParams.toString() ? "?" + signupParams.toString() : "";
  const containerClass = css2`
    width: 100%;
    max-width: 550px;
    perspective: 1000px;
  `;
  const cardClass = css2`
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    box-shadow: var(--glass-shadow);
    transform-style: preserve-3d;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: 0.5s;
        pointer-events: none;
    }
    &:hover::before { left: 100%; }
    
    @media (max-width: 480px) {
        padding: 2rem 1.5rem;
        border-radius: 20px;
    }
  `;
  const logoTextClass = css2`
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.05em;
    display: inline-block;
    @media (max-width: 480px) { font-size: 2rem; }
  `;
  const inputGroupClass = css2`
    margin-bottom: 1.5rem;
    position: relative;
    &:focus-within .input-icon { color: var(--primary); }
  `;
  const inputClass = css2`
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    font-size: 1rem;
    color: var(--text-main);
    transition: all 0.3s ease;
    outline: none;
    font-family: inherit;
    &:focus {
        background: #fff;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
    @media (max-width: 480px) { padding: 0.875rem 0.875rem 0.875rem 2.75rem; }
  `;
  const iconClass = css2`
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-sub);
    transition: color 0.3s ease;
    pointer-events: none;
    & svg { width: 20px; height: 20px; }
    @media (max-width: 480px) { left: 0.875rem; }
  `;
  const btnClass = css2`
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    position: relative;
    overflow: hidden;
    font-family: inherit;
    &:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
    &:active { transform: translateY(0); }
  `;
  const linkClass = css2`
    color: var(--text-sub);
    text-decoration: none;
    transition: color 0.2s;
    font-weight: 500;
    &:hover { color: var(--primary); }
  `;
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_login} - ${props.siteName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --text-main: #0f172a;
            --text-sub: #64748b;
            --bg-gradient-start: #e0e7ff;
            --bg-gradient-end: #a5b4fc;
            --glass-bg: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.6);
            --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
            background-size: 200% 200%;
            animation: gradient-animation 15s ease infinite;
            color: var(--text-main);
            padding: 1rem;
        }
        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .error-message { background-color: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 12px; font-size: 0.85rem; text-align: center; margin-bottom: 1.5rem; border: 1px solid #fecaca; }
        .success-message { background-color: #f0fdf4; color: #15803d; padding: 0.75rem; border-radius: 12px; font-size: 0.85rem; text-align: center; margin-bottom: 1.5rem; border: 1px solid #bbf7d0; font-weight: 500; }
      </style>
      ${Style2()}
    </head>
    <body>
      <div class="${containerClass}">
        <div class="${cardClass}">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 class="${logoTextClass}">${props.siteName}</h1>
                <span style="display: block; font-size: 0.875rem; color: var(--text-sub); margin-top: 0.25rem; font-weight: 500; letter-spacing: 0.02em;">
                    ${props.siteSubtitle}
                </span>
            </div>
            
            ${props.error ? html`<div class="error-message">${props.error}</div>` : ""}
            ${props.message ? html`<div class="success-message">${props.message}</div>` : ""}
            
            <form method="POST" action="">
                ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ""}
                ${props.returnTo ? html`<input type="hidden" name="return_to" value="${props.returnTo}" />` : ""}

                <div class="${inputGroupClass}">
                    <input type="email" name="email" autocomplete="username" placeholder="${t.email}" required class="${inputClass}" value="${props.email || ""}">
                    <div class="${iconClass} input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <div class="${inputGroupClass}">
                    <input type="password" name="password" autocomplete="current-password" placeholder="${t.password}" required class="${inputClass}">
                    <div class="${iconClass} input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
                        </svg>
                    </div>
                </div>

                <button type="submit" class="${btnClass}" id="loginBtn">
                    ${t.btn_login}
                </button>
            </form>

            <div style="margin-top: 2rem; text-align: center; font-size: 0.875rem;">
                <p style="margin-bottom: 0.5rem;"><a href="/forgot-password" class="${linkClass}">${t.forgot_password}</a></p>
                <p>${t.no_account} <a href="/signup${signupQs}" class="${linkClass}">${t.signup}</a></p>
            </div>
        </div>
      </div>
    </body>
    </html>
  `;
}, "Login");

// src/views/Signup.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Signup = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const containerClass = css2`
    width: 100%;
    max-width: 550px;
    perspective: 1000px;
  `;
  const cardClass = css2`
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    box-shadow: var(--glass-shadow);
    position: relative;
    overflow: hidden;
    @media (max-width: 480px) {
        padding: 2rem 1.5rem;
        border-radius: 20px;
    }
  `;
  const logoTextClass = css2`
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.05em;
    display: inline-block;
    @media (max-width: 480px) { font-size: 2rem; }
  `;
  const inputGroupClass = css2`
    margin-bottom: 1.5rem;
    position: relative;
    &:focus-within .input-icon { color: var(--primary); }
  `;
  const inputClass = css2`
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    font-size: 1rem;
    color: var(--text-main);
    transition: all 0.3s ease;
    outline: none;
    font-family: inherit;
    &:focus {
        background: #fff;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
    @media (max-width: 480px) { padding: 0.875rem 0.875rem 0.875rem 2.75rem; }
  `;
  const iconClass = css2`
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-sub);
    transition: color 0.3s ease;
    pointer-events: none;
    & svg { width: 20px; height: 20px; }
    @media (max-width: 480px) { left: 0.875rem; }
  `;
  const btnClass = css2`
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    font-family: inherit;
    &:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
    &:active { transform: translateY(0); }
  `;
  const linkClass = css2`
    color: var(--text-sub);
    text-decoration: none;
    transition: color 0.2s;
    font-weight: 500;
    &:hover { color: var(--primary); }
  `;
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_signup} - ${props.siteName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --text-main: #0f172a;
            --text-sub: #64748b;
            --glass-bg: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.6);
            --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
            background-size: 200% 200%;
            animation: gradient-animation 15s ease infinite;
            color: var(--text-main);
            padding: 1rem;
        }
        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .error-message { background-color: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 12px; font-size: 0.85rem; text-align: center; margin-bottom: 1.5rem; border: 1px solid #fecaca; }
      </style>
      ${Style2()}
    </head>
    <body>
      <div class="${containerClass}">
        <div class="${cardClass}">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 class="${logoTextClass}">${props.siteName}</h1>
                <span style="display: block; font-size: 0.875rem; color: var(--text-sub); margin-top: 0.25rem; font-weight: 500; letter-spacing: 0.02em;">
                    ${t.signup_desc}
                </span>
            </div>

            ${props.error ? html`<div class="error-message">${props.error}</div>` : ""}

            <form method="POST" action="/signup">
                ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ""}
                ${props.returnTo ? html`<input type="hidden" name="return_to" value="${props.returnTo}" />` : ""}

                <div class="${inputGroupClass}">
                    <input type="email" name="email" autocomplete="username" placeholder="${t.email}" required class="${inputClass}">
                    <div class="${iconClass} input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <div class="${inputGroupClass}">
                    <input type="password" name="password" autocomplete="new-password" placeholder="${t.password}" required minlength="6" class="${inputClass}">
                    <div class="${iconClass} input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
                        </svg>
                    </div>
                </div>

                <button type="submit" class="${btnClass}">
                    ${t.btn_create_account}
                </button>
            </form>

            <div style="margin-top: 2rem; text-align: center; font-size: 0.875rem;">
                <p>${t.have_account} <a href="/login" class="${linkClass}">${t.btn_login}</a></p>
            </div>
        </div>
      </div>
    </body>
    </html>
  `;
}, "Signup");

// src/views/UserDashboard.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/components/Layout.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a;
var Layout = /* @__PURE__ */ __name((props) => {
  const lang = props.lang || "ja";
  const maxWidth = props.width ? typeof props.width === "number" ? `${props.width}px` : props.width : "550px";
  const siteName = props.siteName || "Tobira";
  const alignTop = props.align === "top";
  const globalStyles = html`
    <style>
      :root {
          --primary: #4f46e5;
          --primary-hover: #4338ca;
          --text-main: #0f172a;
          --text-sub: #64748b;
          --bg-gradient-start: #e0e7ff;
          --bg-gradient-end: #a5b4fc;
          --glass-bg: rgba(255, 255, 255, 0.75);
          --glass-border: rgba(255, 255, 255, 0.6);
          --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
          --error-bg: #fef2f2;
          --error-text: #b91c1c;
          --error-border: #fecaca;
          --success-bg: #f0fdf4;
          --success-text: #15803d;
          --success-border: #bbf7d0;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
          font-family: 'Inter', 'Noto Sans JP', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: ${alignTop ? "flex-start" : "center"};
          justify-content: center;
          background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
          background-size: 200% 200%;
          animation: gradient-animation 15s ease infinite;
          color: var(--text-main);
          padding: ${alignTop ? "2.5rem 1rem" : "1rem"};
      }
      @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
      }
      /* Material Symbols の基底スタイル。これが無いとアイコン名(例: security)が文字列のまま表示される。 */
      .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 20px;
          vertical-align: text-bottom;
          line-height: 1;
      }
    </style>
  `;
  const containerClass = css2`
    width: 100%;
    max-width: ${maxWidth};
    perspective: 1000px;
    margin: 0 auto;
  `;
  const utils = html`
    <style>
      .w-full { width: 100%; }
      .text-center { text-align: center; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mt-4 { margin-top: 1rem; }
      .mt-8 { margin-top: 2rem; }
      a { color: var(--text-sub); text-decoration: none; transition: color 0.2s; font-weight: 500; }
      a:hover { color: var(--primary); }
      .error-message {
          background-color: var(--error-bg);
          color: var(--error-text);
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--error-border);
      }
      .success-message {
          background-color: var(--success-bg);
          color: var(--success-text);
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--success-border);
          font-weight: 500;
      }
    </style>
  `;
  return html(_a || (_a = __template(['\n    <!DOCTYPE html>\n    <html lang="', '">\n    <head>\n      <meta charset="UTF-8">\n      <meta name="viewport" content="width=device-width, initial-scale=1.0">\n      <title>', " - ", '</title>\n      <link rel="preconnect" href="https://fonts.googleapis.com">\n      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">\n      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />\n      ', "\n      ", "\n      ", ' \n    </head>\n    <body>\n       <div class="', '">\n         ', "\n       </div>\n       <script>\n         document.addEventListener('DOMContentLoaded', function() {\n             document.querySelectorAll('.local-time').forEach(function(el) {\n                 var ts = parseInt(el.getAttribute('data-timestamp'));\n                 if (!isNaN(ts)) {\n                     el.textContent = new Date(ts).toLocaleString();\n                 }\n             });\n         });\n       <\/script>\n    </body>\n    </html>\n  "])), lang, props.title, siteName, globalStyles, utils, Style2(), containerClass, props.children);
}, "Layout");

// src/views/components/UserTopbar.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var UserTopbar = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const bar = css2`
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 1.25rem;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    box-shadow: 0 4px 20px -4px rgba(31, 38, 135, 0.18);
  `;
  const brand = css2`
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--primary) !important;
    text-decoration: none;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  `;
  const nav = css2`
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.5rem;

    & a {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-sub);
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }
    & a .material-symbols-outlined { font-size: 19px; }
    & a:hover { background: rgba(255, 255, 255, 0.7); color: var(--primary); }
    & a.active { background: #ffffff; color: var(--primary); box-shadow: 0 2px 6px -2px rgba(0,0,0,0.08); }

    @media (max-width: 560px) {
      & a span:not(.material-symbols-outlined) { display: none; }
    }
  `;
  const right = css2`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.85rem;
  `;
  const avatar = css2`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    color: #fff;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 2px 6px -1px rgba(79, 70, 229, 0.4);
    overflow: hidden;
    & img { width: 100%; height: 100%; object-fit: cover; }
  `;
  const emailText = css2`
    font-size: 0.88rem;
    color: var(--text-sub);
    font-weight: 500;
    @media (max-width: 720px) { display: none; }
  `;
  const logoutBtn = css2`
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-main) !important;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { background: #fff; color: #dc2626 !important; border-color: #fecaca; }
  `;
  const initial = (props.profileName || props.userEmail || "?").trim().charAt(0).toUpperCase();
  return html`
    <header class="${bar}">
      <a href="/" class="${brand}">${props.siteName}</a>
      <nav class="${nav}">
        <a href="/" class="${props.active === "dashboard" ? "active" : ""}">
          <span class="material-symbols-outlined">grid_view</span><span>${t.nav_dashboard}</span>
        </a>
        <a href="/account" class="${props.active === "account" ? "active" : ""}">
          <span class="material-symbols-outlined">manage_accounts</span><span>${t.account_settings}</span>
        </a>
        ${props.isGroupAdmin ? html`
        <a href="/group-admin" class="${props.active === "group-admin" ? "active" : ""}">
          <span class="material-symbols-outlined">admin_panel_settings</span><span>${t.ga_nav}</span>
        </a>
        ` : ""}
      </nav>
      <div class="${right}">
        <div class="${avatar}">
          ${props.profilePicture ? html`<img src="${props.profilePicture}" alt="" />` : html`${initial}`}
        </div>
        <span class="${emailText}">${props.userEmail}</span>
        <a href="/logout" class="${logoutBtn}">
          <span class="material-symbols-outlined">logout</span>${t.logout}
        </a>
      </div>
    </header>
  `;
}, "UserTopbar");

// src/views/UserDashboard.tsx
var UserDashboard = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const welcome = css2`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `;
  const sectionTitle = css2`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    & .material-symbols-outlined { color: var(--primary); }
  `;
  const appGrid = css2`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 1.25rem;
  `;
  const appCardLink = css2`
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 16px;
    &:hover { transform: translateY(-4px); }
  `;
  const appCard = css2`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    padding: 1.4rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 16px -6px rgba(31, 38, 135, 0.18);
    transition: border-color 0.2s;
    ${appCardLink}:hover & { border-color: var(--primary); }
  `;
  const appIcon = css2`
    width: 44px; height: 44px;
    border-radius: 10px;
    object-fit: contain;
    background: #fff;
    padding: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    flex-shrink: 0;
  `;
  const appIconFallback = css2`
    width: 44px; height: 44px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    color: var(--primary);
    & .material-symbols-outlined { font-size: 24px; }
  `;
  const appName = css2`font-size: 1.15rem; font-weight: 700; color: var(--text-main); line-height: 1.2;`;
  const appDesc = css2`font-size: 0.88rem; color: var(--text-sub); margin: 0.85rem 0; line-height: 1.45;`;
  const appUrl = css2`font-size: 0.8rem; color: var(--text-sub); opacity: 0.7; word-break: break-all;`;
  const launch = css2`
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.9rem; font-weight: 700; color: var(--primary);
    & .material-symbols-outlined { font-size: 18px; transition: transform 0.2s; }
    ${appCardLink}:hover & .material-symbols-outlined { transform: translateX(3px); }
  `;
  const emptyState = css2`
    text-align: center;
    padding: 3.5rem 2rem;
    background: rgba(255, 255, 255, 0.5);
    border: 1px dashed rgba(79, 70, 229, 0.25);
    border-radius: 16px;
    color: var(--text-sub);
    & .material-symbols-outlined { font-size: 44px; color: #c7d2fe; margin-bottom: 0.5rem; }
  `;
  const displayName = props.profileName || props.userEmail;
  return Layout({
    title: t.title_user_dashboard,
    siteName: props.siteName,
    lang: t.lang,
    width: 960,
    align: "top",
    children: html`
        ${UserTopbar({
      t,
      siteName: props.siteName,
      userEmail: props.userEmail,
      active: "dashboard",
      profileName: props.profileName,
      profilePicture: props.profilePicture,
      isGroupAdmin: props.isGroupAdmin
    })}

        <div class="${welcome}">
          <h1>${t.dashboard_welcome.replace("{email}", displayName)}</h1>
          <p>${props.siteName}</p>
        </div>

        <section>
          <div class="${sectionTitle}">
            <span class="material-symbols-outlined">apps</span>
            ${t.dashboard_apps_header}
          </div>

          ${props.apps.length === 0 ? html`
            <div class="${emptyState}">
              <div><span class="material-symbols-outlined">apps</span></div>
              <p>${t.no_apps_assigned}</p>
            </div>
          ` : html`
            <div class="${appGrid}">
              ${props.apps.map((app2) => html`
                <a href="/login?redirect_to=${app2.base_url}" class="${appCardLink}">
                  <div class="${appCard}">
                    <div>
                      <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:0.5rem;">
                        ${app2.icon_url ? html`<img src="${app2.icon_url}" class="${appIcon}" alt="" />` : html`<div class="${appIconFallback}"><span class="material-symbols-outlined">widgets</span></div>`}
                        <div class="${appName}">${app2.name}</div>
                      </div>
                      ${app2.description ? html`<div class="${appDesc}">${app2.description}</div>` : ""}
                      <div class="${appUrl}">${app2.base_url}</div>
                    </div>
                    <div style="text-align:right; margin-top:1.1rem;">
                      <span class="${launch}">${t.btn_open_app} <span class="material-symbols-outlined">arrow_forward</span></span>
                    </div>
                  </div>
                </a>
              `)}
            </div>
          `}
        </section>
    `
  });
}, "UserDashboard");

// src/views/AccountPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/components/Modal.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Modal = /* @__PURE__ */ __name(({ id, title: title3, closeAction, closeBtnId, children }) => {
  const modalIn = keyframes2`
        from { opacity: 0; transform: translateY(-10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    `;
  const dialogClass = css2`
        background: transparent;
        padding: 0;
        border: none;
        z-index: 1000;
        max-width: 100%;
        max-height: 100%;

        &::backdrop {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
        }
        
        & > article {
            background: rgba(255, 255, 255, 0.98) !important;
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: ${modalIn} 0.25s ease-out;
            
            width: min(750px, 95vw) !important;
            max-width: 750px !important;
            margin: 2rem auto; 
            padding: 0 !important; 
            
            overflow: hidden; 
            border-radius: 16px !important;
            color: #0f172a;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        & form { margin-bottom: 0; }
        & form label { margin-bottom: 0.5rem; font-weight:600; color:#334155; }
        & form input { margin-bottom: 1rem; }
    `;
  const headerClass = css2`
        padding: 1.25rem 1.5rem; 
        background: #f1f5f9; 
        border-bottom: 1px solid #e2e8f0; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        flex-shrink: 0;
        
        margin: 0 !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    `;
  const titleClass = css2`
        font-size: 1.15rem; 
        font-weight: 700; 
        color: #1e293b;
        margin: 0;
        line-height: 1.4;
    `;
  const bodyClass = css2`
        padding: 2rem; 
        overflow-y: auto; 
        max-height: 70vh; 
    `;
  const closeBtnClass = css2`
        background: transparent !important; 
        border: none !important; 
        color: #64748b !important; 
        cursor: pointer !important; 
        padding: 4px !important; 
        border-radius: 50% !important; 
        transition: all 0.2s !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 32px !important;
        height: 32px !important;
        text-decoration: none;
        margin: 0 !important;

        &:hover { 
            background: #e2e8f0 !important; 
            color: #0f172a !important; 
        }
    `;
  return html`
    <dialog id="${id}" class="${dialogClass}" 
        onmousedown="this.dataset.md=(event.target===this)" 
        onclick="if(event.target===this && this.dataset.md==='true') { ${closeAction} }">
        <article>
            <header class="${headerClass}">
                <div class="${titleClass}">${title3}</div>
                <a href="#close" 
                   ${closeBtnId ? html`id="${closeBtnId}"` : ""} 
                   aria-label="Close" 
                   class="${closeBtnClass}" 
                   onclick="${closeAction}">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </a>
            </header>
            <div class="${bodyClass}">
                ${children}
            </div>
        </article>
    </dialog>
    `;
}, "Modal");

// src/views/AccountPage.tsx
var AccountPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const pageHead = css2`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem; font-weight: 800; color: var(--text-main);
      letter-spacing: -0.02em; margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `;
  const card = css2`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 20px -6px rgba(31, 38, 135, 0.18);
  `;
  const cardHead = css2`
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 1.4rem;
    & .material-symbols-outlined {
      color: var(--primary);
      background: #eef2ff;
      border-radius: 10px;
      padding: 6px;
      font-size: 22px;
    }
    & h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    & p { font-size: 0.85rem; color: var(--text-sub); margin-top: 0.1rem; }
  `;
  const avatarRow = css2`
    display: flex; align-items: center; gap: 1.1rem; margin-bottom: 1.5rem;
  `;
  const bigAvatar = css2`
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.9rem; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.45);
    overflow: hidden; flex-shrink: 0;
    & img { width: 100%; height: 100%; object-fit: cover; }
  `;
  const field = css2`
    display: block; margin-bottom: 1.1rem;
    & .lbl { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.4rem; }
    & input {
      width: 100%; padding: 0.7rem 0.9rem;
      border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 0.95rem; color: var(--text-main); background: #fff;
      transition: all 0.2s;
    }
    & input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
  `;
  const primaryBtn = css2`
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #fff; border: none; border-radius: 10px;
    padding: 0.6rem 1.3rem; font-size: 0.92rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(79,70,229,0.25); transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 14px -3px rgba(79,70,229,0.35); }
  `;
  const secRow = css2`
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    padding: 1rem 0;
    & + & { border-top: 1px solid rgba(0,0,0,0.06); }
  `;
  const secInfo = css2`
    & .ttl { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main); }
    & .ttl .material-symbols-outlined { font-size: 20px; color: var(--text-sub); }
    & .sub { font-size: 0.82rem; color: var(--text-sub); margin-top: 0.2rem; }
  `;
  const badgeOn = css2`color:#16a34a; background:#dcfce7; padding:2px 10px; border-radius:99px; font-size:0.8rem; font-weight:700;`;
  const badgeOff = css2`color:#64748b; background:#f1f5f9; padding:2px 10px; border-radius:99px; font-size:0.8rem; font-weight:700;`;
  const ghostBtn = css2`
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(255,255,255,0.7); border: 1px solid #cbd5e1; border-radius: 10px;
    padding: 0.5rem 1rem; font-size: 0.88rem; font-weight: 600; color: var(--text-main) !important;
    text-decoration: none; cursor: pointer; transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { border-color: var(--primary); color: var(--primary) !important; background: #fff; }
  `;
  const dangerBtn = css2`
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: #fff; border: 1px solid #fecaca; border-radius: 10px;
    padding: 0.5rem 1rem; font-size: 0.88rem; font-weight: 600; color: #dc2626; cursor: pointer; transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { background: #fef2f2; }
  `;
  const successBanner = css2`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--success-bg); color: var(--success-text);
    border: 1px solid var(--success-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `;
  const initial = (props.profileName || props.userEmail || "?").trim().charAt(0).toUpperCase();
  return Layout({
    title: t.account_settings,
    siteName: props.siteName,
    lang: t.lang,
    width: 760,
    align: "top",
    children: html`
        ${UserTopbar({
      t,
      siteName: props.siteName,
      userEmail: props.userEmail,
      active: "account",
      profileName: props.profileName,
      profilePicture: props.profilePicture
    })}

        <div class="${pageHead}">
          <h1>${t.account_settings}</h1>
          <p>${t.account_subtitle}</p>
        </div>

        ${props.message ? html`
          <div class="${successBanner}">
            <span class="material-symbols-outlined">check_circle</span>${props.message}
          </div>` : ""}

        <!-- プロフィール -->
        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">badge</span>
            <div>
              <h2>${t.profile_header}</h2>
              <p>${t.profile_hint}</p>
            </div>
          </div>

          <form method="POST" action="/user/profile">
            <div class="${avatarRow}">
              <div class="${bigAvatar}">
                ${props.profilePicture ? html`<img src="${props.profilePicture}" alt="" />` : html`${initial}`}
              </div>
              <div style="font-size:0.85rem; color:var(--text-sub);">${props.userEmail}</div>
            </div>

            <label class="${field}">
              <span class="lbl">${t.label_name}</span>
              <input type="text" name="name" value="${props.profileName || ""}" placeholder="${props.userEmail}" />
            </label>
            <label class="${field}">
              <span class="lbl">${t.label_preferred_username}</span>
              <input type="text" name="preferred_username" value="${props.profileUsername || ""}" placeholder="${props.userEmail}" />
            </label>
            <label class="${field}">
              <span class="lbl">${t.label_picture}</span>
              <input type="url" name="picture" value="${props.profilePicture || ""}" placeholder="https://..." />
            </label>
            <div style="text-align:right;">
              <button type="submit" class="${primaryBtn}"><span class="material-symbols-outlined">save</span>${t.save}</button>
            </div>
          </form>
        </section>

        <!-- セキュリティ -->
        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">shield</span>
            <div><h2>${t.security_header}</h2></div>
          </div>

          <div class="${secRow}">
            <div class="${secInfo}">
              <div class="ttl"><span class="material-symbols-outlined">encrypted</span>${t.label_2fa_status}
                ${props.has2FA ? html`<span class="${badgeOn}">${t.status_enabled}</span>` : html`<span class="${badgeOff}">${t.status_disabled}</span>`}
              </div>
              <div class="sub">${t.desc_2fa_account}</div>
            </div>
            <div>
              ${props.has2FA ? html`<button type="button" class="${dangerBtn}" onclick="document.getElementById('disable-2fa-modal').showModal()"><span class="material-symbols-outlined">lock_open</span>${t.btn_disable_2fa}</button>` : html`<a href="/user/2fa/setup" class="${primaryBtn}"><span class="material-symbols-outlined">add_moderator</span>${t.btn_setup_2fa}</a>`}
            </div>
          </div>

          <div class="${secRow}">
            <div class="${secInfo}">
              <div class="ttl"><span class="material-symbols-outlined">key</span>${t.header_change_password}</div>
            </div>
            <div>
              <a href="/change-password" class="${ghostBtn}"><span class="material-symbols-outlined">key</span>${t.btn_change_password}</a>
            </div>
          </div>
        </section>

        ${Modal({
      id: "disable-2fa-modal",
      title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.btn_disable_2fa}</span>`,
      closeAction: "this.closest('dialog').close()",
      children: html`
            <form id="disable-2fa-form" method="POST" action="/user/2fa/disable" style="margin:0;">
              <div style="margin-bottom: 2rem;">
                <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_disable_2fa}</p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" onclick="this.closest('dialog').close()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                <button type="submit" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span class="material-symbols-outlined" style="font-size:18px;">check</span> ${t.btn_disable_2fa}
                </button>
              </div>
            </form>
          `
    })}
    `
  });
}, "AccountPage");

// src/views/Invite.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/components/Card.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Card = /* @__PURE__ */ __name((props) => {
  const cardClass = css2`
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    box-shadow: var(--glass-shadow);
    transform-style: preserve-3d;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
        );
        transition: 0.5s;
        pointer-events: none;
    }

    &:hover::before {
        left: 100%;
    }

    @media (max-width: 480px) {
        padding: 2rem 1.5rem;
        border-radius: 20px;
    }
  `;
  return html`
    <div class="${cardClass}">
        ${props.children}
    </div>
  `;
}, "Card");

// src/views/components/Input.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Input = /* @__PURE__ */ __name((props) => {
  const groupClass = css2`
    margin-bottom: 1.5rem;
    position: relative;
  `;
  const inputClass = css2`
    width: 100%;
    padding: 1rem 1rem 1rem 3rem; 
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    font-size: 1rem;
    color: var(--text-main);
    transition: all 0.3s ease;
    outline: none;
    font-family: inherit;

    &:focus {
        background: #fff;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
    
    @media (max-width: 480px) {
        padding: 0.875rem 0.875rem 0.875rem 2.75rem;
    }
  `;
  const iconClass = css2`
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-sub);
    transition: color 0.3s ease;
    pointer-events: none;
    display: flex;
    align-items: center;
    
    & svg { width: 20px; height: 20px; }
  `;
  const groupFocusClass = css2`
    ${groupClass}
    &:focus-within .input-icon {
        color: var(--primary);
    }
  `;
  const iconClassFinal = css2`
    ${iconClass}
    @media (max-width: 480px) { left: 0.875rem; }
  `;
  return html`
    <div class="${groupFocusClass}">
        <input 
            class="${inputClass}"
            type="${props.type}" 
            name="${props.name}" 
            placeholder="${props.placeholder || ""}" 
            ${props.required ? "required" : ""} 
            value="${props.value || ""}"
        />
        ${props.icon ? html`<div class="${iconClassFinal} input-icon">${props.icon}</div>` : ""}
    </div>
    `;
}, "Input");

// src/views/components/Button.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Button = /* @__PURE__ */ __name((props) => {
  const variant = props.variant || "primary";
  const baseBtn = css2`
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    line-height: 1.2;
    text-decoration: none;
    box-sizing: border-box;
  `;
  const primary = css2`
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }
    &:active {
        transform: translateY(0);
    }
  `;
  const outline = css2`
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #64748b;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:hover {
        border-color: #4f46e5;
        color: #4f46e5;
        background: #eff6ff;
        box-shadow: none;
    }
  `;
  const variantClass = variant === "outline" ? outline : primary;
  return html`
    <button 
        type="${props.type || "button"}" 
        class="${baseBtn} ${variantClass} ${props.className || ""}" 
        id="${props.id || ""}"
        onclick="${props.onclick || ""}"
        style="${props.style || ""}"
    >
        ${props.children}
    </button>
    `;
}, "Button");

// src/views/Invite.tsx
var Invite = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const passwordIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
  `;
  return Layout({
    title: t.title_invite,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.title_invite}</h1>
        </div>
          
        ${props.error ? html`<div class="error-message">${props.error}</div>` : ""}
          
        ${props.token ? html`
            <p style="text-align:center; margin-bottom:1.5rem; color: var(--text-sub);">
                ${t.setup_desc} <strong style="color: var(--text-main);">${props.email}</strong>
            </p>
            <form method="POST" action="/invite" style="margin-bottom:0">
              <input type="hidden" name="token" value="${props.token}" />
              ${Input({ type: "password", name: "password", placeholder: t.label_new_password, required: true, icon: passwordIcon })}
              ${Button({ type: "submit", children: t.btn_create_account })}
            </form>
        ` : html`
             <div style="text-align:center; padding:2rem 0; color: var(--text-sub);">
                <p>Invalid or expired invitation link.</p>
                <div style="margin-top: 1.5rem;">
                    <a href="/login" class="nav-item">Back to Login</a>
                </div>
             </div>
        `}
        `
    })
  });
}, "Invite");

// src/views/ForgotPassword.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var ForgotPassword = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const description = t.lang === "ja" ? "\u767B\u9332\u3057\u305F\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002<br>\u30EA\u30BB\u30C3\u30C8\u30EA\u30F3\u30AF\u3092\u9001\u4FE1\u3057\u307E\u3059\u3002" : "Enter your email address to receive a reset link.";
  const emailIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
`;
  return Layout({
    title: t.title_forgot,
    lang: t.lang,
    children: Card({
      children: html`
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.title_forgot}</h1>
          </div>
          
          ${props.message ? html`<div class="success-message">${props.message}</div>` : ""}
          
          <p style="font-size:0.9rem; color:var(--text-sub); margin-bottom:1.5rem; text-align:center;">
             ${raw(description)}
          </p>

          <form method="POST" action="/forgot-password" style="margin-bottom:0">
            ${Input({ type: "email", name: "email", placeholder: t.email, required: true, icon: emailIcon })}
            ${Button({ type: "submit", children: t.btn_send_link })}
          </form>
          
          <div style="text-align:center; margin-top:2rem;">
            <a href="/login" style="text-decoration:none; font-size:0.9rem;">← ${t.back_to_login}</a>
          </div>
      `
    })
  });
}, "ForgotPassword");

// src/views/ResetPassword.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var ResetPassword = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const passwordIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
  `;
  return Layout({
    title: t.title_forgot,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.title_forgot}</h1>
        </div>

        ${props.error ? html`<div class="error-message">${props.error}</div>` : ""}

        <form method="POST" action="/reset-password">
          <input type="hidden" name="token" value="${props.token}" />
          ${Input({ type: "password", name: "password", placeholder: t.label_new_password, required: true, icon: passwordIcon })}
          ${Button({ type: "submit", children: t.btn_reset_password })}
        </form>
        `
    })
  });
}, "ResetPassword");

// src/views/ChangePassword.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var ChangePassword = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const pageHead = css2`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem; font-weight: 800; color: var(--text-main);
      letter-spacing: -0.02em; margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `;
  const card = css2`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 20px -6px rgba(31, 38, 135, 0.18);
  `;
  const cardHead = css2`
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 1.4rem;
    & .material-symbols-outlined {
      color: var(--primary);
      background: #eef2ff;
      border-radius: 10px;
      padding: 6px;
      font-size: 22px;
    }
    & h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    & p { font-size: 0.85rem; color: var(--text-sub); margin-top: 0.1rem; }
  `;
  const field = css2`
    display: block; margin-bottom: 1.1rem;
    & .lbl { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.4rem; }
    & input {
      width: 100%; padding: 0.7rem 0.9rem;
      border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 0.95rem; color: var(--text-main); background: #fff;
      transition: all 0.2s;
    }
    & input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
  `;
  const primaryBtn = css2`
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #fff; border: none; border-radius: 10px;
    padding: 0.6rem 1.3rem; font-size: 0.92rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(79,70,229,0.25); transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 14px -3px rgba(79,70,229,0.35); }
  `;
  const backLink = css2`
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.9rem; font-weight: 600; color: var(--text-sub) !important; text-decoration: none;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { color: var(--primary) !important; }
  `;
  const successBanner = css2`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--success-bg); color: var(--success-text);
    border: 1px solid var(--success-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `;
  const errorBanner = css2`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--error-bg); color: var(--error-text);
    border: 1px solid var(--error-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `;
  return Layout({
    title: t.title_change_password,
    siteName: props.siteName,
    lang: t.lang,
    width: 760,
    align: "top",
    children: html`
        ${UserTopbar({
      t,
      siteName: props.siteName,
      userEmail: props.userEmail,
      active: "account",
      profileName: props.profileName,
      profilePicture: props.profilePicture
    })}

        <div class="${pageHead}">
          <h1>${t.header_change_password}</h1>
          <p>${t.account_subtitle}</p>
        </div>

        ${props.message ? html`
          <div class="${successBanner}">
            <span class="material-symbols-outlined">check_circle</span>${props.message}
          </div>` : ""}
        ${props.error ? html`
          <div class="${errorBanner}">
            <span class="material-symbols-outlined">error</span>${props.error}
          </div>` : ""}

        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">key</span>
            <div>
              <h2>${t.header_change_password}</h2>
              <p>${t.desc_change_password}</p>
            </div>
          </div>

          <form method="POST" action="/change-password">
            <label class="${field}">
              <span class="lbl">${t.label_new_password}</span>
              <input type="password" name="password" autocomplete="new-password" required placeholder="••••••••" />
            </label>
            <div style="text-align:right;">
              <button type="submit" class="${primaryBtn}"><span class="material-symbols-outlined">save</span>${t.save}</button>
            </div>
          </form>
        </section>

        <a href="/account" class="${backLink}">
          <span class="material-symbols-outlined">arrow_back</span>${t.back_to_account}
        </a>
    `
  });
}, "ChangePassword");

// src/views/Setup2FA.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Setup2FA = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const pageHead = css2`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem; font-weight: 800; color: var(--text-main);
      letter-spacing: -0.02em; margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `;
  const card = css2`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 20px -6px rgba(31, 38, 135, 0.18);
  `;
  const cardHead = css2`
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 1.4rem;
    & .material-symbols-outlined {
      color: var(--primary);
      background: #eef2ff;
      border-radius: 10px;
      padding: 6px;
      font-size: 22px;
    }
    & h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    & p { font-size: 0.85rem; color: var(--text-sub); margin-top: 0.1rem; }
  `;
  const qrBlock = css2`
    text-align: center; margin-bottom: 1.5rem;
    & .qr {
      background: #fff; padding: 1rem; display: inline-block;
      border-radius: 12px; border: 1px solid #e2e8f0;
    }
    & .qr img { display: block; width: 200px; height: 200px; }
    & .secret {
      margin-top: 1rem; font-family: monospace; background: #f1f5f9;
      padding: 0.6rem 0.8rem; border-radius: 8px; font-size: 0.9rem;
      word-break: break-all; color: var(--text-main);
    }
    & .secret-label { font-size: 0.8rem; color: var(--text-sub); margin-top: 0.4rem; }
  `;
  const field = css2`
    display: block; margin-bottom: 1.1rem;
    & .lbl { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.4rem; }
    & input {
      width: 100%; padding: 0.7rem 0.9rem;
      border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 1.1rem; letter-spacing: 0.3em; text-align: center;
      color: var(--text-main); background: #fff; transition: all 0.2s;
    }
    & input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
  `;
  const primaryBtn = css2`
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #fff; border: none; border-radius: 10px;
    padding: 0.6rem 1.3rem; font-size: 0.92rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(79,70,229,0.25); transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 14px -3px rgba(79,70,229,0.35); }
  `;
  const backLink = css2`
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.9rem; font-weight: 600; color: var(--text-sub) !important; text-decoration: none;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { color: var(--primary) !important; }
  `;
  const errorBanner = css2`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--error-bg); color: var(--error-text);
    border: 1px solid var(--error-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `;
  return Layout({
    title: t.title_setup_2fa,
    siteName: props.siteName,
    lang: t.lang,
    width: 760,
    align: "top",
    children: html`
        ${UserTopbar({
      t,
      siteName: props.siteName,
      userEmail: props.userEmail,
      active: "account",
      profileName: props.profileName,
      profilePicture: props.profilePicture
    })}

        <div class="${pageHead}">
          <h1>${t.header_setup_2fa}</h1>
          <p>${t.account_subtitle}</p>
        </div>

        ${props.error ? html`
          <div class="${errorBanner}">
            <span class="material-symbols-outlined">error</span>${props.error}
          </div>` : ""}

        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">add_moderator</span>
            <div>
              <h2>${t.header_setup_2fa}</h2>
              <p>${t.desc_setup_2fa}</p>
            </div>
          </div>

          <div class="${qrBlock}">
            <div class="qr"><img src="${props.qrCodeDataUrl}" alt="QR Code" /></div>
            <div class="secret">${props.secret}</div>
            <div class="secret-label">${t.label_secret_key}</div>
          </div>

          <form method="POST" action="">
            <input type="hidden" name="secret" value="${props.secret}" />
            <label class="${field}">
              <span class="lbl">${t.btn_setup_2fa}</span>
              <input type="text" name="token" inputmode="numeric" autocomplete="one-time-code" required placeholder="000000" />
            </label>
            <div style="text-align:right;">
              <button type="submit" class="${primaryBtn}"><span class="material-symbols-outlined">check</span>${t.btn_setup_2fa}</button>
            </div>
          </form>
        </section>

        <a href="/account" class="${backLink}">
          <span class="material-symbols-outlined">arrow_back</span>${t.back_to_account}
        </a>
    `
  });
}, "Setup2FA");

// src/views/Login2FA.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var Login2FA = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  return Layout({
    title: t.title_2fa_verify,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.header_2fa_verify}</h1>
        </div>

        ${props.error ? html`<div class="error-message">${props.error}</div>` : ""}

        <p style="text-align: center; color: var(--text-sub); margin-bottom: 1.5rem;">
            ${t.desc_2fa_verify}
        </p>

        <form method="POST" action="">
            ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ""}
            ${props.returnTo ? html`<input type="hidden" name="return_to" value="${props.returnTo}" />` : ""}
            ${Input({ type: "text", name: "token", placeholder: "000000", required: true, icon: html`<span class="material-symbols-outlined">lock</span>`, value: "" })}
            ${Button({ type: "submit", children: t.btn_verify })}
        </form>

        <div style="text-align:center; margin-top:1.5rem;">
            <a href="/login" style="font-size:0.9rem;">${t.back_to_login}</a>
        </div>
      `
    })
  });
}, "Login2FA");

// src/views/GroupAdminPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/components/MultiSelect.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var MultiSelect = /* @__PURE__ */ __name((props) => {
  const wrapperClass = css2`
    width: 100%;
    
    /* Base Control */
    & .ts-control {
        background-color: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        padding: 6px 10px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        font-size: 1rem !important;
        min-height: 3rem !important; /* Changed to 3rem */
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 6px !important;
        transition: all 0.2s;
    }

    /* Input Field inside Control */
    & .ts-wrapper .ts-control > input,
    & .ts-wrapper.multi .ts-control > input,
    & .ts-wrapper.single .ts-control > input,
    & div.ts-control > input {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        flex: 1 1 auto !important;
        min-width: 4rem !important;
        display: inline-block !important;
        height: auto !important;
        line-height: inherit !important;
        border-radius: 0 !important;
    }

    /* Focus State */
    & .ts-wrapper.focus .ts-control {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        z-index: 2;
    }

    /* Selected Items (Badges) */
    & .ts-wrapper.multi .ts-control > div.item {
        background: #eff6ff !important;
        color: #4f46e5 !important;
        border: 1px solid #c7d2fe !important;
        border-radius: 6px !important;
        padding: 4px 8px !important;
        margin: 0 !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        display: flex !important;
        align-items: center !important;
        line-height: 1.2 !important;
        box-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }
    
    /* Remove Button in Badge */
    & .ts-wrapper.multi .ts-control > div.item .remove {
        border-left: 1px solid #c7d2fe !important;
        margin-left: 6px !important;
        padding-left: 6px !important;
        font-size: 1rem !important;
        color: #4f46e5 !important;
        opacity: 0.7;
    }
    & .ts-wrapper.multi .ts-control > div.item .remove:hover {
        opacity: 1;
        background: transparent !important;
    }

    /* Dropdown Menu */
    & .ts-dropdown {
        border-radius: 8px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border: 1px solid #e2e8f0 !important;
        z-index: 20000 !important;
        font-size: 1rem !important;
        margin-top: 4px !important;
        overflow: hidden !important;
    }

    & .ts-dropdown .option {
        padding: 10px 16px !important;
        cursor: pointer !important;
        color: #334155 !important;
    }

    & .ts-dropdown .option.active, 
    & .ts-dropdown .active {
        background-color: #f1f5f9 !important;
        color: var(--primary) !important;
        font-weight: 600 !important;
    }
    
    /* Placeholder */
    & .ts-wrapper .ts-control .input-placeholder {
        color: #94a3b8 !important;
    }
  `;
  return html`
    <div class="${wrapperClass}" style="${props.style || ""}">
      <select 
        id="${props.id}" 
        name="${props.name || ""}" 
        multiple 
        autocomplete="off" 
        placeholder="${props.placeholder || "Select..."}"
        ${props.required ? "required" : ""}
        style="display:none;" 
      >
        <option value="">${props.placeholder || "Select..."}</option>
        ${props.options.map((opt) => {
    const isSelected = props.selectedValues?.includes(opt.value) ? "selected" : "";
    return html`<option value="${opt.value}" ${isSelected}>${opt.text}</option>`;
  })}
      </select>
    </div>
  `;
}, "MultiSelect");

// src/views/GroupAdminPage.tsx
var _a2;
var GroupAdminPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const groups = props.managedGroups;
  const userOptions = props.allUsers.map((u) => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email
  }));
  const allUsersJson = JSON.stringify(userOptions);
  const membersByGroupJson = JSON.stringify(props.membersByGroup);
  const assignmentsByGroupJson = JSON.stringify(props.assignmentsByGroup);
  const permsByGroupJson = JSON.stringify(props.permissionsByGroup);
  const sectionTitle = css2`
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    & .material-symbols-outlined { color: var(--primary); }
  `;
  const card = css2`
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 16px;
    box-shadow: 0 4px 16px -6px rgba(31,38,135,0.18);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  `;
  const tabBar = css2`
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1.75rem;
    background: rgba(255,255,255,0.5);
    border-radius: 12px;
    padding: 0.35rem;
    & button {
      flex: 1;
      padding: 0.65rem 1rem;
      border: none !important;
      border-radius: 9px;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-sub);
      background: transparent !important;
      box-shadow: none !important;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      & .material-symbols-outlined { font-size: 19px; }
    }
    & button:hover { background: rgba(255,255,255,0.7) !important; color: var(--primary); }
    & button.active { background: #fff !important; color: var(--primary); box-shadow: 0 2px 6px -2px rgba(0,0,0,0.1) !important; }
  `;
  const groupSelect = css2`
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-main);
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    background: rgba(255,255,255,0.9) !important;
    padding: 0.7rem 1rem !important;
    margin-bottom: 1.5rem;
    width: auto !important;
    cursor: pointer;
  `;
  const badge = css2`
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  `;
  const tableWrap = css2`
    overflow-x: auto;
    & table { width: 100%; border-collapse: separate; border-spacing: 0 0.4rem; }
    & th { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-sub); padding: 0.4rem 0.75rem; border-bottom: none; }
    & td { background: rgba(255,255,255,0.5); padding: 0.8rem 0.75rem; font-size: 0.92rem; vertical-align: middle; border: none; }
    & td:first-child { border-radius: 10px 0 0 10px; }
    & td:last-child { border-radius: 0 10px 10px 0; }
  `;
  const formLabel = css2`display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.4rem;`;
  const dateInput = css2`
    width: 100%; padding: 0.7rem 1rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155;
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  `;
  const infoBox = css2`
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    background: rgba(79,70,229,0.06);
    border: 1px solid rgba(79,70,229,0.15);
    border-radius: 10px;
    font-size: 0.88rem;
    color: var(--text-sub);
    margin-bottom: 1rem;
    & .material-symbols-outlined { color: var(--primary); font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  `;
  const actionBtn = css2`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
    padding: 7px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    width: 34px !important; height: 34px !important; flex-shrink: 0 !important;
    &:hover { background: #fef2f2 !important; color: #ef4444 !important; }
  `;
  const scriptContent = raw(`
    (function() {
      var membersByGroup = null;
      var assignsByGroup = null;
      var permsByGroup = null;
      var currentTab = 'members';
      var currentGroupId = '';

      document.addEventListener('DOMContentLoaded', function() {
        var md = document.getElementById('ga-members-data');
        var ad = document.getElementById('ga-assigns-data');
        var pd = document.getElementById('ga-perms-data');
        if (md) membersByGroup = JSON.parse(md.textContent);
        if (ad) assignsByGroup = JSON.parse(ad.textContent);
        if (pd) permsByGroup = JSON.parse(pd.textContent);

        var sel = document.getElementById('group-select');
        if (sel && sel.value) {
          currentGroupId = sel.value;
          renderAll();
        }
        if (typeof TomSelect !== 'undefined') {
          var el = document.getElementById('m-user-id');
          if (el) {
            window.tsCtrl = new TomSelect('#m-user-id', { plugins: ['remove_button'], create: false, maxItems: null });
          }
        }
      });

      window.switchGroup = function() {
        var sel = document.getElementById('group-select');
        currentGroupId = sel ? sel.value : '';
        renderAll();
      };

      window.switchTab = function(tab) {
        currentTab = tab;
        ['members', 'assignments', 'access'].forEach(function(t) {
          var btn = document.getElementById('tab-btn-' + t);
          var pane = document.getElementById('tab-' + t);
          if (btn) btn.className = btn.className.replace(' active', '') + (t === tab ? ' active' : '');
          if (pane) pane.style.display = t === tab ? '' : 'none';
        });
      };

      function renderAll() {
        renderMembers();
        renderAssignments();
        renderPerms();
      }

      function fmt(ts) {
        if (!ts) return '\u2014';
        if (ts > 2000000000) return '\u7121\u671F\u9650';
        return new Date(ts * 1000).toLocaleDateString();
      }

      function renderMembers() {
        var el = document.getElementById('members-table-body');
        if (!el) return;
        var list = membersByGroup && currentGroupId ? (membersByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noMembers || '(\u30E1\u30F3\u30D0\u30FC\u306A\u3057)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(m) {
          var isAdmin = m.role === 'group_admin';
          var badgeHtml = '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + (isAdmin ? '#9a3412' : '#475569') + '; background:' + (isAdmin ? '#ffedd5' : '#f1f5f9') + ';">' + (isAdmin ? (window.i18n.roleAdmin || '\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406\u8005') : (window.i18n.roleMember || '\u30E1\u30F3\u30D0\u30FC')) + '</span>';
          var displayName = m.name || m.email;
          var subEmail = m.name ? ('<div style="font-size:0.8rem; color:#94a3b8;">' + m.email + '</div>') : '';
          return '<tr>'
            + '<td><div>' + displayName + '</div>' + subEmail + '</td>'
            + '<td>' + badgeHtml + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + fmt(m.valid_from) + ' \uFF5E ' + fmt(m.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeMember(' + m.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='#fef2f2';this.style.color='#ef4444';" onmouseout="this.style.background='transparent';this.style.color='#94a3b8';"><span class=\\"material-symbols-outlined\\" style=\\"font-size:18px;\\">person_remove</span></button></td>'
            + '</tr>';
        }).join('');
      }

      function renderAssignments() {
        var el = document.getElementById('assigns-table-body');
        if (!el) return;
        var list = assignsByGroup && currentGroupId ? (assignsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAssignments || '\u5272\u5F53\u304C\u3042\u308A\u307E\u305B\u3093') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var facility = a.structure_no || a.facility_id;
          if (a.building_use) facility += ' (' + a.building_use + ')';
          var user = a.user_name || a.user_email;
          return '<tr>'
            + '<td>' + user + (a.user_name ? '<div style="font-size:0.8rem;color:#94a3b8;">' + a.user_email + '</div>' : '') + '</td>'
            + '<td style="font-size:0.88rem;">' + a.service_name + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + facility + '</td>'
            + '<td style="font-size:0.85rem;">' + a.role_name + '</td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(a.valid_from) + ' \uFF5E ' + fmt(a.valid_to) + '</td>'
            + '</tr>';
        }).join('');
      }

      function renderPerms() {
        var el = document.getElementById('perms-table-body');
        if (!el) return;
        var list = permsByGroup && currentGroupId ? (permsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAccess || '\u30A2\u30AF\u30BB\u30B9\u6A29\u304C\u3042\u308A\u307E\u305B\u3093') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(p) {
          var srcLabel = p.source === 'user' ? (window.i18n.srcUser || '\u30E6\u30FC\u30B6\u30FC\u500B\u5225') : (window.i18n.srcGroup || '\u30B0\u30EB\u30FC\u30D7');
          var srcColor = p.source === 'user' ? '#1d4ed8' : '#047857';
          var srcBg = p.source === 'user' ? '#dbeafe' : '#d1fae5';
          return '<tr>'
            + '<td style="font-size:0.88rem;">' + p.user_email + '</td>'
            + '<td><strong>' + p.app_name + '</strong></td>'
            + '<td><span style="font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + srcColor + '; background:' + srcBg + ';">' + srcLabel + '</span></td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(p.valid_from) + ' \uFF5E ' + fmt(p.valid_to) + '</td>'
            + '</tr>';
        }).join('');
      }

      var removeTargetId = null;
      window.removeMember = function(mid) {
        removeTargetId = mid;
        var m = document.getElementById('remove-confirm-modal');
        if (m) m.showModal();
      };
      window.closeRemoveModal = function() {
        var m = document.getElementById('remove-confirm-modal');
        if (m) m.close();
        removeTargetId = null;
      };
      window.executeRemove = function() {
        if (!removeTargetId) return;
        fetch('/admin/api/am/membership/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeTargetId }) })
          .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function() {
            window.closeRemoveModal();
            // \u30ED\u30FC\u30AB\u30EB\u30C7\u30FC\u30BF\u304B\u3089\u3082\u524A\u9664\u3057\u3066\u30EA\u30EC\u30F3\u30C0\u30FC
            if (membersByGroup && currentGroupId) {
              membersByGroup[currentGroupId] = (membersByGroup[currentGroupId] || []).filter(function(m) { return m.id !== removeTargetId; });
            }
            removeTargetId = null;
            renderMembers();
          })
          .catch(function(e) { alert('Error: ' + e.message); });
      };

      window.addMember = function() {
        var userIds = window.tsCtrl ? window.tsCtrl.getValue() : [];
        if (!Array.isArray(userIds)) userIds = [userIds];
        userIds = userIds.filter(function(id) { return id; });
        if (!userIds.length) { alert('\u30E6\u30FC\u30B6\u30FC\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044'); return; }
        var role = document.getElementById('m-role').value || 'member';
        var startVal = document.getElementById('m-valid-from').value;
        var endVal = document.getElementById('m-valid-to').value;
        var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/admin/api/am/membership/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, role: role, valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { alert('Error: ' + e.message); });
      };

      window.openAddModal = function() {
        var m = document.getElementById('add-member-modal');
        if (m) m.showModal();
        if (window.tsCtrl) window.tsCtrl.clear();
        var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
      };

    })();
  `);
  if (groups.length === 0) {
    return Layout({
      title: t.ga_title,
      siteName: props.siteName,
      lang: t.lang,
      width: 800,
      align: "top",
      children: html`
        ${UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: "group-admin", profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true })}
        <div style="text-align:center; padding:4rem 2rem; color:var(--text-sub);">
          <span class="material-symbols-outlined" style="font-size:48px; color:#c7d2fe; display:block; margin-bottom:1rem;">group_off</span>
          <p>${t.ga_no_groups}</p>
          <a href="/" style="color:var(--primary); font-weight:600; text-decoration:none;">&larr; ${t.nav_dashboard}</a>
        </div>
      `
    });
  }
  const firstGroupId = groups[0].id;
  return Layout({
    title: t.ga_title,
    siteName: props.siteName,
    lang: t.lang,
    width: 1e3,
    align: "top",
    children: html(_a2 || (_a2 = __template(["\n      ", '\n\n      <div style="margin-bottom:1.75rem;">\n        <h1 style="font-size:1.5rem; font-weight:800; color:var(--text-main); letter-spacing:-0.02em; margin-bottom:0.25rem;">\n          <span class="material-symbols-outlined" style="color:var(--primary); vertical-align:middle; margin-right:0.4rem;">admin_panel_settings</span>', '\n        </h1>\n        <p style="font-size:0.95rem; color:var(--text-sub);">', "</p>\n      </div>\n\n      ", '\n\n      <div class="', `">
        <button id="tab-btn-members" class="active" onclick="switchTab('members')">
          <span class="material-symbols-outlined">group</span>`, `
        </button>
        <button id="tab-btn-assignments" onclick="switchTab('assignments')">
          <span class="material-symbols-outlined">assignment_ind</span>`, `
        </button>
        <button id="tab-btn-access" onclick="switchTab('access')">
          <span class="material-symbols-outlined">lock_open</span>`, '\n        </button>\n      </div>\n\n      <!-- \u30E1\u30F3\u30D0\u30FC\u30BF\u30D6 -->\n      <div id="tab-members">\n        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">\n          ', '\n        </div>\n        <div class="', '">\n          <div class="', '">\n            <table>\n              <thead>\n                <tr>\n                  <th>', "</th>\n                  <th>", "</th>\n                  <th>", '</th>\n                  <th></th>\n                </tr>\n              </thead>\n              <tbody id="members-table-body">\n                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">\u8AAD\u8FBC\u4E2D...</td></tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n\n      <!-- \u5272\u5F53\u30BF\u30D6 -->\n      <div id="tab-assignments" style="display:none;">\n        <div class="', '">\n          <div class="', '">\n            <table>\n              <thead>\n                <tr>\n                  <th>', "</th>\n                  <th>", "</th>\n                  <th>", "</th>\n                  <th>", "</th>\n                  <th>", '</th>\n                </tr>\n              </thead>\n              <tbody id="assigns-table-body">\n                <tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">\u8AAD\u8FBC\u4E2D...</td></tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n\n      <!-- \u30A2\u30AF\u30BB\u30B9\u6A29\u30BF\u30D6 -->\n      <div id="tab-access" style="display:none;">\n        <div class="', '">\n          <span class="material-symbols-outlined">info</span>\n          ', '\n        </div>\n        <div class="', '">\n          <div class="', '">\n            <table>\n              <thead>\n                <tr>\n                  <th>', "</th>\n                  <th>", "</th>\n                  <th>", "</th>\n                  <th>", '</th>\n                </tr>\n              </thead>\n              <tbody id="perms-table-body">\n                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">\u8AAD\u8FBC\u4E2D...</td></tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n\n      <!-- \u30E1\u30F3\u30D0\u30FC\u8FFD\u52A0\u30E2\u30FC\u30C0\u30EB -->\n      ', "\n\n      <!-- \u30E1\u30F3\u30D0\u30FC\u524A\u9664\u78BA\u8A8D\u30E2\u30FC\u30C0\u30EB -->\n      ", '\n\n      <script type="application/json" id="ga-members-data">', '<\/script>\n      <script type="application/json" id="ga-assigns-data">', '<\/script>\n      <script type="application/json" id="ga-perms-data">', '<\/script>\n      <script type="application/json" id="ga-users-data">', "<\/script>\n      <script>\n        window.i18n = {\n          noMembers: '", "',\n          roleAdmin: '", "',\n          roleMember: '", "',\n          noAssignments: '", "',\n          noAccess: '", "',\n          srcUser: '", "',\n          srcGroup: '", "',\n        };\n      <\/script>\n      <script>\n      ", "\n      <\/script>\n    "])), UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: "group-admin", profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true }), t.ga_title, t.ga_subtitle, groups.length > 1 ? html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
          <select id="group-select" class="${groupSelect}" onchange="switchGroup()" style="margin-bottom:0;">
            ${groups.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
          </select>
        </div>
      ` : html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
          <strong style="font-size:1.1rem;">${groups[0].name}</strong>
          <input type="hidden" id="group-select" value="${firstGroupId}" />
        </div>
      `, tabBar, t.ga_tab_members, t.ga_tab_assignments, t.ga_tab_access, Button({ onclick: "openAddModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">person_add</span> ${t.am_add_member}` }), card, tableWrap, t.ga_assign_user, t.am_label_role, t.ga_assign_valid, card, tableWrap, t.ga_assign_user, t.ga_assign_service, t.ga_assign_facility, t.ga_assign_role, t.ga_assign_valid, infoBox, t.ga_access_readonly, card, tableWrap, t.ga_assign_user, t.ga_permission_app, t.ga_permission_source, t.ga_permission_valid, Modal({
      id: "add-member-modal",
      title: t.am_add_member,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div>
              <label class="${formLabel}">${t.am_label_member}</label>
              ${MultiSelect({ id: "m-user-id", placeholder: t.placeholder_select, options: userOptions })}
            </div>
            <div>
              <label class="${formLabel}">${t.am_label_role}</label>
              <select id="m-role">
                <option value="member">${t.am_role_member}</option>
                <option value="group_admin">${t.am_role_group_admin}</option>
              </select>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label class="${formLabel}">${t.label_valid_from}</label>
                <input type="date" id="m-valid-from" class="${dateInput}" />
              </div>
              <div>
                <label class="${formLabel}">${t.label_valid_to}</label>
                <input type="date" id="m-valid-to" class="${dateInput}" />
              </div>
            </div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "addMember()", children: html`<span class="material-symbols-outlined">person_add</span> ${t.am_add_member}` })}
            </div>
          </div>
        `
    }), Modal({
      id: "remove-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
      closeAction: "closeRemoveModal()",
      children: html`
          <p style="color:#475569; font-size:1rem; line-height:1.5; margin-bottom:2rem;">${t.am_confirm_remove_member}</p>
          <div style="display:flex; justify-content:flex-end; gap:1rem;">
            <button type="button" onclick="closeRemoveModal()" style="background:transparent;color:#64748b;border:1px solid #cbd5e1;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${t.cancel}</button>
            <button type="button" onclick="executeRemove()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span>${t.am_btn_remove}</button>
          </div>
        `
    }), raw(membersByGroupJson), raw(assignmentsByGroupJson), raw(permsByGroupJson), raw(allUsersJson), t.am_no_members, t.am_role_group_admin, t.am_role_member, t.ga_no_assignments, t.ga_no_access, t.ga_source_user, t.ga_source_group, scriptContent)
  });
}, "GroupAdminPage");

// src/views/admin/AdminHome.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/admin/Layout.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a3;
var Layout2 = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const navSections = [
    { label: null, items: [
      { id: "home", label: t.nav_home, href: "/admin" }
    ] },
    { label: t.nav_section_account, items: [
      { id: "am-groups", label: t.am_section_groups, href: "/admin/am/groups" },
      { id: "am-services", label: t.am_section_services, href: "/admin/am/services" },
      { id: "am-grants", label: t.am_section_grants, href: "/admin/am/grants" },
      { id: "am-facilities", label: t.am_section_facilities, href: "/admin/am/facilities" },
      { id: "am-assignments", label: t.am_section_assignments, href: "/admin/am/assignments" }
    ] },
    { label: t.nav_section_idp, items: [
      { id: "apps", label: t.nav_apps, href: "/admin/apps" },
      { id: "groups", label: t.nav_groups, href: "/admin/groups" },
      { id: "users", label: t.nav_users, href: "/admin/users" }
    ] },
    { label: t.nav_section_system, items: [
      { id: "logs", label: t.nav_logs, href: "/admin/logs" }
    ] }
  ];
  const wrapperClass = css2`
        display: grid; 
        grid-template-columns: 260px 1fr; 
        min-height: 100vh;
        max-width: 1400px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(10px);
        box-shadow: 0 0 40px rgba(0,0,0,0.05);

        @media (max-width: 768px) {
            display: block; 
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            transform: none;
            background: transparent;
            box-shadow: none;
        }
    `;
  const sidebarClass = css2`
        background: rgba(255, 255, 255, 0.6); 
        padding: 2rem 1.5rem; 
        border-right: 1px solid rgba(255,255,255,0.5); 
        display: flex; 
        flex-direction: column;

        & h1 {
            font-size: 1.5rem; 
            margin-bottom: 0.25rem;
            background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800; 
            text-align: center; 
        }
        
        & .config-link {
            text-align: center;
            margin-bottom: 2rem;
            font-size: 0.75rem;
        }
        & .config-link a {
            color: #94a3b8;
            text-decoration: none;
            border-bottom: 1px dashed #cbd5e1;
        }
        & .config-link a:hover {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        @media (max-width: 768px) {
            display: flex;
            position: fixed;
            top: 0; left: 0;
            height: 100vh;
            width: 280px; 
            z-index: 2000;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 10px 0 25px rgba(0,0,0,0.1);
            border-right: none;
            background: rgba(255, 255, 255, 0.98); 

            &.open { transform: translateX(0); }
        }
    `;
  const sectionLabelClass = css2`
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        padding: 0 1rem;
        margin: 1.25rem 0 0.4rem;
    `;
  const navItemClass = css2`
        display: block;
        padding: 0.85rem 1rem; 
        color: var(--text-sub); 
        text-decoration: none; 
        border-radius: 12px; 
        margin-bottom: 0.5rem; 
        transition: all 0.2s; 
        font-size: 0.95rem;
        font-weight: 500;
        
        &:hover { 
            background: rgba(255,255,255,0.7); 
            color: var(--primary); 
            transform: translateX(4px);
        }
        
        &.active { 
            background: white; 
            color: var(--primary); 
            font-weight: 700; 
            box-shadow: 0 4px 6px -2px rgba(0,0,0,0.05);
        }
    `;
  const contentClass = css2`
        padding: 2rem 3rem; 
        overflow-y: auto; 
        
        @media (max-width: 768px) {
            padding: 1rem; 
            padding-bottom: 5rem; 
        }
    `;
  const mobileToggleClass = css2`
        display: none;
        position: fixed;
        bottom: 1.5rem; right: 1.5rem;
        z-index: 1000;
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        color: white;
        border: none;
        border-radius: 50%;
        width: 48px; height: 48px;
        align-items: center; justify-content: center;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        
        &:hover { transform: scale(1.1); }
        &:active { transform: scale(0.95); }

        @media (max-width: 768px) { display: flex; padding: 0; }
    `;
  const globalOverrides = html`
      <style>
        :root { --primary: #4f46e5; --primary-hover: #4338ca; --text-main: #0f172a; --text-sub: #64748b; }
        address, blockquote, dl, figure, form, ol, p, pre, table, ul { margin-bottom: 0; }
        body { font-family: 'Inter', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%); background-size: 200% 200%; animation: gradient-animation 15s ease infinite; color: var(--text-main); margin: 0; padding: 0; }
        button, input, select, textarea { font-family: inherit; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-size: 20px; vertical-align: text-bottom; line-height: 1; }
        @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        
        article { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.6); border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        button { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; border: none; border-radius: 12px; padding: 0.75rem 1.5rem; margin-bottom: 0; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%); }
        button:active { transform: translateY(0); }
        button.contrast, button.secondary, button.outline { background: transparent !important; border: 1px solid #cbd5e1; color: var(--text-sub); box-shadow: none; }
        button.contrast:hover, button.secondary:hover, button.outline:hover { background: rgba(255, 255, 255, 0.5) !important; color: var(--primary); border-color: var(--primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        input:not([type="checkbox"]):not([type="radio"]), select { width: 100%; padding: 0.8rem 1rem; margin-bottom: 0; border: 1px solid #cbd5e1 !important; background: rgba(255, 255, 255, 0.9) !important; border-radius: 12px !important; font-size: 1rem; color: var(--text-main); transition: all 0.3s ease; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        input:not([type="checkbox"]):not([type="radio"]):focus, select:focus { background: #fff !important; border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important; outline: none; }
        table { border-collapse: separate; border-spacing: 0 0.5rem; }
        th { border-bottom: none; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 1rem; }
        td { background: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.5); padding: 1rem; vertical-align: middle; }
        td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; border-left: 1px solid rgba(255,255,255,0.5); }
        td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-right: 1px solid rgba(255,255,255,0.5); }
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 90; }
        @media (max-width: 768px) { .sidebar-overlay.visible { display: block; } }
      </style>
    `;
  const formLabel = css2`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`;
  return html(_a3 || (_a3 = __template(['\n    <!DOCTYPE html>\n    <html lang="', '">\n    <head>\n      <meta charset="UTF-8">\n      <meta name="viewport" content="width=device-width, initial-scale=1.0">\n      <title>', '</title>\n      <link rel="preconnect" href="https://fonts.googleapis.com">\n      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">\n      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />\n      <link href="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/css/tom-select.css" rel="stylesheet">\n      <script src="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/js/tom-select.complete.min.js"><\/script>\n      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">\n      ', "\n      ", '\n    </head>\n    <body>\n      <div class="sidebar-overlay" onclick="toggleSidebar()"></div>\n      <button class="', '" onclick="toggleSidebar()" aria-label="Menu">\n        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n            <line x1="3" y1="12" x2="21" y2="12"></line>\n            <line x1="3" y1="6" x2="21" y2="6"></line>\n            <line x1="3" y1="18" x2="21" y2="18"></line>\n        </svg>\n      </button>\n      <div class="', '">\n        <aside class="sidebar ', '">\n            <h1>', `</h1>
            <div class="config-link">
                <a href="#" onclick="document.getElementById('config-modal').showModal()">`, "</a>\n            </div>\n            <nav>\n                ", '\n            </nav>\n            <div style="margin-top: auto; padding: 1rem 0; border-top: 1px solid rgba(255,255,255,0.5);">\n                <div style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.5rem; padding: 0 0.5rem;">', '</div>\n                <div style="display:flex; gap: 0.5rem;">\n                    <a href="/" class="', '" style="flex:1; text-align:center; font-size:0.85rem; padding: 0.6rem;">', '</a>\n                    <a href="/logout" class="', '" style="flex:1; text-align:center; font-size:0.85rem; padding: 0.6rem; color:#ef4444;">', '</a>\n                </div>\n            </div>\n        </aside>\n        \n        <main class="', '">\n            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 2rem; font-size: 0.9rem; color: var(--text-sub); padding-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05);">\n               <span class="material-symbols-outlined" style="margin-right: 6px; font-size: 18px; color: var(--text-sub);">admin_panel_settings</span> ', "\n            </div>\n            ", "\n        </main>\n      </div>\n\n      ", "\n\n      <script>\n        function toggleSidebar() {\n            var sidebar = document.querySelector('.sidebar');\n            if(sidebar) sidebar.classList.toggle('open');\n            var overlay = document.querySelector('.sidebar-overlay');\n            if(overlay) overlay.classList.toggle('visible');\n        }\n        document.addEventListener('DOMContentLoaded', function() {\n            document.querySelectorAll('.local-time').forEach(function(el) {\n                var ts = parseInt(el.getAttribute('data-timestamp'));\n                if (!isNaN(ts)) {\n                    el.textContent = new Date(ts).toLocaleString();\n                }\n            });\n        });\n      <\/script>\n    </body>\n    </html>\n    "])), t.lang, t.tobira_admin, globalOverrides, Style2(), mobileToggleClass, wrapperClass, sidebarClass, props.siteName, t.config_change_name || "Change Name", navSections.map((section) => html`
                    ${section.label ? html`<div class="${sectionLabelClass}">${section.label}</div>` : ""}
                    ${section.items.map((item) => html`
                        <a href="${item.href}" class="${navItemClass} ${props.activeTab === item.id ? "active" : ""}">
                            ${item.label}
                        </a>
                    `)}
                `), props.userEmail, navItemClass, t.nav_home, navItemClass, t.logout, contentClass, t.tobira_admin, props.children, Modal({
    id: "config-modal",
    title: t.config_change_name,
    closeAction: "this.closest('dialog').close()",
    children: html`
            <form method="POST" action="/admin/config">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <label style="width:100%;">
                        <span class="${formLabel}">${t.label_app_name_ja}</span>
                        <input type="text" name="app_name_ja" value="${props.appConfig.appName.ja}" required />
                    </label>
                    <label style="width:100%;">
                        <span class="${formLabel}">${t.label_app_name_en}</span>
                        <input type="text" name="app_name_en" value="${props.appConfig.appName.en}" required />
                    </label>
                    <hr />
                    <label style="width:100%;">
                        <span class="${formLabel}">${t.label_app_subtitle_ja}</span>
                        <input type="text" name="app_subtitle_ja" value="${props.appConfig.appSubtitle.ja}" required />
                    </label>
                    <label style="width:100%;">
                        <span class="${formLabel}">${t.label_app_subtitle_en}</span>
                        <input type="text" name="app_subtitle_en" value="${props.appConfig.appSubtitle.en}" required />
                    </label>
                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: t.save })}
                    </div>
                </div>
            </form>
        `
  }));
}, "Layout");

// src/views/admin/AdminHome.tsx
var AdminHome = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "home",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <hgroup>
        <h2>${t.title_dashboard}</h2>
        <h3>${t.welcome}</h3>
      </hgroup>

      <div class="grid">
        <article>
            <header><strong>${t.stat_apps}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #0288d1;">
                ${props.stats.apps}
            </div>
            <footer style="text-align:center">
                <a href="/admin/apps" role="button" class="outline">${t.nav_apps}</a>
            </footer>
        </article>
        
        <article>
            <header><strong>${t.stat_users}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #43a047;">
                ${props.stats.users}
            </div>
            <footer style="text-align:center">
                <a href="/admin/users" role="button" class="outline">${t.nav_users}</a>
            </footer>
        </article>
        
        <article>
            <header><strong>${t.stat_logs}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #fb8c00;">
                ${props.stats.logs}
            </div>
            <footer style="text-align:center">
                <a href="/admin/logs" role="button" class="outline">${t.nav_logs}</a>
            </footer>
        </article>
      </div>
    `
  });
}, "AdminHome");

// src/views/admin/AppsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a4;
var AppsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const scriptContent = raw(`
        (function() {
            // \u753B\u50CF\u30D7\u30EC\u30D3\u30E5\u30FC\u6A5F\u80FD
            window.handleIconPreview = function(input, previewId) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var div = document.getElementById(previewId);
                        var img = div ? div.querySelector('img') : null;
                        if(img) {
                            img.src = e.target.result;
                            div.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
    
            var editModal = document.getElementById('edit-app-modal');
            
            // \u7DE8\u96C6\u30E2\u30FC\u30C0\u30EB\u3092\u958B\u304F\u95A2\u6570
            window.openEditAppModal = function(btn) {
                if(!editModal) return;
                var form = editModal.querySelector('form');
                
                // \u57FA\u672C\u30C7\u30FC\u30BF
                form.querySelector('input[name="id"]').value = btn.dataset.id;
                form.querySelector('input[name="name"]').value = btn.dataset.name;
                form.querySelector('input[name="base_url"]').value = btn.dataset.url;
                
                // \u8AAC\u660E\u6587
                var descEl = form.querySelector('textarea[name="description"]');
                if(descEl) descEl.value = btn.dataset.desc || '';

                // Redirect URIs (OIDC)
                var ruEl = form.querySelector('textarea[name="redirect_uris"]');
                if(ruEl) ruEl.value = btn.dataset.redirectUris || '';

                // Back-Channel Logout URI (OIDC)
                var bclEl = form.querySelector('input[name="backchannel_logout_uri"]');
                if(bclEl) bclEl.value = btn.dataset.backchannelLogoutUri || '';

                // \u30A2\u30A4\u30B3\u30F3\u95A2\u9023
                var iconEl = form.querySelector('input[name="icon_url"]');
                var iconUrl = btn.dataset.icon || '';
                if(iconEl) iconEl.value = iconUrl;
                
                // \u30D7\u30EC\u30D3\u30E5\u30FC\u8868\u793A\u5236\u5FA1
                var previewDiv = document.getElementById('edit-icon-preview');
                var previewImg = previewDiv ? previewDiv.querySelector('img') : null;
                if(previewDiv && previewImg) {
                    if(iconUrl && iconUrl !== 'null' && iconUrl !== 'undefined') {
                        previewImg.src = iconUrl;
                        previewDiv.style.display = 'block';
                    } else {
                        previewImg.src = '';
                        previewDiv.style.display = 'none';
                    }
                }
                
                // \u30D5\u30A1\u30A4\u30EB\u5165\u529B\u306F\u30EA\u30BB\u30C3\u30C8
                var fileInput = form.querySelector('input[name="icon_file"]');
                if(fileInput) fileInput.value = '';

                // Client Secret (OIDC)
                var secEl = document.getElementById('edit-secret');
                var noteEl = document.getElementById('edit-secret-note');
                var sec = btn.dataset.secret || '';
                if(secEl) secEl.value = sec || '${t.secret_public_placeholder}';
                if(noteEl) noteEl.innerText = sec
                    ? '${t.note_confidential}'
                    : '${t.note_public}';

                editModal.showModal();
                setTimeout(function() {
            // \u753B\u50CF\u30D7\u30EC\u30D3\u30E5\u30FC\u6A5F\u80FD
            window.handleIconPreview = function(input, previewId) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var div = document.getElementById(previewId);
                        var img = div ? div.querySelector('img') : null;
                        if(img) {
                            img.src = e.target.result;
                            div.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
    
                    var closeBtn = document.getElementById('edit-close-btn');
                    if(closeBtn) closeBtn.focus();
                }, 50);
            };
            
            window.closeEditAppModal = function() {
                if(editModal) editModal.close();
            };
            // Toggle App Status
            var toggleTargetId = null;
            var toggleTargetStatus = null;
            window.toggleAppStatus = function(id, nextStatus, name) {
                toggleTargetId = id;
                toggleTargetStatus = nextStatus;
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) {
                    var msgEl = document.getElementById('toggle-msg-text');
                    var tmpl = i18n.confirmChangeStatus || 'Change status?';
                    if(msgEl) msgEl.innerText = tmpl.replace('{name}', name);
                    tm.showModal();
                }
            };
            window.closeToggleModal = function() {
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) tm.close();
                toggleTargetId = null;
                toggleTargetStatus = null;
            };
            window.executeToggle = function() {
                if(!toggleTargetId) return;
                var form = document.getElementById('toggle-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = toggleTargetId;
                    form.querySelector('input[name="status"]').value = toggleTargetStatus;
                    form.submit();
                }
            };

            // Delete App
            var deleteTargetId = null;
            window.deleteApp = function(id) {
                deleteTargetId = id;
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.showModal();
            };
            window.closeDeleteModal = function() {
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.close();
                deleteTargetId = null;
            };
            window.executeDelete = function() {
                if(!deleteTargetId) return;
                var form = document.getElementById('delete-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = deleteTargetId;
                    form.submit();
                }
            };

            // Client secret: regenerate / clear (make public)
            window.appSecretAction = function(action) {
                if(!editModal) return;
                var id = editModal.querySelector('input[name="id"]').value;
                if(!id) return;
                if(action === 'clear' && !confirm('${t.confirm_make_public}')) return;
                var f = document.getElementById('secret-app-form');
                if(f) {
                    f.querySelector('input[name="id"]').value = id;
                    f.querySelector('input[name="action"]').value = action;
                    f.submit();
                }
            };
        })();
  `);
  const listGrid = css2`display: flex; flex-direction: column; gap: 1rem;`;
  const listCard = css2`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover {
        outline: 1px solid var(--primary);
    }
  `;
  const itemTitle = css2`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;
  const itemSub = css2`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`;
  const actionBtn = css2`
    background: transparent !important; 
    border: none !important; 
    color: #94a3b8 !important; 
    cursor: pointer !important; 
    padding: 8px !important; 
    border-radius: 50% !important; 
    transition: all 0.2s !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `;
  const deleteBtn = css2`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "apps",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html(_a4 || (_a4 = __template(['\n      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">\n        <h2 style="margin-bottom: 0;">', "</h2>\n        ", '\n      </div>\n\n      <details style="margin-bottom:2rem; border:1px solid #e2e8f0; border-radius:12px; padding:1rem 1.25rem; background:#f8fafc;">\n        <summary style="cursor:pointer; font-weight:600; color:#334155;">\u52D5\u7684\u767B\u9332\u30C8\u30FC\u30AF\u30F3 (RFC 7591 Initial Access Token)</summary>\n        <p style="font-size:0.85rem; color:#64748b; margin:0.75rem 0;">\n          \u3053\u3053\u3067\u767A\u884C\u3057\u305F Bearer \u30C8\u30FC\u30AF\u30F3\u3092 <code>Authorization: Bearer \u2026</code> \u306B\u4ED8\u3051\u3066\n          <code>POST /register</code> \u3092\u547C\u3076\u3068\u3001\u30A2\u30D7\u30EA(\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8)\u3092\u52D5\u7684\u306B\u767B\u9332\u3067\u304D\u307E\u3059\u3002\n          \u30C8\u30FC\u30AF\u30F3\u3092\u6301\u305F\u306A\u3044\u30FB\u671F\u9650\u5207\u308C\u306E\u547C\u3073\u51FA\u3057\u306F\u62D2\u5426\u3055\u308C\u307E\u3059\u3002\n        </p>\n        <form method="POST" action="/admin/registration-tokens" style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">\n          <label style="font-size:0.85rem; color:#475569;">\u6709\u52B9\u65E5\u6570\n            <input type="number" name="days" min="0" placeholder="0=\u7121\u671F\u9650" style="width:120px; padding:0.5rem; border-radius:8px; border:1px solid #cbd5e1; margin-left:0.4rem;" />\n          </label>\n          <button type="submit" class="btn" style="width:auto; padding:0.55rem 1rem; margin:0;">\u30C8\u30FC\u30AF\u30F3\u3092\u767A\u884C</button>\n        </form>\n        ', "\n      </details>\n\n      ", '\n\n      <form id="toggle-app-form" method="POST" action="/admin/apps/toggle">\n        <input type="hidden" name="id" value="" />\n        <input type="hidden" name="status" value="" />\n      </form>\n      <form id="delete-app-form" method="POST" action="/admin/apps/delete">\n        <input type="hidden" name="id" value="" />\n      </form>\n      <form id="secret-app-form" method="POST" action="/admin/apps/secret">\n        <input type="hidden" name="id" value="" />\n        <input type="hidden" name="action" value="" />\n      </form>\n\n      <div class="', '">\n        ', "\n      </div>\n\n      ", "\n\n      ", "\n\n      ", '\n\n      <div id="i18n-data" style="display:none;"\n        data-confirm-change-status="', '"\n      ></div>\n\n      <script>\n      ', "\n      <\/script>\n    "])), t.section_apps, Button({
      onclick: "document.getElementById('new-app-modal').showModal()",
      style: "width: auto; margin-bottom: 0;",
      children: html`<span class="material-symbols-outlined" style="font-size: 18px;">add</span> ${t.btn_add_app}`
    }), props.regTokens && props.regTokens.length ? html`<div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${props.regTokens.map((rt) => html`
                <div style="display:flex; align-items:center; gap:0.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.5rem 0.75rem;">
                  <code style="flex:1; font-size:0.78rem; word-break:break-all; color:#0f172a;">${rt.token}</code>
                  <span style="font-size:0.75rem; color:#94a3b8; white-space:nowrap;">${rt.expires_at ? "\u671F\u9650 " + new Date(rt.expires_at * 1e3).toISOString().slice(0, 10) : "\u7121\u671F\u9650"}</span>
                  <form method="POST" action="/admin/registration-tokens/delete" style="margin:0;" onsubmit="return confirm('このトークンを失効しますか？');">
                    <input type="hidden" name="token" value="${rt.token}" />
                    <button type="submit" title="失効" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">失効</button>
                  </form>
                </div>`)}
            </div>` : html`<p style="font-size:0.85rem; color:#94a3b8; margin:0;">まだトークンはありません。</p>`, Modal({
      id: "new-app-modal",
      title: t.header_new_app,
      closeAction: "this.closest('dialog').close()",
      children: html`
              <form method="POST" action="/admin/apps" enctype="multipart/form-data">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_id}</span>
                      <input type="text" name="id" placeholder="${t.placeholder_app_id}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_name}</span>
                      <input type="text" name="name" placeholder="${t.placeholder_app_name}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_base_url}</span>
                      <input type="url" name="base_url" placeholder="https://..." required />
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_redirect_uris}</span>
                      <textarea name="redirect_uris" placeholder="${raw(t.ph_redirect_uris)}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem; min-height:70px;"></textarea>
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_redirect_uris}</small>
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_bcl_uri}</span>
                      <input type="url" name="backchannel_logout_uri" placeholder="https://app.example.com/backchannel-logout" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_bcl_uri}</small>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_icon}</span>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="file" name="icon_file" accept="image/*" style="font-size:0.9rem; padding: 0.4rem; height: auto;" onchange="handleIconPreview(this, 'new-icon-preview')" />
                            <input type="hidden" name="icon_url" />
                        </div>
                        <div id="new-icon-preview" style="margin-top:0.75rem; display:none;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:0.25rem;">${t.label_preview}</p>
                            <img src="" style="width:64px; height:64px; border-radius:12px; border:1px solid #e2e8f0; object-fit:contain; background: #fff;" />
                        </div>
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_description}</span>
                      <textarea name="description" placeholder="${t.placeholder_description}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; min-height: 80px;"></textarea>
                    </label>

                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: t.btn_add_app })}
                    </div>
                </div>
              </form>
        `
    }), listGrid, props.apps.map((app2) => html`
          <div class="${listCard}" 
               data-id="${app2.id}" 
               data-name="${app2.name}" 
               data-url="${app2.base_url}" 
               data-desc="${app2.description || ""}"
               data-icon="${app2.icon_url || ""}"
               data-secret="${app2.client_secret || ""}"
               data-redirect-uris="${app2.redirect_uris || ""}"
               data-backchannel-logout-uri="${app2.backchannel_logout_uri || ""}"
               onclick="openEditAppModal(this)">
            
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.25rem;">
                    ${app2.icon_url ? html`<img src="${app2.icon_url}" style="width:32px; height:32px; border-radius:6px; object-fit:contain; background:#f8fafc; border:1px solid #e2e8f0;">` : ""}
                    <div class="${itemTitle}" style="margin-bottom:0;">${app2.name}</div>
                    ${app2.status === "inactive" ? html`<span style="color:#d97706; background:#fffbeb; border:1px solid #fcd34d; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_inactive}</span>` : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                </div>
                ${app2.description ? html`<div style="font-size:0.85rem; color:#64748b; margin-bottom:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:400px;">${app2.description}</div>` : ""}
                <div class="${itemSub}">
                    <span style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:4px; margin-right:0.5rem;">${app2.id}</span>
                    <a href="${app2.base_url}" target="_blank" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:0.2rem;" onclick="event.stopPropagation()">
                        ${app2.base_url} <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                    </a>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button type="button" class="${actionBtn}" title="${app2.status === "inactive" ? t.btn_resume : t.btn_pause}" onclick="event.stopPropagation(); toggleAppStatus('${app2.id}', '${app2.status === "inactive" ? "active" : "inactive"}', '${app2.name}')">
                    <span class="material-symbols-outlined">${app2.status === "inactive" ? "play_arrow" : "pause"}</span>
                </button>
                
                <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="event.stopPropagation(); deleteApp('${app2.id}')">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
          </div>
        `), Modal({
      id: "edit-app-modal",
      title: t.header_edit_app,
      closeAction: "closeEditAppModal()",
      closeBtnId: "edit-close-btn",
      children: html`
              <form method="POST" action="/admin/apps/update" enctype="multipart/form-data">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <input type="hidden" name="id" value="" />
                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_name}</span>
                        <input type="text" name="name" required />
                    </label>
                    <label style="width:100%;">
                        <span class="form-label">${t.label_base_url}</span>
                        <input type="url" name="base_url" required />
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_redirect_uris}</span>
                        <textarea name="redirect_uris" placeholder="${raw(t.ph_redirect_uris)}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem; min-height:70px;"></textarea>
                        <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_redirect_uris}</small>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_bcl_uri}</span>
                        <input type="url" name="backchannel_logout_uri" placeholder="https://app.example.com/backchannel-logout" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                        <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_bcl_uri}</small>
                    </label>

                    <div style="width:100%; padding:0.9rem 1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                        <span class="form-label">${t.label_client_secret}</span>
                        <input type="text" id="edit-secret" readonly onclick="this.select()" style="width:100%; font-family:monospace; font-size:0.85rem; background:#fff;" />
                        <small id="edit-secret-note" style="display:block; color:#64748b; margin-top:0.35rem;"></small>
                        <div style="display:flex; gap:0.5rem; margin-top:0.6rem;">
                            <button type="button" onclick="appSecretAction('regenerate')" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer;">🔄 ${t.btn_regenerate_secret}</button>
                            <button type="button" onclick="appSecretAction('clear')" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer;">${t.btn_make_public}</button>
                        </div>
                    </div>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_icon}</span>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="file" name="icon_file" accept="image/*" style="font-size:0.9rem; padding: 0.4rem; height: auto;" onchange="handleIconPreview(this, 'edit-icon-preview')" />
                            <input type="hidden" name="icon_url" />
                        </div>
                        <div id="edit-icon-preview" style="margin-top:0.75rem; display:none;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:0.25rem;">${t.label_current_icon}</p>
                            <img src="" style="width:64px; height:64px; border-radius:12px; border:1px solid #e2e8f0; object-fit:contain; background: #fff;" />
                        </div>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_description}</span>
                        <textarea name="description" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; min-height: 80px;"></textarea>
                    </label>

                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: html`<span class="material-symbols-outlined" style="margin-right:4px;">save</span> ${t.save}` })}
                    </div>
                </div>
              </form>
        `
    }), Modal({
      id: "toggle-confirm-modal",
      title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">info</span> ${t.btn_change || "Change Status"}</span>`,
      closeAction: "closeToggleModal()",
      children: html`
              <div style="margin-bottom: 2rem;">
                <p id="toggle-msg-text" style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;"></p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                  <button type="button" onclick="closeToggleModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                  <button type="button" onclick="executeToggle()" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                     <span class="material-symbols-outlined" style="font-size:18px;">check</span> Execute
                  </button>
              </div>
        `
    }), Modal({
      id: "delete-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete || "Delete"}</span>`,
      closeAction: "closeDeleteModal()",
      children: html`
              <div style="margin-bottom: 2rem;">
                <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.confirm_delete_app || "Are you sure you want to delete this app?"}</p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                  <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                  <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                     <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Delete
                  </button>
              </div>
        `
    }), t.confirm_change_status || "Change status?", scriptContent)
  });
}, "AppsPage");

// src/views/admin/GroupsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a5;
var GroupsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const allAppsJson = JSON.stringify(props.apps.map((a) => ({ value: a.id, text: a.name })));
  const scriptContent = raw(`
    (function() {
        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var ALL_APPS = [];
        try {
            var appDataEl = document.getElementById('app-data');
            if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
        } catch(e) { console.error(e); }
        var tsControl = null;
        var currentGroupId = '';
        var currentGroupPermissions = [];
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#g-perm-app-id', { 
                    plugins: ['remove_button'], 
                    create: false, 
                    maxItems: null, 
                    placeholder: i18n.placeholderSelect || 'Select...',
                    render: {
                        option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        no_results: function(data, escape) {
                            return '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>';
                        }
                    }
                });
            }
        });
        var gModal = document.getElementById('group-modal');
        window.openGroupModal = function(id, name) {
            currentGroupId = id;
            var titleEl = document.getElementById('modal-group-name');
            if(titleEl) titleEl.innerText = name;
            if(gModal) {
                gModal.showModal();
                setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
            }
            if (tsControl) tsControl.clear();
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) validTo.value = '';
            window.resetGrantButton();
            window.loadGroupPerms(id);
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); window.resetGrantButton(); };
        window.resetGrantButton = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
            var card = document.getElementById('grant-form-card');
            if(card) { card.classList.remove('blink-active'); }
            if(tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
        };
        window.highlightGrantForm = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { 
                btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>'; 
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            var card = document.getElementById('grant-form-card');
            if(card) { 
                card.classList.remove('blink-active'); 
                void card.offsetWidth;
                card.classList.add('blink-active'); 
            }
        };
        window.editGroupPerm = function(appId, startTs, endTs) {
            if (tsControl) { tsControl.setValue([appId]); }
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) { 
                var isForever = endTs > 2000000000; 
                validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; 
            }
            window.highlightGrantForm();
        };
        window.loadGroupPerms = function(id) {
            fetch('/admin/api/group-details/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    window.renderGroupPerms(data.permissions);
                    currentGroupPermissions = data.permissions;
                })
                .catch(function(e) { console.error(e); });
        };
        window.renderGroupPerms = function(list) {
            var container = document.getElementById('modal-g-perm-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = '(\u6A29\u9650\u306A\u3057)';
                container.appendChild(empty);
                return;
            }
            list.forEach(function(p) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';
                
                var row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                
                var left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';
                left.style.gap = '0.2rem';
                
                var title = document.createElement('div');
                title.className = 'item-title';
                title.innerText = p.app_name || 'Unknown';
                left.appendChild(title);
                
                var meta = document.createElement('div');
                meta.className = 'item-sub';
                var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                var isForever = p.valid_to > 2000000000;
                meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">date_range</span> ' + dateStrStart + ' \uFF5E ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd) + '</div>';
                left.appendChild(meta);
                
                row.appendChild(left);
                
                var right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '0.5rem';
                right.style.alignItems = 'center';
                
                var btnEdit = document.createElement('button');
                btnEdit.className = 'action-btn';
                btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                btnEdit.onclick = function() { window.editGroupPerm(p.app_id, p.valid_from, p.valid_to); };
                right.appendChild(btnEdit);

                var btnRevoke = document.createElement('button');
                btnRevoke.className = 'action-btn delete';
                btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                btnRevoke.onclick = function() { window.revokeGroupPerm(p.id); };
                right.appendChild(btnRevoke);
                
                row.appendChild(right);
                item.appendChild(row);
                container.appendChild(item);
            });
        };
        window.grantGroupPermission = function() {
            var dateVal = document.getElementById('g-perm-valid-to').value;
            var startVal = document.getElementById('g-perm-valid-from').value;
            var dateStrStart = new Date(startVal).toLocaleDateString();
            var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
            var appIds = [];
            if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
            else { var appSelect = document.getElementById('g-perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
            appIds = appIds.filter(function(id) { return id !== ''; });
            if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
            var warningMessages = [];
            appIds.forEach(function(id) {
                var existing = currentGroupPermissions.find(function(p) { return p.app_id === id; });
                if (existing) {
                    var exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
                    var isForever = existing.valid_to > 2000000000;
                    var exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
                    warningMessages.push('\u30FB' + existing.app_name + ' (' + exStart + ' \uFF5E ' + exEnd + ')');
                }
            });
            
            var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            
            var doGrant = function() {
                fetch('/admin/api/group/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ group_id: currentGroupId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
                .then(function() { window.loadGroupPerms(currentGroupId); if(tsControl) tsControl.clear(); })
                .catch(function(e) { console.error(e); alert('Error: ' + e); });
            };

            if (warningMessages.length > 0) {
                var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\\\n{list}';
                var listStr = warningMessages.join('\\\\n');
                var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                
                var om = document.getElementById('overwrite-confirm-modal');
                if(om) {
                    document.getElementById('overwrite-msg-text').innerText = msg;
                    window._executeOverwrite = function() {
                        om.close();
                        doGrant();
                    };
                    om.showModal();
                    return;
                }
            }
            doGrant();
        };

        var revokeTargetId = null;
        window.revokeGroupPerm = function(pid) {
            revokeTargetId = pid;
            var errEl = document.getElementById('revoke-error-msg');
            if(errEl) errEl.style.display = 'none';
            var rm = document.getElementById('revoke-confirm-modal');
            if(rm) {
                rm.showModal();
                setTimeout(function() { var closeBtn = document.getElementById('revoke-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
            }
        };
        window.closeRevokeModal = function() {
            var rm = document.getElementById('revoke-confirm-modal');
            if(rm) rm.close();
            revokeTargetId = null;
        };
        window.executeRevoke = function() {
            if(!revokeTargetId) return;
            var errEl = document.getElementById('revoke-error-msg');
            if(errEl) errEl.style.display = 'none';
            
            fetch('/admin/api/group/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: revokeTargetId}) })
            .then(function(r) { 
                if(!r.ok) {
                    return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server error ' + r.status); });
                }
                return r.json(); 
            })
            .then(function() { 
                window.closeRevokeModal();
                window.loadGroupPerms(currentGroupId); 
            })
            .catch(function(e) {
                console.error('Revoke error:', e);
                if(errEl) {
                    var tmpl = i18n.alertError || 'Error: {message}';
                    errEl.textContent = tmpl.replace('{message}', e.message);
                    errEl.style.display = 'block';
                } else {
                    alert('Error: ' + e.message);
                }
            });
        };

        var deleteTargetId = null;
        window.deleteGroup = function(gid, e) {
            if(e) e.stopPropagation();
            deleteTargetId = gid;
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.showModal();
        };
        window.closeDeleteModal = function() {
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.close();
            deleteTargetId = null;
        };
        window.executeDelete = function() {
            if(!deleteTargetId) return;
            var form = document.getElementById('delete-group-form');
            if (!form) return;
            var input = form.querySelector('input[name="id"]');
            if(input) input.value = deleteTargetId;
            form.submit();
        };

        window.calcGroupDate = function(targetId, offset, unit) {
            var d = new Date();
            if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
            if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
            var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
        };
    })();
  `);
  const blinkActive = keyframes2`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  `;
  const listGrid = css2`display: flex; flex-direction: column; gap: 1rem;`;
  const listCard = css2`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover {
        outline: 1px solid var(--primary);
    }
  `;
  const itemTitle = css2`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;
  const actionBtn = css2`
    background: transparent !important; 
    border: none !important; 
    color: #94a3b8 !important; 
    cursor: pointer !important; 
    padding: 8px !important; 
    border-radius: 50% !important; 
    transition: all 0.2s !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `;
  const deleteBtn = css2`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;
  const grantFormCard = css2`
    background: #ffffff;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    &.blink-active {
        animation: ${blinkActive} 1s ease-in-out 3;
    }
  `;
  const formLabel = css2`
    display: block;
    font-weight: 700;
    font-size: 0.95rem;
    color: #1e293b;
    margin-bottom: 0.5rem;
  `;
  const dateInput = css2`
    width: 100%;
    padding: 0.8rem 1rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1rem;
    color: #334155;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
  `;
  const quickBtnGroup = css2`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-top: 0.75rem;
  `;
  const pageWrapper = css2``;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "groups",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html(_a5 || (_a5 = __template(['\n      <div class="', '">\n          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">\n            <h2 style="margin-bottom: 0;">', "</h2>\n            ", "\n          </div>\n\n          ", '\n\n          <hr />\n\n          <form id="delete-group-form" method="POST" action="/admin/groups/delete">\n            <input type="hidden" name="id" value="" />\n          </form>\n\n          <div class="', '">\n            ', "\n            ", "\n          </div>\n\n          ", "\n\n          ", "\n\n          ", "\n\n          ", '\n\n          <div id="i18n-data" style="display:none;"\n            data-msg-revoke="', '"\n            data-term-forever="', '"\n            data-msg-overwrite-confirm="', '"\n            data-alert-select-app="', '"\n            data-alert-update-fail="', '"\n            data-alert-error="', '"\n            data-placeholder-select="', '" \n            data-btn-grant="', '"\n            data-btn-change="', '"\n            data-text-no-results="', '"\n          ></div>\n          \n          <script type="application/json" id="app-data">', "<\/script>\n\n          <script>\n          ", "\n          <\/script>\n      </div>\n    "])), pageWrapper, t.section_groups, Button({
      onclick: "document.getElementById('new-group-modal').showModal()",
      style: "width: auto; margin-bottom: 0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.btn_add_group}`
    }), Modal({
      id: "new-group-modal",
      title: t.header_new_group,
      closeAction: "this.closest('dialog').close()",
      children: html`
                  <form method="POST" action="/admin/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
    }), listGrid, props.groups.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : "", props.groups.map((g) => {
      return html`
              <div class="${listCard}" onclick="openGroupModal('${g.id}', '${g.name}')">
                <div style="flex-grow:1;">
                    <div class="${itemTitle}">${g.name}</div>
                </div>
                <div>
                     <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="deleteGroup('${g.id}', event)">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
              </div>
            `;
    }), Modal({
      id: "group-modal",
      title: html`${t.modal_section_group}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
      closeAction: "closeGroupModal()",
      closeBtnId: "modal-close-btn",
      children: html`
                 <div id="grant-form-card" class="${grantFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.modal_label_app}</label>
                       ${MultiSelect({
        id: "g-perm-app-id",
        placeholder: t.placeholder_select,
        options: props.apps.map((a) => ({ value: a.id, text: a.name }))
      })}
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="g-perm-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'month')", children: "-1\u30F6\u6708", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -7, 'day')", children: "-1\u9031\u9593", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'day')", children: "-1\u65E5", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="g-perm-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                    </div>

                    ${Button({ id: "btn-grant-perm", onclick: "grantGroupPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                 </div>
                 
                 <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.header_active_permissions}</h4>
                 
                 <div id="modal-g-perm-list"></div>
            `
    }), Modal({
      id: "revoke-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.confirm_revoke_permission || "Revoke Permission"}</span>`,
      closeAction: "closeRevokeModal()",
      closeBtnId: "revoke-close-btn",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_revoke_permission || "Are you sure you want to revoke this permission?"}</p>
                    <div id="revoke-error-msg" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; color: #b91c1c; border-radius: 6px; border: 1px solid #fecaca; display: none;"></div>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRevokeModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="executeRevoke()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Revoke
                      </button>
                  </div>
            `
    }), Modal({
      id: "delete-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete || "Delete"}</span>`,
      closeAction: "closeDeleteModal()",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.confirm_delete_group || "Are you sure you want to delete this group?"}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Delete
                      </button>
                  </div>
            `
    }), Modal({
      id: "overwrite-confirm-modal",
      title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.confirm_overwrite || "Overwrite?"}</span>`,
      closeAction: "this.closest('dialog').close()",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p id="overwrite-msg-text" style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;"></p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="this.closest('dialog').close()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="window._executeOverwrite()" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">check</span> Overwrite
                      </button>
                  </div>
            `
    }), t.confirm_revoke_permission, t.btn_term_forever, t.confirm_overwrite, t.alert_select_app, t.alert_update_fail, t.alert_error, t.placeholder_select, t.btn_grant, t.btn_change || "Change", t.text_no_results, raw(allAppsJson), scriptContent)
  });
}, "GroupsPage");

// src/views/admin/AccountGroupsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a6;
var AccountGroupsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const userOptions = props.users.map((u) => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email
  }));
  const allUsersJson = JSON.stringify(userOptions);
  const byId = new Map(props.groups.map((g) => [g.id, g]));
  const childrenMap = /* @__PURE__ */ new Map();
  for (const g of props.groups) {
    const key = g.parent_id && byId.has(g.parent_id) ? g.parent_id : "__root__";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key).push(g);
  }
  for (const arr of childrenMap.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
  const flatTree = [];
  const walk = /* @__PURE__ */ __name((key, depth) => {
    for (const g of childrenMap.get(key) || []) {
      flatTree.push({ g, depth });
      walk(g.id, depth + 1);
    }
  }, "walk");
  walk("__root__", 0);
  const parentOptions = props.groups.slice().sort((a, b) => a.name.localeCompare(b.name));
  const scriptContent = raw(`
    (function() {
        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var tsControl = null;
        var currentGroupId = '';
        var currentMembers = [];

        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#m-user-id', {
                    plugins: ['remove_button'],
                    create: false,
                    maxItems: null,
                    placeholder: i18n.placeholderSelect || 'Select...',
                    render: {
                        option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        no_results: function(data, escape) {
                            return '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>';
                        }
                    }
                });
            }
        });

        var gModal = document.getElementById('group-modal');
        window.openGroupModal = function(id, name, parentId) {
            currentGroupId = id;
            var titleEl = document.getElementById('modal-group-name');
            if(titleEl) titleEl.innerText = name;
            // \u89AA\u30B0\u30EB\u30FC\u30D7\u9078\u629E: \u73FE\u5728\u5024\u3092\u30BB\u30C3\u30C8\u3057\u3001\u81EA\u5206\u81EA\u8EAB\u306F\u89AA\u5019\u88DC\u304B\u3089\u7121\u52B9\u5316\u3002
            var parentSel = document.getElementById('m-parent');
            if(parentSel) {
                for (var i = 0; i < parentSel.options.length; i++) {
                    var opt = parentSel.options[i];
                    opt.disabled = (opt.value === id);
                }
                parentSel.value = parentId || '';
            }
            if(gModal) {
                gModal.showModal();
                setTimeout(function() { var b = document.getElementById('modal-close-btn'); if(b) b.focus(); }, 50);
            }
            if (tsControl) tsControl.clear();
            var role = document.getElementById('m-role'); if(role) role.value = 'member';
            var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
            var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
            window.resetAddButton();
            window.loadMembers(id);
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); window.resetAddButton(); };

        window.saveParent = function() {
            var sel = document.getElementById('m-parent');
            var pid = sel ? sel.value : '';
            fetch('/admin/am/groups/parent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: currentGroupId, parent_id: pid }) })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'err'); }); } return r.json(); })
            .then(function() { window.location.reload(); })
            .catch(function(e) {
                if (e.message === 'cycle' || e.message === 'self') { alert(i18n.alertCycle || 'Cannot set this parent.'); }
                else { alert('Error: ' + e.message); }
            });
        };

        window.resetAddButton = function() {
            var btn = document.getElementById('btn-add-member');
            if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> <span>' + (i18n.btnAdd || 'Add') + '</span>'; }
            var card = document.getElementById('add-form-card');
            if(card) { card.classList.remove('blink-active'); }
            if(tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
        };
        window.highlightAddForm = function() {
            var btn = document.getElementById('btn-add-member');
            if(btn) {
                btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>';
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            var card = document.getElementById('add-form-card');
            if(card) { card.classList.remove('blink-active'); void card.offsetWidth; card.classList.add('blink-active'); }
        };
        window.editMember = function(userId, role, startTs, endTs) {
            if (tsControl) { tsControl.setValue([userId]); }
            var roleEl = document.getElementById('m-role'); if(roleEl) roleEl.value = role || 'member';
            var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date(startTs * 1000).toISOString().split('T')[0];
            var vt = document.getElementById('m-valid-to');
            if(vt) { var isForever = endTs > 2000000000; vt.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
            window.highlightAddForm();
        };

        window.loadMembers = function(id) {
            fetch('/admin/api/am/group-members/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) { currentMembers = data.members || []; window.renderMembers(currentMembers); })
                .catch(function(e) { console.error(e); });
        };
        window.renderMembers = function(list) {
            var container = document.getElementById('modal-member-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = i18n.noMembers || '(No members)';
                container.appendChild(empty);
                return;
            }
            list.forEach(function(m) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';

                var row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';

                var left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';
                left.style.gap = '0.25rem';

                var titleWrap = document.createElement('div');
                titleWrap.style.display = 'flex';
                titleWrap.style.alignItems = 'center';
                titleWrap.style.gap = '0.5rem';

                var title = document.createElement('div');
                title.className = 'item-title';
                title.innerText = m.name ? m.name : m.email;
                titleWrap.appendChild(title);

                var isAdmin = m.role === 'group_admin';
                var badge = document.createElement('span');
                badge.textContent = isAdmin ? (i18n.roleAdmin || 'Group Admin') : (i18n.roleMember || 'Member');
                badge.style.fontSize = '0.72rem';
                badge.style.fontWeight = '700';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '999px';
                badge.style.color = isAdmin ? '#9a3412' : '#475569';
                badge.style.background = isAdmin ? '#ffedd5' : '#f1f5f9';
                titleWrap.appendChild(badge);
                left.appendChild(titleWrap);

                var meta = document.createElement('div');
                meta.className = 'item-sub';
                meta.style.fontSize = '0.85rem';
                meta.style.color = '#64748b';
                var dStart = new Date(m.valid_from * 1000).toLocaleDateString();
                var isForever = m.valid_to > 2000000000;
                var dEnd = isForever ? (i18n.termForever || 'Forever') : new Date(m.valid_to * 1000).toLocaleDateString();
                var sub = (m.name ? (m.email + ' \xB7 ') : '');
                meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:16px;">date_range</span> ' + sub + dStart + ' \uFF5E ' + dEnd + '</div>';
                left.appendChild(meta);

                row.appendChild(left);

                var right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '0.5rem';
                right.style.alignItems = 'center';

                var btnEdit = document.createElement('button');
                btnEdit.type = 'button';
                btnEdit.className = 'action-btn';
                btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                btnEdit.onclick = function() { window.editMember(m.user_id, m.role, m.valid_from, m.valid_to); };
                right.appendChild(btnEdit);

                var btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.className = 'action-btn delete';
                btnRemove.innerHTML = '<span class="material-symbols-outlined">person_remove</span>';
                btnRemove.onclick = function() { window.removeMember(m.id); };
                right.appendChild(btnRemove);

                row.appendChild(right);
                item.appendChild(row);
                container.appendChild(item);
            });
        };

        window.addMembers = function() {
            var userIds = [];
            if (tsControl) { userIds = tsControl.getValue(); if (!Array.isArray(userIds)) userIds = [userIds]; }
            userIds = userIds.filter(function(id) { return id !== ''; });
            if(userIds.length === 0) { alert(i18n.alertSelectUser || 'Select at least one user'); return; }
            var role = document.getElementById('m-role').value || 'member';
            var startVal = document.getElementById('m-valid-from').value;
            var endVal = document.getElementById('m-valid-to').value;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            fetch('/admin/api/am/membership/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, role: role, valid_from: validFrom, valid_to: validTo })
            })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
            .then(function() { window.resetAddButton(); window.loadMembers(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        var removeTargetId = null;
        window.removeMember = function(mid) {
            removeTargetId = mid;
            var rm = document.getElementById('remove-confirm-modal');
            if(rm) rm.showModal();
        };
        window.closeRemoveModal = function() {
            var rm = document.getElementById('remove-confirm-modal');
            if(rm) rm.close();
            removeTargetId = null;
        };
        window.executeRemove = function() {
            if(!removeTargetId) return;
            fetch('/admin/api/am/membership/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: removeTargetId }) })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
            .then(function() { window.closeRemoveModal(); window.loadMembers(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        var deleteTargetId = null;
        window.deleteGroup = function(gid, e) {
            if(e) e.stopPropagation();
            deleteTargetId = gid;
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.showModal();
        };
        window.closeDeleteModal = function() {
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.close();
            deleteTargetId = null;
        };
        window.executeDelete = function() {
            if(!deleteTargetId) return;
            var form = document.getElementById('delete-group-form');
            if (!form) return;
            var input = form.querySelector('input[name="id"]');
            if(input) input.value = deleteTargetId;
            form.submit();
        };

        window.calcDate = function(targetId, offset, unit) {
            var d = new Date();
            if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
            if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
            var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
        };
    })();
  `);
  const blinkActive = keyframes2`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  `;
  const listGrid = css2`display: flex; flex-direction: column; gap: 1rem;`;
  const listCard = css2`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover { outline: 1px solid var(--primary); }
  `;
  const itemTitle = css2`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;
  const itemSub = css2`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`;
  const actionBtn = css2`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important; padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `;
  const deleteBtn = css2`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;
  const addFormCard = css2`
    background: #ffffff;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    &.blink-active { animation: ${blinkActive} 1s ease-in-out 3; }
  `;
  const formLabel = css2`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`;
  const dateInput = css2`
    width: 100%; padding: 0.8rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #334155; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  `;
  const quickBtnGroup = css2`display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 0.75rem;`;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "am-groups",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html(_a6 || (_a6 = __template(['\n      <div>\n          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">\n            <hgroup>\n              <h2 style="margin-bottom: 0;">', '</h2>\n              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">', "</h3>\n            </hgroup>\n            ", "\n          </div>\n\n          ", '\n\n          <hr />\n\n          <form id="delete-group-form" method="POST" action="/admin/am/groups/delete">\n            <input type="hidden" name="id" value="" />\n          </form>\n\n          <div class="', '">\n            ', "\n            ", "\n          </div>\n\n          ", "\n\n          ", "\n\n          ", '\n\n          <div id="i18n-data" style="display:none;"\n            data-placeholder-select="', '"\n            data-text-no-results="', '"\n            data-term-forever="', '"\n            data-no-members="', '"\n            data-role-admin="', '"\n            data-role-member="', '"\n            data-alert-select-user="', '"\n            data-btn-add="', '"\n            data-btn-change="', '"\n            data-alert-cycle="', '"\n          ></div>\n\n          <script type="application/json" id="user-data">', "<\/script>\n\n          <script>\n          ", "\n          <\/script>\n      </div>\n    "])), t.am_section_groups, t.am_subtitle, Button({
      onclick: "document.getElementById('new-group-modal').showModal()",
      style: "width: auto; margin-bottom: 0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_group}`
    }), Modal({
      id: "new-group-modal",
      title: t.am_header_new_group,
      closeAction: "this.closest('dialog').close()",
      children: html`
                  <form method="POST" action="/admin/am/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.am_label_parent}</span>
                          <select name="parent_id">
                            <option value="">${t.am_parent_none}</option>
                            ${parentOptions.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
                          </select>
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.am_btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
    }), listGrid, flatTree.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : "", flatTree.map(({ g, depth }) => html`
              <div class="${listCard}" style="margin-left:${depth * 1.75}rem;" onclick="openGroupModal('${g.id}', '${g.name}', '${g.parent_id || ""}')">
                <div style="flex-grow:1; display:flex; align-items:center; gap:0.6rem;">
                    ${depth > 0 ? html`<span class="material-symbols-outlined" style="font-size:18px; color:#cbd5e1; flex-shrink:0;">subdirectory_arrow_right</span>` : ""}
                    <div>
                        <div class="${itemTitle}">${g.name}</div>
                        <div class="${itemSub}">
                            <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                            ${t.am_member_count.replace("{count}", String(g.member_count ?? 0))}
                        </div>
                    </div>
                </div>
                <div>
                     <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="deleteGroup('${g.id}', event)">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
              </div>
            `), Modal({
      id: "group-modal",
      title: html`${t.am_header_members}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
      closeAction: "closeGroupModal()",
      closeBtnId: "modal-close-btn",
      children: html`
                 <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.am_label_parent}</label>
                    <div style="display:flex; gap:0.5rem; align-items:stretch;">
                        <select id="m-parent" style="flex-grow:1; margin-bottom:0;">
                            <option value="">${t.am_parent_none}</option>
                            ${parentOptions.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                        ${Button({ onclick: "saveParent()", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                 </div>

                 <div id="add-form-card" class="${addFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.am_label_member}</label>
                       ${MultiSelect({
        id: "m-user-id",
        placeholder: t.placeholder_select,
        options: userOptions
      })}
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.am_label_role}</label>
                       <select id="m-role">
                          <option value="member">${t.am_role_member}</option>
                          <option value="group_admin">${t.am_role_group_admin}</option>
                       </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">${t.label_valid_from}</label>
                              <input type="date" id="m-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'month')", children: "-1\u30F6\u6708", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -7, 'day')", children: "-1\u9031\u9593", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'day')", children: "-1\u65E5", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="m-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                    </div>

                    ${Button({ id: "btn-add-member", onclick: "addMembers()", children: html`<span class="material-symbols-outlined">person_add</span> <span>${t.am_add_member}</span>` })}
                 </div>

                 <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.am_header_members}</h4>

                 <div id="modal-member-list"></div>
            `
    }), Modal({
      id: "remove-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
      closeAction: "closeRemoveModal()",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.am_confirm_remove_member}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRemoveModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeRemove()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">person_remove</span> ${t.am_btn_remove}
                      </button>
                  </div>
            `
    }), Modal({
      id: "delete-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete}</span>`,
      closeAction: "closeDeleteModal()",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.am_confirm_delete_group}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> ${t.delete}
                      </button>
                  </div>
            `
    }), t.placeholder_select, t.text_no_results, t.btn_term_forever, t.am_no_members, t.am_role_group_admin, t.am_role_member, t.am_alert_select_user, t.am_add_member, t.btn_change, t.am_alert_cycle, raw(allUsersJson), scriptContent)
  });
}, "AccountGroupsPage");

// src/views/admin/AccountServicesPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// src/views/admin/amShared.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var amListGrid = css2`display: flex; flex-direction: column; gap: 0.75rem;`;
var amListCard = css2`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;
var amItemTitle = css2`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;
var amItemSub = css2`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;`;
var amDeleteBtn = css2`
  background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
  padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
  &:hover { background: #fef2f2 !important; color: #ef4444 !important; }
`;
var amFormLabel = css2`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`;
var amBadge = css2`
  font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  color: #475569; background: #f1f5f9;
`;
var amEmpty = /* @__PURE__ */ __name((text) => html`<div style="text-align:center; padding:1.5rem; color:#94a3b8;">${text}</div>`, "amEmpty");
var amSectionHead = /* @__PURE__ */ __name((title3, subtitle, action) => html`
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem;">
    <hgroup>
      <h2 style="margin-bottom:0;">${title3}</h2>
      <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${subtitle}</h3>
    </hgroup>
    ${action || ""}
  </div>
`, "amSectionHead");
var amDeleteForm = /* @__PURE__ */ __name((action, id, confirmMsg, deleteTitle) => html`
  <form method="POST" action="${action}" style="margin:0;" onsubmit="return confirm(${JSON.stringify(confirmMsg)});">
    <input type="hidden" name="id" value="${id}" />
    <button type="submit" class="${amDeleteBtn}" title="${deleteTitle}">
      <span class="material-symbols-outlined">delete</span>
    </button>
  </form>
`, "amDeleteForm");
var todayStr = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0], "todayStr");
var plusYearStr = /* @__PURE__ */ __name((n) => {
  const d = /* @__PURE__ */ new Date();
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().split("T")[0];
}, "plusYearStr");

// src/views/admin/AccountServicesPage.tsx
var AccountServicesPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const fmt = /* @__PURE__ */ __name((ts) => new Date(ts * 1e3).toLocaleDateString(), "fmt");
  const serviceLabel = /* @__PURE__ */ __name((s) => t.am_service_of_provider.replace("{service}", s.name).replace("{provider}", s.provider_name || ""), "serviceLabel");
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "am-services",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_section_services, t.am_services_subtitle)}

      <!-- ① 提供企業 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_providers_header}</h4>
          ${Button({
      onclick: "document.getElementById('new-provider-modal').showModal()",
      style: "width:auto; margin:0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_provider}`
    })}
        </div>
        <div class="${amListGrid}">
          ${props.providers.length === 0 ? amEmpty(t.am_none_providers) : ""}
          ${props.providers.map((p) => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${p.name}</div>
                <div class="${amItemSub}"><span class="material-symbols-outlined" style="font-size:16px;">apps</span>
                  ${props.services.filter((s) => s.provider_id === p.id).length} ${t.am_services_header}</div>
              </div>
              ${amDeleteForm("/admin/am/providers/delete", p.id, t.am_confirm_delete_provider, t.delete)}
            </div>`)}
        </div>
      </article>

      <!-- ② サービス -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_services_header}</h4>
          ${Button({
      onclick: "document.getElementById('new-service-modal').showModal()",
      style: "width:auto; margin:0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_service}`
    })}
        </div>
        <div class="${amListGrid}">
          ${props.services.length === 0 ? amEmpty(t.am_none_services) : ""}
          ${props.services.map((s) => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${s.name}</div>
                <div class="${amItemSub}"><span class="material-symbols-outlined" style="font-size:16px;">business</span>${s.provider_name || ""}</div>
              </div>
              ${amDeleteForm("/admin/am/services/delete", s.id, t.am_confirm_delete_service, t.delete)}
            </div>`)}
        </div>
      </article>

      <!-- ③ 契約 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_contracts_header}</h4>
          ${Button({
      onclick: "document.getElementById('new-contract-modal').showModal()",
      style: "width:auto; margin:0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_contract}`
    })}
        </div>
        <div class="${amListGrid}">
          ${props.contracts.length === 0 ? amEmpty(t.am_none_contracts) : ""}
          ${props.contracts.map((ct) => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${serviceLabel({ name: ct.service_name || "", provider_name: ct.provider_name })}</div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">corporate_fare</span>${ct.group_name || ""}
                  <span class="${amBadge}">${ct.seat_limit == null ? t.am_seat_unlimited : t.am_label_seat_limit + ": " + ct.seat_limit}</span>
                  <span style="color:#94a3b8;">${fmt(ct.valid_from)} ～ ${fmt(ct.valid_to)}</span>
                </div>
              </div>
              ${amDeleteForm("/admin/am/contracts/delete", ct.id, t.am_confirm_delete_contract, t.delete)}
            </div>`)}
        </div>
      </article>

      ${Modal({
      id: "new-provider-modal",
      title: t.am_btn_add_provider,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/providers">
            <label class="${amFormLabel}">${t.am_label_provider_name}</label>
            <input type="text" name="name" placeholder="${t.am_placeholder_provider_name}" required />
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    })}

      ${Modal({
      id: "new-service-modal",
      title: t.am_btn_add_service,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/services">
            <label class="${amFormLabel}">${t.am_label_provider}</label>
            <select name="provider_id" required style="margin-bottom:1rem;">
              ${props.providers.map((p) => html`<option value="${p.id}">${p.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_service_name}</label>
            <input type="text" name="name" placeholder="${t.am_placeholder_service_name}" required />
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    })}

      ${Modal({
      id: "new-contract-modal",
      title: t.am_btn_add_contract,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/contracts">
            <label class="${amFormLabel}">${t.am_label_contract_service}</label>
            <select name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map((s) => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_customer_group}</label>
            <select name="customer_group_id" required style="margin-bottom:1rem;">
              ${props.groups.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_seat_limit}</label>
            <input type="number" name="seat_limit" min="0" placeholder="${t.am_placeholder_seat}" style="margin-bottom:1rem;" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div><label class="${amFormLabel}">${t.label_valid_from}</label>
                <input type="date" name="valid_from" value="${todayStr()}" required /></div>
              <div><label class="${amFormLabel}">${t.label_valid_to}</label>
                <input type="date" name="valid_to" value="${plusYearStr(1)}" required /></div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    })}
    `
  });
}, "AccountServicesPage");

// src/views/admin/AccountGrantsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var AccountGrantsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const fmt = /* @__PURE__ */ __name((ts) => new Date(ts * 1e3).toLocaleDateString(), "fmt");
  const contractLabel = /* @__PURE__ */ __name((ct) => `${t.am_service_of_provider.replace("{service}", ct.service_name || "").replace("{provider}", ct.provider_name || "")} / ${ct.group_name || ""}`, "contractLabel");
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "am-grants",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      ${amSectionHead(
      t.am_section_grants,
      t.am_grants_subtitle,
      props.contracts.length > 0 ? Button({
        onclick: "document.getElementById('new-grant-modal').showModal()",
        style: "width:auto; margin:0;",
        children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_grant}`
      }) : ""
    )}

      ${props.contracts.length === 0 ? html`
        <article style="padding:1.5rem; color:#64748b;">${t.am_none_contracts}</article>` : ""}

      <div class="${amListGrid}">
        ${props.grants.length === 0 ? amEmpty(t.am_none_grants) : ""}
        ${props.grants.map((g) => html`
          <div class="${amListCard}">
            <div>
              <div class="${amItemTitle}">${g.group_name || ""}</div>
              <div class="${amItemSub}">
                <span class="material-symbols-outlined" style="font-size:16px;">deployed_code</span>
                ${t.am_service_of_provider.replace("{service}", g.service_name || "").replace("{provider}", g.provider_name || "")}
                <span class="${amBadge}">${g.seat_limit == null ? t.am_seat_unlimited : t.am_label_seat_limit + ": " + g.seat_limit}</span>
                <span style="color:#94a3b8;">${fmt(g.valid_from)} ～ ${fmt(g.valid_to)}</span>
              </div>
            </div>
            ${amDeleteForm("/admin/am/grants/delete", String(g.id), t.am_confirm_delete_grant, t.delete)}
          </div>`)}
      </div>

      ${Modal({
      id: "new-grant-modal",
      title: t.am_btn_add_grant,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/grants">
            <label class="${amFormLabel}">${t.am_label_grant_group}</label>
            <select name="group_id" required style="margin-bottom:1rem;">
              ${props.groups.map((gr) => html`<option value="${gr.id}">${gr.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_grant_contract}</label>
            <select name="contract_id" required style="margin-bottom:1rem;">
              ${props.contracts.map((ct) => html`<option value="${ct.id}">${contractLabel(ct)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_seat_limit}</label>
            <input type="number" name="seat_limit" min="0" placeholder="${t.am_placeholder_seat}" style="margin-bottom:1rem;" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div><label class="${amFormLabel}">${t.label_valid_from}</label>
                <input type="date" name="valid_from" value="${todayStr()}" required /></div>
              <div><label class="${amFormLabel}">${t.label_valid_to}</label>
                <input type="date" name="valid_to" value="${plusYearStr(1)}" required /></div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    })}
    `
  });
}, "AccountGrantsPage");

// src/views/admin/AccountFacilitiesPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var AccountFacilitiesPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "am-facilities",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      ${amSectionHead(
      t.am_section_facilities,
      t.am_facilities_subtitle,
      props.groups.length > 0 ? Button({
        onclick: "document.getElementById('new-facility-modal').showModal()",
        style: "width:auto; margin:0;",
        children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_facility}`
      }) : ""
    )}

      <div class="${amListGrid}">
        ${props.facilities.length === 0 ? amEmpty(t.am_none_facilities) : ""}
        ${props.facilities.map((f) => html`
          <div class="${amListCard}">
            <div>
              <div class="${amItemTitle}">${f.structure_no || f.id}</div>
              <div class="${amItemSub}">
                <span class="material-symbols-outlined" style="font-size:16px;">corporate_fare</span>${f.group_name || ""}
                ${f.building_use ? html`<span class="${amBadge}">${f.building_use}</span>` : ""}
              </div>
            </div>
            ${amDeleteForm("/admin/am/facilities/delete", f.id, t.am_confirm_delete_facility, t.delete)}
          </div>`)}
      </div>

      ${Modal({
      id: "new-facility-modal",
      title: t.am_btn_add_facility,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/facilities">
            <label class="${amFormLabel}">${t.am_label_managing_group}</label>
            <select name="managing_group_id" required style="margin-bottom:1rem;">
              ${props.groups.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_structure_no}</label>
            <input type="text" name="structure_no" required style="margin-bottom:1rem;" />
            <label class="${amFormLabel}">${t.am_label_building_use}</label>
            <input type="text" name="building_use" placeholder="${t.am_placeholder_building_use}" />
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    })}
    `
  });
}, "AccountFacilitiesPage");

// src/views/admin/AccountAssignmentsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a7;
var AccountAssignmentsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const fmt = /* @__PURE__ */ __name((ts) => new Date(ts * 1e3).toLocaleDateString(), "fmt");
  const serviceLabel = /* @__PURE__ */ __name((s) => t.am_service_of_provider.replace("{service}", s.name).replace("{provider}", s.provider_name || ""), "serviceLabel");
  const rolesJson = JSON.stringify(props.roles.map((r) => ({ id: r.id, service_id: r.service_id, facility_type: r.facility_type ?? null, role_name: r.role_name })));
  const facUseJson = JSON.stringify(Object.fromEntries(props.facilities.map((f) => [f.id, f.building_use ?? null])));
  const errorMsg = props.error === "no_grant" ? t.am_grants_subtitle : props.error === "seat" ? t.am_alert_seat_exceeded : props.error === "no_role" ? t.am_alert_no_role : "";
  const script2 = raw(`
    (function() {
      var ROLES = ${rolesJson};
      var FAC_USE = ${facUseJson};
      var i18nNoRole = ${JSON.stringify(t.am_alert_no_role)};
      function refreshRoles() {
        var svc = document.getElementById('a-service');
        var fac = document.getElementById('a-facility');
        var role = document.getElementById('a-role');
        if (!svc || !fac || !role) return;
        var use = FAC_USE[fac.value] || null;
        var matched = ROLES.filter(function(r){ return r.service_id === svc.value && (r.facility_type == null || r.facility_type === use); });
        role.innerHTML = '';
        if (matched.length === 0) {
          var o = document.createElement('option'); o.value=''; o.textContent = i18nNoRole; o.disabled = true; o.selected = true;
          role.appendChild(o);
          return;
        }
        matched.forEach(function(r){ var o = document.createElement('option'); o.value = r.id; o.textContent = r.role_name; role.appendChild(o); });
      }
      window.amRefreshRoles = refreshRoles;
      document.addEventListener('DOMContentLoaded', function(){
        var svc = document.getElementById('a-service');
        var fac = document.getElementById('a-facility');
        if (svc) svc.addEventListener('change', refreshRoles);
        if (fac) fac.addEventListener('change', refreshRoles);
        refreshRoles();
      });
    })();
  `);
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "am-assignments",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html(_a7 || (_a7 = __template(["\n      ", "\n\n      ", '\n\n      <!-- \u5F79\u5272\u30DE\u30B9\u30BF -->\n      <article style="padding:1.5rem; margin-bottom:1.5rem;">\n        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">\n          <h4 style="margin:0; font-size:1.1rem; color:#334155;">', "</h4>\n          ", '\n        </div>\n        <div class="', '">\n          ', "\n          ", '\n        </div>\n      </article>\n\n      <!-- \u5229\u7528\u8005\u5272\u5F53 -->\n      <article style="padding:1.5rem; margin-bottom:1.5rem;">\n        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">\n          <h4 style="margin:0; font-size:1.1rem; color:#334155;">', "</h4>\n          ", '\n        </div>\n        <div class="', '">\n          ', "\n          ", "\n        </div>\n      </article>\n\n      ", "\n\n      ", "\n\n      <script>", "<\/script>\n    "])), amSectionHead(t.am_section_assignments, t.am_assignments_subtitle), errorMsg ? html`<article style="padding:1rem 1.25rem; margin-bottom:1.5rem; background:#fef2f2 !important; border-color:#fecaca; color:#b91c1c; display:flex; align-items:center; gap:0.5rem;">
        <span class="material-symbols-outlined">error</span>${errorMsg}</article>` : "", t.am_roles_header, props.services.length > 0 ? Button({
      onclick: "document.getElementById('new-role-modal').showModal()",
      style: "width:auto; margin:0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_role}`
    }) : "", amListGrid, props.roles.length === 0 ? amEmpty(t.am_none_roles) : "", props.roles.map((r) => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${r.role_name}</div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">deployed_code</span>
                  ${serviceLabel({ name: r.service_name || "", provider_name: r.provider_name })}
                  <span class="${amBadge}">${r.facility_type ? r.facility_type : t.am_facility_type_all}</span>
                </div>
              </div>
              ${amDeleteForm("/admin/am/roles/delete", String(r.id), t.am_confirm_delete_role, t.delete)}
            </div>`), t.am_assignments_header, props.services.length > 0 && props.facilities.length > 0 && props.roles.length > 0 && props.users.length > 0 ? Button({
      onclick: "document.getElementById('new-assignment-modal').showModal(); window.amRefreshRoles && window.amRefreshRoles();",
      style: "width:auto; margin:0;",
      children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_assignment}`
    }) : "", amListGrid, props.assignments.length === 0 ? amEmpty(t.am_none_assignments) : "", props.assignments.map((a) => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${a.user_name || a.user_email || ""}</div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">badge</span>${a.role_name || ""}
                  <span class="${amBadge}">${a.service_name || ""}</span>
                  <span style="color:#94a3b8;"><span class="material-symbols-outlined" style="font-size:14px;">apartment</span> ${a.structure_no || a.facility_id} · ${a.group_name || ""}</span>
                  <span style="color:#94a3b8;">${fmt(a.valid_from)} ～ ${fmt(a.valid_to)}</span>
                </div>
              </div>
              ${amDeleteForm("/admin/am/assignments/delete", String(a.id), t.am_confirm_delete_assignment, t.delete)}
            </div>`), Modal({
      id: "new-role-modal",
      title: t.am_btn_add_role,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/roles">
            <label class="${amFormLabel}">${t.am_label_role_service}</label>
            <select name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map((s) => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_role_facility_type}</label>
            <input type="text" name="facility_type" placeholder="${t.am_facility_type_all}" style="margin-bottom:1rem;" />
            <label class="${amFormLabel}">${t.am_label_role_name}</label>
            <input type="text" name="role_name" placeholder="${t.am_placeholder_role_name}" required />
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    }), Modal({
      id: "new-assignment-modal",
      title: t.am_btn_add_assignment,
      closeAction: "this.closest('dialog').close()",
      children: html`
          <form method="POST" action="/admin/am/assignments">
            <label class="${amFormLabel}">${t.am_label_assign_user}</label>
            <select name="user_id" required style="margin-bottom:1rem;">
              ${props.users.map((u) => html`<option value="${u.id}">${u.name ? `${u.name} <${u.email}>` : u.email}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_group}</label>
            <select name="group_id" required style="margin-bottom:1rem;">
              ${props.groups.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_service}</label>
            <select id="a-service" name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map((s) => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_facility}</label>
            <select id="a-facility" name="facility_id" required style="margin-bottom:1rem;">
              ${props.facilities.map((f) => html`<option value="${f.id}">${f.structure_no || f.id}${f.building_use ? ` (${f.building_use})` : ""}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_role}</label>
            <select id="a-role" name="service_role_id" required style="margin-bottom:1rem;"></select>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div><label class="${amFormLabel}">${t.label_valid_from}</label>
                <input type="date" name="valid_from" value="${todayStr()}" required /></div>
              <div><label class="${amFormLabel}">${t.label_valid_to}</label>
                <input type="date" name="valid_to" value="${plusYearStr(1)}" required /></div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: "submit", children: t.save })}</div>
          </form>`
    }), script2)
  });
}, "AccountAssignmentsPage");

// src/views/admin/UsersPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var _a8;
var UsersPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const allAppsJson = JSON.stringify(props.apps.map((a) => ({ value: a.id, text: a.name })));
  const scriptContent = raw(`
        (function() {
            var i18nEl = document.getElementById('i18n-data');
            var i18n = i18nEl ? i18nEl.dataset : {};
            var ALL_APPS = [];
            try {
                var appDataEl = document.getElementById('app-data');
                if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
            } catch(e) { console.error(e); }
            var tsControl = null;
            var currentExistingIds = []; 
            var currentUserPermissions = []; 
            
            // Global state for bulk mode
            window.isBulkMode = false;

            document.addEventListener('DOMContentLoaded', function() {
                if (typeof TomSelect !== 'undefined') {
                    tsControl = new TomSelect('#perm-app-id', { 
                        plugins: ['remove_button'], 
                        create: false, 
                        maxItems: null, 
                        placeholder: i18n.placeholderSelect || 'Select...',
                        render: {
                            option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                            item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                            no_results: function(data, escape) {
                                return '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>';
                            }
                        }
                    });
                }
                var filterCheck = document.getElementById('exclude-existing-check');
                if (filterCheck) { filterCheck.addEventListener('change', refreshAppOptions); }
            });
            function refreshAppOptions() {
                if (!tsControl) return;
                var exclude = document.getElementById('exclude-existing-check').checked;
                tsControl.clearOptions();
                var optionsToShow = ALL_APPS;
                if (exclude) { optionsToShow = ALL_APPS.filter(function(app) { return !currentExistingIds.includes(app.value); }); }
                tsControl.addOption(optionsToShow);
                tsControl.refreshOptions(false); 
            }
            window.toggleAllCheckboxes = function(source) {
                var checkboxes = document.querySelectorAll('.user-check');
                for(var i=0; i<checkboxes.length; i++) { checkboxes[i].checked = source.checked; }
            };
            window.handleUserCardClick = function(e, id) {
                if (e.target.closest('button') || e.target.closest('a') || e.target.tagName === 'INPUT') return;

                if (window.isBulkMode) {
                    var cb = document.querySelector('input.user-check[value="' + id + '"]');
                    if (cb) cb.checked = !cb.checked;
                } else {
                    window.openUserModal(id);
                }
            };
            window.deleteUser = function(id) {
                if(!confirm(i18n.deleteConfirm)) return;
                var form = document.getElementById('delete-user-form');
                if (!form) return;
                var input = form.querySelector('input[name="id"]');
                input.value = id;
                form.submit();
            };
            var modal = document.getElementById('user-modal');
            var currentUserId = '';
            window.openUserModal = function(id) {
                currentUserId = id;
                if(modal) {
                    modal.showModal();
                    setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) { closeBtn.focus(); closeBtn.blur(); closeBtn.focus(); } }, 50);
                }
                if (tsControl) tsControl.clear();
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) validTo.value = '';
                window.resetGrantButton();
                fetch('/admin/api/user-details/' + id + '?t=' + new Date().getTime())
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        var emailEl = document.getElementById('modal-user-email');
                        if(emailEl) emailEl.innerText = data.email;
                        var groupSel = document.getElementById('modal-group-select');
                        if(groupSel) groupSel.value = data.group_id || '';
                        window.renderPerms(data.permissions);
                        currentUserPermissions = data.permissions;
                        currentExistingIds = data.permissions.map(function(p) { return p.app_id; });
                        refreshAppOptions();
                    })
                    .catch(function(e) { console.error(e); });
            };
            window.closeUserModal = function() { if(modal) modal.close(); window.resetGrantButton(); };
            window.resetGrantButton = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
                var card = document.getElementById('grant-form-card');
                if(card) { card.classList.remove('blink-active'); }
                if(tsControl) { tsControl.settings.maxItems = null; tsControl.refreshOptions(); }
            };
            window.highlightGrantForm = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '\u5909\u66F4') + '</span>'; btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                
                var card = document.getElementById('grant-form-card');
                if(card) { 
                    card.classList.remove('blink-active'); 
                    void card.offsetWidth;
                    card.classList.add('blink-active'); 
                }
            };
            window.editPerm = function(appId, startTs, endTs) {
                var filterCheck = document.getElementById('exclude-existing-check');
                if(filterCheck && filterCheck.checked) { filterCheck.checked = false; refreshAppOptions(); }
                if (tsControl) { tsControl.setValue([appId]); }
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) { var isForever = endTs > 2000000000; validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
                window.highlightGrantForm();
            };
            window.renderPerms = function(list) {
                var container = document.getElementById('modal-perm-list');
                if(!container) return;
                container.innerHTML = '';
                if (!list || list.length === 0) {
                    var empty = document.createElement('div');
                    empty.style.textAlign = 'center';
                    empty.style.padding = '2rem';
                    empty.style.color = 'var(--text-sub)';
                    empty.textContent = i18n.noAffiliation || '(None)';
                    container.appendChild(empty);
                    return;
                }
                list.forEach(function(p) {
                    var item = document.createElement('div');
                    item.style.padding = '0.75rem 0';
                    item.style.borderBottom = '1px solid #f1f5f9';
                    
                    var row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center'; // Center vertically
                    
                    var left = document.createElement('div');
                    left.style.display = 'flex';
                    left.style.flexDirection = 'column';
                    left.style.gap = '0.2rem';
                    
                    var title = document.createElement('div');
                    title.className = 'item-title';
                    title.innerText = p.app_name || 'Unknown';
                    left.appendChild(title);
                    
                    var meta = document.createElement('div');
                    meta.className = 'item-sub';
                    var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                    var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                    var isForever = p.valid_to > 2000000000;
                    var dateHtml = dateStrStart + ' \uFF5E ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);
                    var sourceIcon = p.source === 'group' ? 'domain' : 'person';
                    var sourceText = p.source === 'group' ? (i18n.sourceGroup || 'Group') : (i18n.sourceUser || 'User');
                    var sourceColor = p.source === 'group' ? '#94a3b8' : 'var(--primary)';
                    
                    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px; color:'+sourceColor+'">' + sourceIcon + '</span> ' + sourceText + ' : ' + dateHtml + '</div>';
                    if(p.is_override) meta.innerHTML += ' <span style="color:#d97706; margin-left:4px;">\u26A0</span>';
                    left.appendChild(meta);
                    
                    row.appendChild(left);
                    
                    var right = document.createElement('div');
                    right.style.display = 'flex';
                    right.style.gap = '0.5rem';
                    right.style.alignItems = 'center';
                    
                    if (p.source === 'user') {
                        var btnEdit = document.createElement('button');
                        btnEdit.type = 'button';
                        btnEdit.className = 'action-btn';
                        btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                        btnEdit.onclick = function() { window.editPerm(p.app_id, p.valid_from, p.valid_to); };
                        right.appendChild(btnEdit);
                        var btnRevoke = document.createElement('button');
                        btnRevoke.type = 'button';
                        btnRevoke.className = 'action-btn delete';
                        btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                        btnRevoke.onclick = function() { window.revokePerm(p.id); };
                        right.appendChild(btnRevoke);
                    } else {
                        right.innerHTML = '<span class="material-symbols-outlined" style="color:#cbd5e1;">lock</span>';
                    }
                    row.appendChild(right);
                    item.appendChild(row);
                    container.appendChild(item);
                });
            };
            window.calcDate = function(targetId, offset, unit) {
                var d = new Date();
                if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
                if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
                var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
            };
            window.grantPermission = function() {
                var dateVal = document.getElementById('perm-valid-to').value;
                var startVal = document.getElementById('perm-valid-from').value;
                var dateStrStart = new Date(startVal).toLocaleDateString();
                var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
                var appIds = [];
                if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
                else { var appSelect = document.getElementById('perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
                appIds = appIds.filter(function(id) { return id !== ''; });
                if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
                var warningMessages = [];
                appIds.forEach(function(id) {
                    var existing = currentUserPermissions.find(function(p) { return p.app_id === id && p.source === 'user'; });
                    if (existing) {
                        var exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
                        var isForever = existing.valid_to > 2000000000;
                        var exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
                        warningMessages.push('\u30FB' + existing.app_name + ' (' + exStart + ' \uFF5E ' + exEnd + ')');
                    }
                });
                if (warningMessages.length > 0) {
                    var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\\\n{list}';
                    var listStr = warningMessages.join('\\\\n');
                    var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                    if (!confirm(msg)) return;
                }
                var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
                var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
                fetch('/admin/api/user/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUserId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
                .then(function(r) { return r.json(); })
                .then(function() { window.openUserModal(currentUserId); window.resetGrantButton(); })
                .catch(function(e) { 
                    console.error(e); 
                    var tmpl = i18n.alertError || 'Error: {message}';
                    alert(tmpl.replace('{message}', e)); 
                });
            };
            var revokeTargetId = null;
            window.revokePerm = function(pid) {
                revokeTargetId = pid;
                var errEl = document.getElementById('revoke-error-msg');
                if(errEl) errEl.style.display = 'none';
                var rm = document.getElementById('revoke-confirm-modal');
                if(rm) {
                    rm.showModal();
                    setTimeout(function() { var closeBtn = document.getElementById('revoke-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
                }
            };
            window.closeRevokeModal = function() {
                var rm = document.getElementById('revoke-confirm-modal');
                if(rm) rm.close();
                revokeTargetId = null;
            };
            window.executeRevoke = function() {
                if(!revokeTargetId) return;
                var errEl = document.getElementById('revoke-error-msg');
                if(errEl) errEl.style.display = 'none';
                
                fetch('/admin/api/user/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: revokeTargetId}) })
                .then(function(r) { 
                    if(!r.ok) {
                        return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server error ' + r.status); });
                    }
                    return r.json(); 
                })
                .then(function() { 
                    window.closeRevokeModal();
                    window.openUserModal(currentUserId); 
                })
                .catch(function(e) {
                    console.error('Revoke error:', e);
                    if(errEl) {
                        var tmpl = i18n.alertError || 'Error: {message}';
                        errEl.textContent = tmpl.replace('{message}', e.message);
                        errEl.style.display = 'block';
                    } else {
                        alert('Error: ' + e.message);
                    }
                });
            };
            window.updateUserGroup = function() {
                var gid = document.getElementById('modal-group-select').value;
                fetch('/admin/api/user/group', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: currentUserId, group_id: gid}) })
                .then(function(r) { if (!r.ok) { return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server returned ' + r.status); }); } return r.json(); })
                .then(function() { window.closeUserModal(); window.location.reload(); })
                .catch(function(e) { 
                    var tmpl = i18n.alertUpdateFail || 'Update failed: {message}';
                    alert(tmpl.replace('{message}', e.message)); 
                    console.error(e);
                });
            };
            var btn = document.getElementById('toggleBulkMode');
            var controls = document.getElementById('bulkControls');
            var selectAllContainer = document.getElementById('selectAllContainer');
            
            if(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.isBulkMode = !window.isBulkMode;
                    
                    var iconName = window.isBulkMode ? 'close' : 'bolt';
                    var text = window.isBulkMode ? (i18n.btnExit || 'Exit') : (i18n.btnEnter || 'Bulk Mode');
                    
                    btn.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span> ' + text;
                    
                    if(controls) controls.style.display = window.isBulkMode ? 'block' : 'none';
                    if(selectAllContainer) selectAllContainer.style.display = window.isBulkMode ? 'block' : 'none';
                    
                    document.querySelectorAll('.col-select').forEach(function(el) { el.style.display = window.isBulkMode ? 'table-cell' : 'none'; });
                });
            }
        })();
    `);
  const blinkActive = keyframes2`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    `;
  const listGrid = css2`display: flex; flex-direction: column; gap: 1rem;`;
  const listCard = css2`
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        cursor: pointer;
        &:hover {
            outline: 1px solid var(--primary);
        }
    `;
  const itemTitle = css2`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;
  const itemSub = css2`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`;
  const grantFormCard = css2`
        background: #ffffff;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
        &.blink-active { animation: ${blinkActive} 1s ease-in-out 3; }
    `;
  const formLabel = css2`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`;
  const dateInput = css2`
        width: 100%; padding: 0.8rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #334155; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    `;
  const quickBtnGroup = css2`display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 0.75rem;`;
  const actionBtn = css2`
        background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important; padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
        &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
    `;
  const deleteBtn = css2`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;
  const checkboxLabel = css2`display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.95rem; color: #475569; cursor: pointer; width: fit-content; & input { width: 1.1em; height: 1.1em; cursor: pointer; }`;
  const selectAllLabel = css2`
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: #fff;
        transition: all 0.2s;
        font-size: 0.9rem;
        color: #475569;
        font-weight: 500;
        user-select: none;

        &:hover {
            background: #f8fafc;
            border-color: #94a3b8;
        }
        
        & input {
            display: none;
        }
        
        & .icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.1rem;
            height: 1.1rem;
            border-radius: 4px;
            border: 2px solid #cbd5e1;
            background: #fff;
            transition: all 0.2s;
            color: white;
        }

        /* Checked state */
        &:has(input:checked) {
            background: #eff6ff;
            border-color: var(--primary);
            color: var(--primary);
        }

        &:has(input:checked) .icon-box {
            background: var(--primary);
            border-color: var(--primary);
        }
        
        /* Fallback for browsers not supporting :has */
        & input:checked + .icon-box {
            background: var(--primary);
            border-color: var(--primary);
        }
    `;
  const pageWrapper = css2``;
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "users",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html(_a8 || (_a8 = __template(['\n      <div class="', '">\n          <div class="grid">\n            <hgroup>\n              <h2 style="margin-bottom:0; font-size:1.5rem;">', '</h2>\n              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">', '</h3>\n            </hgroup>\n            <div style="text-align:right; display: flex; justify-content: flex-end; align-items: start;">\n               ', "\n               ", "\n            </div>\n          </div>\n          \n          ", "\n\n          ", '\n\n          <hr />\n\n          <form id="bulkForm" method="POST" action="/admin/users/bulk">\n            <div id="bulkControls" style="display:none; background:#f0f7ff; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #cce5ff;">\n                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">\n                    <h4 style="margin:0; font-size:1.1rem; color:#0369a1;">', '</h4>\n                </div>\n                <div class="grid">\n                    <label>\n                        <span class="', '">', '</span>\n                        <select name="group_id">\n                            <option value="">(No Change)</option>\n                            <option value="__CLEAR__">', "</option>\n                            ", '\n                        </select>\n                    </label>\n                    <label>\n                        <span class="', '">', '</span>\n                        <select name="app_id">\n                            <option value="">(None)</option>\n                            ', '\n                        </select>\n                    </label>\n                </div>\n                <button type="submit" style="width: auto; min-width: 150px; margin-top:1rem; background:#0284c7; border:none;">\n                    <span class="material-symbols-outlined" style="margin-right: 4px;">done_all</span> ', '\n                </button>\n            </div>\n\n            <div style="margin-bottom:1rem;">\n                <h3 style="font-size:1.2rem; font-weight:600; margin-bottom:0.5rem;">', '</h3>\n                \n                <div id="selectAllContainer" style="display:none; margin-top: 0.5rem; margin-left: 0.7rem;">\n                    <label class="', '">\n                        <input type="checkbox" onclick="toggleAllCheckboxes(this)">\n                        <span class="icon-box">\n                            <span class="material-symbols-outlined" style="font-size: 16px;">check</span>\n                        </span>\n                        <span>Select All</span>\n                    </label>\n                </div>\n            </div>\n            \n            <div class="', '">\n                ', '\n            </div>\n          </form>\n\n          <form id="delete-user-form" method="POST" action="/admin/users/delete">\n            <input type="hidden" name="id" value="" />\n          </form>\n\n          ', "\n\n          ", '\n\n          <div id="i18n-data" style="display:none;"\n            data-delete-confirm="', '"\n            data-msg-revoke="', '"\n            data-btn-grant="', '"\n            data-btn-apply="', '"\n            data-btn-change="\u5909\u66F4"\n            data-btn-exit="', '"\n            data-btn-enter="', '"\n            data-no-affiliation="', '"\n            data-msg-override="', '"\n            data-term-forever="', '"\n            data-source-group="', '"\n            data-source-user="', '"\n            data-msg-overwrite-confirm="', '"\n            data-alert-select-app="', '"\n            data-alert-update-fail="', '"\n            data-alert-error="', '"\n            data-placeholder-select="', '" \n            data-text-no-results="', '"\n          ></div>\n          \n          <script type="application/json" id="app-data">', "<\/script>\n\n          <script>\n          ", "\n          ", "\n          <\/script>\n      </div>\n    "])), pageWrapper, t.section_users, t.header_invite, Button({
      id: "toggleBulkMode",
      variant: "outline",
      style: "width: auto; margin-bottom: 0;",
      children: html`<span class="material-symbols-outlined">bolt</span> ${t.btn_bulk_mode}`
    }), Button({
      onclick: "document.getElementById('invite-modal').showModal()",
      style: "width: auto; margin-bottom: 0; margin-left: 1rem;",
      children: html`<span class="material-symbols-outlined">add</span> ${t.header_invite}`
    }), props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828; margin-bottom:1rem;">${props.error}</article>` : "", Modal({
      id: "invite-modal",
      title: t.header_invite,
      closeAction: "this.closest('dialog').close()",
      children: html`
                  <form method="POST" action="/admin/invite">
                    <div class="grid-vertical">
                        <label style="margin-bottom:0; width:100%;">
                            <span class="${formLabel}">${t.email}</span>
                            <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: html`<span class="material-symbols-outlined">send</span> ${t.btn_generate_invite}` })}
                        </div>
                    </div>
                  </form>
                  ${props.inviteUrl ? html`
                    <div style="background:#e8f5e9; padding:1rem; border-radius:8px; margin-top:1.5rem; border:1px solid #bbf7d0;">
                        <strong style="color:#15803d;">${t.invite_created}</strong><br>
                        <small style="color:#166534;">${t.invite_copy_hint}</small><br>
                        <input type="text" value="${props.inviteUrl}" readonly onclick="this.select()" style="margin-top:0.5rem; background:white;" />
                    </div>
                  ` : ""}
            `
    }), t.btn_bulk_mode, formLabel, t.modal_section_group, t.no_affiliation, props.groups.map((g) => html`<option value="${g.id}">${g.name}</option>`), formLabel, t.modal_section_add, props.apps.map((a) => html`<option value="${a.id}">${a.name}</option>`), t.btn_bulk_apply, t.header_registered_users, selectAllLabel, listGrid, props.users.map((u) => {
      const g = props.groups.find((x) => x.id === u.group_id);
      const gName = g ? g.name : t.no_affiliation;
      return html`
                <div class="${listCard}" onclick="handleUserCardClick(event, '${u.id}')">
                    <div style="display:flex; align-items:center; gap:1rem; flex-grow:1;">
                        <div class="col-select" style="display:none;" onclick="event.stopPropagation()">
                            <input type="checkbox" name="ids" value="${u.id}" class="user-check" style="margin:0; width:1.2em; height:1.2em;" />
                        </div>
                        <div>
                            <div class="${itemTitle}">${u.email}</div>
                            <div class="${itemSub}">
                                <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                                ${gName}
                            </div>
                        </div>
                    </div>
                    <div>
                         <button type="button" class="${deleteBtn}" onclick="event.stopPropagation(); deleteUser('${u.id}')" title="${t.delete}">
                            <span class="material-symbols-outlined">delete</span>
                         </button>
                    </div>
                </div>
                `;
    }), Modal({
      id: "user-modal",
      title: html`${t.header_user_details} <span id="modal-user-email" style="font-weight:400; font-size:1rem; color:#64748b; margin-left:0.5rem;"></span>`,
      closeAction: "closeUserModal()",
      closeBtnId: "modal-close-btn",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.modal_section_group}</label>
                    <div style="display: flex; gap: 0.5rem; align-items: stretch;">
                        <select id="modal-group-select" style="flex-grow: 1; margin-bottom: 0;">
                            <option value="">${t.no_affiliation}</option>
                            ${props.groups.map((g) => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                        ${Button({ onclick: "updateUserGroup()", variant: "primary", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                    <small style="color:#94a3b8; margin-top:0.4rem; display:block;">${t.desc_group_override}</small>
                  </div>

                  <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:600; color:#334155;">${t.tab_permissions}</h4>
                  
                  <div id="grant-form-card" class="${grantFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.label_app}</label>
                       ${MultiSelect({
        id: "perm-app-id",
        placeholder: t.placeholder_select,
        options: props.apps.map((a) => ({ value: a.id, text: a.name }))
      })}
                       <label class="${checkboxLabel}">
                           <input type="checkbox" id="exclude-existing-check" />
                           登録されているものは含まない
                       </label>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="perm-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'month')", children: "-1\u30F6\u6708", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -7, 'day')", children: "-1\u9031\u9593", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'day')", children: "-1\u65E5", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="perm-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                     </div>

                     ${Button({ id: "btn-grant-perm", onclick: "grantPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                  </div>

                  <div id="modal-perm-list"></div>
            `
    }), Modal({
      id: "revoke-confirm-modal",
      title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.confirm_revoke_permission || "Revoke Permission"}</span>`,
      closeAction: "closeRevokeModal()",
      closeBtnId: "revoke-close-btn",
      children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_revoke_permission || "Are you sure you want to revoke this permission?"}</p>
                    <div id="revoke-error-msg" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; color: #b91c1c; border-radius: 6px; border: 1px solid #fecaca; display: none;"></div>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRevokeModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">
                         Cancel
                      </button>
                      <button type="button" onclick="executeRevoke()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Revoke
                      </button>
                  </div>
            `
    }), t.confirm_delete_user, t.confirm_revoke_permission, t.btn_grant, t.btn_bulk_apply || "Update", t.btn_exit_bulk, t.btn_bulk_mode, t.no_affiliation || "(None)", t.msg_override, t.btn_term_forever, t.source_group, t.source_user, t.confirm_overwrite, t.alert_select_app, t.alert_update_fail, t.alert_error, t.placeholder_select, t.text_no_results, raw(allAppsJson), scriptContent, props.inviteUrl ? raw(`
            window.addEventListener('DOMContentLoaded', function() {
                var modal = document.getElementById('invite-modal');
                if(modal) modal.showModal();
            });
          `) : "")
  });
}, "UsersPage");

// src/views/admin/LogsPage.tsx
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var LogsPage = /* @__PURE__ */ __name((props) => {
  const t = props.t;
  const formatDetails = /* @__PURE__ */ __name((jsonStr) => {
    try {
      const obj = JSON.parse(jsonStr);
      if (obj.key && t[obj.key]) {
        let msg = t[obj.key];
        if (obj.params) {
          for (const k in obj.params) {
            msg = msg.replace("{" + k + "}", obj.params[k]);
          }
        }
        return msg;
      }
      return jsonStr;
    } catch (e) {
      return jsonStr;
    }
  }, "formatDetails");
  const events = [
    "LOGIN",
    "PASSWORD_CHANGE",
    "APP_CREATED",
    "APP_UPDATED",
    "APP_DELETED",
    "USER_UPDATE",
    "USER_DELETED",
    "PERMISSION_GRANT",
    "PERMISSION_REVOKE",
    "GROUP_PERMISSION_GRANT",
    "GROUP_PERMISSION_REVOKE",
    "GROUP_DELETED",
    "MEMBERSHIP_ADD",
    "MEMBERSHIP_REMOVE"
  ];
  return Layout2({
    t,
    userEmail: props.userEmail,
    activeTab: "logs",
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <h2>${t.section_logs}</h2>
      
      <article style="padding: 1rem; margin-bottom: 2rem;">
        <form method="GET" action="/admin/logs" style="margin: 0; display: flex; align-items: center; gap: 1rem;">
            <label style="margin:0; white-space:nowrap; font-weight:600;">
                ${t.label_filter_event}
            </label>
            <select name="event" style="width: auto; margin: 0; min-width: 250px;">
                <option value="">${t.option_all_events}</option>
                ${events.map((e) => html`
                    <option value="${e}" ${props.currentFilter === e ? "selected" : ""}>
                        ${t["event_" + e] || e}
                    </option>
                `)}
            </select>
            <button type="submit" style="width: auto; margin: 0; padding: 0.5rem 1rem;">${t.btn_filter}</button>
        </form>
      </article>

      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th scope="col" style="width:180px">${t.th_time}</th>
              <th scope="col" style="width:150px">${t.th_event}</th>
              <th scope="col">${t.th_details}</th>
            </tr>
          </thead>
          <tbody>
            ${props.logs.map((log) => html`
              <tr>
                <td><span class="local-time" data-timestamp="${log.created_at * 1e3}">${new Date(log.created_at * 1e3).toLocaleString()}</span></td>
                <td>
                    <small>${t["event_" + log.event_type] || log.event_type}</small>
                </td>
                <td style="font-size:0.9rem; color:#444;">
                    ${formatDetails(log.details)}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </figure>
      
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            ${props.currentPage > 1 ? html`<a href="/admin/logs?page=${props.currentPage - 1}&event=${props.currentFilter}" role="button" class="outline">${t.pager_prev}</a>` : ""}
        </div>
        <div style="font-size:0.9rem; color:#666;">
            ${t.pager_info.replace("{current}", String(props.currentPage)).replace("{total}", String(props.totalPages)).replace("{count}", String(props.totalCount))}
        </div>
        <div>
            ${props.currentPage < props.totalPages ? html`<a href="/admin/logs?page=${props.currentPage + 1}&event=${props.currentFilter}" role="button" class="outline">${t.pager_next}</a>` : ""}
        </div>
      </div>
    `
  });
}, "LogsPage");

// src/i18n.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var dict = {
  en: {
    lang: "en",
    tobira_admin: "Admin Panel",
    title_login: "Login",
    title_dashboard: "Admin Dashboard",
    title_user_dashboard: "My Dashboard",
    title_invite: "Setup Password",
    title_forgot: "Reset Password",
    title_change_password: "Change Password",
    nav_home: "Home",
    nav_apps: "Apps",
    nav_groups: "Affiliations",
    nav_users: "Users",
    nav_logs: "Audit Logs",
    nav_account: "Account Manager",
    // Sidebar section headers
    nav_section_account: "Account Manager",
    nav_section_idp: "Access Management",
    nav_section_system: "System",
    // Account Manager: Group management
    am_section_groups: "Group Management",
    am_subtitle: "Manage organization groups and their members",
    am_btn_add_group: "New Group",
    am_header_new_group: "New Group",
    am_confirm_delete_group: "Delete this group? All memberships and related permissions will be removed.",
    am_member_count: "{count} members",
    am_header_members: "Members",
    am_add_member: "Add Member",
    am_label_member: "Select Users (Multiple)",
    am_label_role: "Role",
    am_role_group_admin: "Group Admin",
    am_role_member: "Member",
    am_no_members: "(No members)",
    am_confirm_remove_member: "Remove this member from the group?",
    am_btn_remove: "Remove",
    am_alert_select_user: "Please select at least one user.",
    am_label_parent: "Parent Group",
    am_parent_none: "(Top level)",
    am_alert_cycle: "Cannot set this parent (would create a cycle).",
    // --- AM: サービスマスタ（ゲート①） ---
    am_section_services: "Services",
    am_services_subtitle: "Register providers, services and contracts",
    am_providers_header: "Service Providers",
    am_btn_add_provider: "New Provider",
    am_label_provider_name: "Provider Name",
    am_placeholder_provider_name: "e.g. Acme Inspection Co.",
    am_confirm_delete_provider: "Delete this provider? Its services and contracts will also be removed.",
    am_none_providers: "No providers registered.",
    am_services_header: "Services",
    am_btn_add_service: "New Service",
    am_label_service_name: "Service Name",
    am_placeholder_service_name: "e.g. Periodic Inspection",
    am_label_provider: "Provider",
    am_confirm_delete_service: "Delete this service? Related contracts, grants, roles and assignments will also be removed.",
    am_none_services: "No services registered.",
    am_contracts_header: "Contracts",
    am_btn_add_contract: "New Contract",
    am_label_contract_service: "Service",
    am_label_customer_group: "Customer Group",
    am_label_seat_limit: "Seat Limit",
    am_seat_unlimited: "Unlimited",
    am_placeholder_seat: "blank = unlimited",
    am_confirm_delete_contract: "Delete this contract? Related grants will also be removed.",
    am_none_contracts: "No contracts registered.",
    am_service_of_provider: "{service} ({provider})",
    // --- AM: 利用枠（ゲート②） ---
    am_section_grants: "Service Grants",
    am_grants_subtitle: "Open contracted services to group nodes (no auto-inheritance)",
    am_btn_add_grant: "New Grant",
    am_label_grant_group: "Group",
    am_label_grant_contract: "Contract (Service)",
    am_confirm_delete_grant: "Revoke this grant from the group?",
    am_none_grants: "No grants defined.",
    // --- AM: 施設 ---
    am_section_facilities: "Facilities",
    am_facilities_subtitle: "Buildings managed by a branch (1:1 with structure no.)",
    am_btn_add_facility: "New Facility",
    am_label_structure_no: "Structure No.",
    am_label_building_use: "Building Use",
    am_placeholder_building_use: "e.g. Office / Hospital / Factory",
    am_label_managing_group: "Managing Group",
    am_confirm_delete_facility: "Delete this facility? Related assignments will also be removed.",
    am_none_facilities: "No facilities registered.",
    // --- AM: 役割マスタ + 利用者割当（ゲート③） ---
    am_section_assignments: "User Assignments",
    am_assignments_subtitle: "Assign users per building with a service role",
    am_roles_header: "Service Role Master",
    am_btn_add_role: "New Role",
    am_label_role_service: "Service",
    am_label_role_facility_type: "Building Use (filter)",
    am_facility_type_all: "(All types)",
    am_label_role_name: "Role Name",
    am_placeholder_role_name: "e.g. Inspection Lead",
    am_confirm_delete_role: "Delete this role from the master?",
    am_none_roles: "No roles defined.",
    am_assignments_header: "Assignments",
    am_btn_add_assignment: "New Assignment",
    am_label_assign_user: "User",
    am_label_assign_group: "Group (standing)",
    am_label_assign_service: "Service",
    am_label_assign_facility: "Facility (building)",
    am_label_assign_role: "Role",
    am_confirm_delete_assignment: "Remove this assignment?",
    am_none_assignments: "No assignments.",
    am_alert_seat_exceeded: "Seat limit reached for this contract/grant.",
    am_alert_no_role: "No role available. Define a role in the master first.",
    // グループ管理者ポータル
    ga_title: "Group Admin Portal",
    ga_subtitle: "Manage members and service assignments for your groups",
    ga_nav: "Group Admin",
    ga_tab_members: "Members",
    ga_tab_assignments: "Service Assignments",
    ga_tab_access: "App Access",
    ga_no_groups: "You are not assigned as a group admin for any groups.",
    ga_select_group: "Select Group",
    ga_access_readonly: "Read-only. Contact system admin to change permissions.",
    ga_permission_app: "App",
    ga_permission_source: "Source",
    ga_permission_valid: "Valid Period",
    ga_source_user: "User specific",
    ga_source_group: "Group",
    ga_no_access: "No app access assigned.",
    ga_no_assignments: "No service assignments for this group.",
    ga_assign_user: "User",
    ga_assign_facility: "Facility",
    ga_assign_role: "Role",
    ga_assign_service: "Service",
    ga_assign_valid: "Valid Period",
    login_header: "Login to",
    email: "Email",
    password: "Password",
    btn_login: "Log in",
    forgot_password: "Forgot Password?",
    back_to_login: "Back to Login",
    title_signup: "Sign Up",
    signup: "Sign up",
    signup_desc: "Create a new account",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    logout: "Logout",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    status: "Status",
    action: "Action",
    dashboard_welcome: "Welcome, {email}",
    dashboard_apps_header: "Your Applications",
    btn_open_app: "Launch",
    profile_header: "Profile",
    profile_hint: "Shown to apps via the OIDC profile scope. Leave blank to use your email.",
    label_name: "Name",
    label_preferred_username: "Preferred username",
    label_picture: "Picture URL",
    btn_change_password: "Change Password",
    header_change_password: "Change Password",
    msg_password_changed: "Password changed successfully.",
    no_apps_assigned: "No applications assigned. Please contact your administrator.",
    // User-facing navigation / account settings
    nav_dashboard: "Dashboard",
    account_settings: "Account Settings",
    account_subtitle: "Manage your profile and security",
    security_header: "Security",
    desc_2fa_account: "Require a one-time code at login for extra security.",
    msg_profile_saved: "Profile updated.",
    back_to_account: "Back to Account Settings",
    desc_change_password: "Set a new password for signing in.",
    section_apps: "Applications",
    header_new_app: "Register New App",
    header_edit_app: "Edit App",
    label_app_id: "App ID",
    label_app_name: "App Name",
    label_base_url: "Base URL",
    label_app_icon: "App Icon (Max 100KB)",
    label_current_icon: "Current Icon",
    label_description: "Description",
    // OIDC app-registration fields
    label_redirect_uris: "Redirect URIs (OIDC)",
    ph_redirect_uris: "https://app.example.com/callback&#10;(one per line \u2014 exact match)",
    help_redirect_uris: "One exact redirect_uri per line. Leave empty to allow any path under Base URL (legacy).",
    label_bcl_uri: "Back-Channel Logout URI (OIDC)",
    help_bcl_uri: "Optional. The IdP POSTs a signed logout_token here on logout so the RP ends its own session (Single Logout).",
    label_client_secret: "Client Secret (OIDC)",
    note_confidential: "Confidential client. Send this as client_secret at /oauth/token.",
    note_public: "Public client. No secret; PKCE is required.",
    secret_public_placeholder: "(public client \u2014 no secret)",
    confirm_make_public: "Make this a public client? The secret will be removed and PKCE required.",
    label_preview: "Preview",
    btn_regenerate_secret: "Regenerate",
    btn_make_public: "Make public (SPA)",
    placeholder_description: "Short description of the application...",
    placeholder_app_id: "e.g. todo-app",
    placeholder_app_name: "Display Name",
    placeholder_select: "Select...",
    text_no_results: "No results found",
    btn_add_app: "Add App",
    btn_pause: "Pause",
    btn_resume: "Resume",
    status_active: "Active",
    status_inactive: "Paused",
    confirm_delete_app: "Are you sure? All permissions associated with this app will be permanently deleted.",
    confirm_change_status: "Change status for {name}?",
    section_groups: "Affiliation Management",
    header_new_group: "New Affiliation",
    label_group_name: "Affiliation Name",
    placeholder_group_name: "e.g. Sales Dept",
    btn_add_group: "Add Affiliation",
    no_groups: "No affiliations defined.",
    confirm_delete_group: 'Are you sure you want to delete this affiliation? Users in this group will become "No Affiliation".',
    section_users: "User Management",
    header_invite: "Invite User",
    placeholder_invite_email: "Email to invite",
    btn_generate_invite: "Send Invite",
    header_registered_users: "Registered Users",
    label_affiliation: "Affiliation",
    no_affiliation: "No Affiliation",
    confirm_delete_user: "Are you sure you want to delete this user? This action cannot be undone.",
    confirm_revoke_permission: "Are you sure you want to revoke this permission?",
    confirm_overwrite: "The following permissions will be overwritten with term {start} - {end}:\n{list}\n\nAre you sure?",
    alert_select_app: "Please select at least one application.",
    alert_update_fail: "Update failed: {message}",
    alert_error: "An error occurred: {message}",
    btn_bulk_mode: "Bulk Edit Mode",
    btn_exit_bulk: "Exit Bulk Mode",
    btn_bulk_apply: "Apply Changes",
    header_user_details: "User Details",
    tab_permissions: "Permissions",
    header_grant: "Grant Permission",
    header_grant_permission: "Grant Access",
    header_active_permissions: "Active Permissions",
    label_user: "User",
    label_app: "Application",
    label_valid_from: "Start Date",
    label_valid_to: "End Date",
    btn_grant: "Grant",
    permission_source: "Source",
    source_user: "User Specific",
    source_group: "Affiliation",
    msg_override: "User settings override affiliation settings.",
    modal_th_app: "Application",
    modal_th_source: "Source",
    modal_th_valid: "Validity Period",
    modal_th_action: "Action",
    modal_section_group: "Affiliation",
    desc_group_override: "User settings override affiliation permissions.",
    modal_section_perm: "Permission Status",
    modal_section_add: "Grant Permission",
    modal_label_app: "Select Apps (Multiple)",
    modal_label_no_expire: "No Expiration",
    btn_add_perm: "Add Permission",
    btn_change: "Change",
    btn_date_today: "Today",
    btn_date_start_month: "1st of Month",
    btn_term_1mo: "+1 Month",
    btn_term_1yr: "+1 Year",
    btn_term_forever: "Indefinite",
    section_logs: "Audit Logs",
    th_time: "Time",
    th_event: "Event",
    th_details: "Details",
    label_filter_event: "Filter by Event",
    option_all_events: "All Events",
    btn_filter: "Filter",
    pager_prev: "\u2190 Prev",
    pager_next: "Next \u2192",
    pager_info: "Page {current} of {total} ({count} logs)",
    event_APP_CREATED: "App Created",
    event_APP_UPDATED: "App Updated",
    event_APP_DELETED: "App Deleted",
    event_PERMISSION_GRANT: "Permission Granted",
    event_PERMISSION_REVOKE: "Permission Revoked",
    event_USER_UPDATE: "User Updated",
    event_USER_DELETED: "User Deleted",
    event_GROUP_PERMISSION_GRANT: "Group Perm Granted",
    event_GROUP_PERMISSION_REVOKE: "Group Perm Revoked",
    event_GROUP_DELETED: "Group Deleted",
    event_MEMBERSHIP_ADD: "Member Added",
    event_MEMBERSHIP_REMOVE: "Member Removed",
    event_LOGIN: "User Login",
    event_PASSWORD_CHANGE: "Password Changed",
    log_login: "User logged in: {email}",
    log_login_app: "User logged in: {email} (Target: {appName})",
    log_app_created: 'App "{appName}" ({id}) created by {admin}',
    log_app_updated: 'App "{appName}" updated (Status: {status}) by {admin}',
    log_app_deleted: 'App "{id}" deleted by {admin}',
    log_user_group_update: 'User {user} affiliation changed to "{group}" by {admin}',
    log_permission_grant: "Granted apps [{apps}] to user {user} by {admin}",
    log_permission_revoke: "Permission {id} revoked by {admin}",
    log_user_deleted: "User {id} deleted by {admin}",
    log_group_permission_grant: 'Granted apps [{apps}] to group "{group}" by {admin}',
    log_group_permission_revoke: "Group Permission {id} revoked by {admin}",
    log_group_deleted: "Group {id} deleted by {admin}",
    log_membership_add: "Added {count} member(s) to group {group} as {role} by {admin}",
    log_membership_remove: "Membership {id} removed by {admin}",
    log_bulk_update: "Bulk update by {admin} ({count} users). Group: {group}, App: {app}",
    log_password_change: "User {email} changed password.",
    welcome: "Welcome",
    setup_desc: "Setup password for",
    reset_desc: "Reset password for",
    label_new_password: "New Password",
    btn_create_account: "Create Account",
    btn_reset_password: "Reset Password",
    btn_send_link: "Send Reset Link",
    invite_created: "Invite Link Created",
    invite_copy_hint: "Copy this link.",
    link_sent: "If an account exists, a reset link has been sent.",
    error_credentials: "Invalid credentials",
    error_rate_limited: "Too many attempts. Please wait a moment and try again.",
    error_required: "Email and password required",
    error_user_exists: "User exists",
    error_invalid_invite: "Invalid token",
    error_access_denied: "Access Denied",
    error_not_started: "Not started",
    error_expired: "Expired",
    msg_account_created: "Account created. Please log in.",
    stat_apps: "Applications",
    stat_users: "Users",
    stat_logs: "Logs",
    title_setup_2fa: "Setup 2FA",
    header_setup_2fa: "Two-Factor Authentication Setup",
    label_2fa_status: "2FA Status",
    status_enabled: "Enabled",
    status_disabled: "Disabled",
    btn_setup_2fa: "Enable 2FA",
    btn_disable_2fa: "Disable 2FA",
    title_2fa_verify: "Two-Factor Authentication",
    header_2fa_verify: "Verification",
    desc_2fa_verify: "Please enter the 6-digit code from your authenticator app.",
    btn_verify: "Verify",
    desc_setup_2fa: "Scan the QR code with your authenticator app (Google Authenticator, etc.) and enter the 6-digit code below.",
    label_secret_key: "Secret Key",
    label_otp_code: "Verification Code",
    err_invalid_code: "Invalid code. Please try again.",
    msg_2fa_enabled: "Two-Factor Authentication has been enabled.",
    msg_2fa_disabled: "Two-Factor Authentication has been disabled.",
    confirm_disable_2fa: "Are you sure you want to disable 2FA?",
    // Config
    config_change_name: "Change System Name",
    label_app_name_ja: "System Name (Japanese)",
    label_app_name_en: "System Name (English)",
    label_app_subtitle_ja: "Subtitle (Japanese)",
    label_app_subtitle_en: "Subtitle (English)"
  },
  ja: {
    lang: "ja",
    title_login: "\u30ED\u30B0\u30A4\u30F3",
    title_dashboard: "\u7BA1\u7406\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    title_user_dashboard: "\u30DE\u30A4\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    title_invite: "\u30D1\u30B9\u30EF\u30FC\u30C9\u8A2D\u5B9A",
    title_forgot: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8",
    title_change_password: "\u30D1\u30B9\u30EF\u30FC\u30C9\u5909\u66F4",
    tobira_admin: "\u7BA1\u7406\u753B\u9762",
    nav_home: "\u30DB\u30FC\u30E0",
    nav_apps: "\u30A2\u30D7\u30EA\u7BA1\u7406",
    nav_groups: "\u6240\u5C5E\u7BA1\u7406",
    nav_users: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406",
    nav_logs: "\u76E3\u67FB\u30ED\u30B0",
    nav_account: "\u30A2\u30AB\u30A6\u30F3\u30C8\u7BA1\u7406",
    // サイドバーのセクション見出し
    nav_section_account: "\u30A2\u30AB\u30A6\u30F3\u30C8\u30DE\u30CD\u30FC\u30B8\u30E3",
    nav_section_idp: "\u30A2\u30AF\u30BB\u30B9\u7BA1\u7406",
    nav_section_system: "\u30B7\u30B9\u30C6\u30E0",
    // アカウントマネージャ: グループ管理
    am_section_groups: "\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406",
    am_subtitle: "\u7D44\u7E54\u30B0\u30EB\u30FC\u30D7\u3068\u6240\u5C5E\u30E1\u30F3\u30D0\u30FC\u3092\u7BA1\u7406\u3057\u307E\u3059",
    am_btn_add_group: "\u65B0\u898F\u30B0\u30EB\u30FC\u30D7",
    am_header_new_group: "\u65B0\u898F\u30B0\u30EB\u30FC\u30D7\u4F5C\u6210",
    am_confirm_delete_group: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u6240\u5C5E\u30FB\u95A2\u9023\u6A29\u9650\u3082\u3059\u3079\u3066\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    am_member_count: "{count}\u540D",
    am_header_members: "\u30E1\u30F3\u30D0\u30FC",
    am_add_member: "\u30E1\u30F3\u30D0\u30FC\u3092\u8FFD\u52A0",
    am_label_member: "\u30E6\u30FC\u30B6\u30FC\u3092\u9078\u629E\uFF08\u8907\u6570\u53EF\uFF09",
    am_label_role: "\u5F79\u5272",
    am_role_group_admin: "\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406\u8005",
    am_role_member: "\u30E1\u30F3\u30D0\u30FC",
    am_no_members: "(\u30E1\u30F3\u30D0\u30FC\u306A\u3057)",
    am_confirm_remove_member: "\u3053\u306E\u30E1\u30F3\u30D0\u30FC\u3092\u30B0\u30EB\u30FC\u30D7\u304B\u3089\u5916\u3057\u307E\u3059\u304B\uFF1F",
    am_btn_remove: "\u89E3\u9664",
    am_alert_select_user: "\u30E6\u30FC\u30B6\u30FC\u3092\u5C11\u306A\u304F\u3068\u30821\u4EBA\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    am_label_parent: "\u89AA\u30B0\u30EB\u30FC\u30D7",
    am_parent_none: "(\u6700\u4E0A\u4F4D)",
    am_alert_cycle: "\u5FAA\u74B0\u53C2\u7167\u306B\u306A\u308B\u305F\u3081\u3001\u305D\u306E\u89AA\u306F\u8A2D\u5B9A\u3067\u304D\u307E\u305B\u3093\u3002",
    // --- AM: サービスマスタ（ゲート①） ---
    am_section_services: "\u30B5\u30FC\u30D3\u30B9\u7BA1\u7406",
    am_services_subtitle: "\u63D0\u4F9B\u4F01\u696D\u30FB\u30B5\u30FC\u30D3\u30B9\u30FB\u5951\u7D04\u3092\u767B\u9332\u3057\u307E\u3059",
    am_providers_header: "\u30B5\u30FC\u30D3\u30B9\u63D0\u4F9B\u4F01\u696D",
    am_btn_add_provider: "\u65B0\u898F\u63D0\u4F9B\u4F01\u696D",
    am_label_provider_name: "\u63D0\u4F9B\u4F01\u696D\u540D",
    am_placeholder_provider_name: "\u4F8B: \u3007\u3007\u70B9\u691C\u682A\u5F0F\u4F1A\u793E",
    am_confirm_delete_provider: "\u3053\u306E\u63D0\u4F9B\u4F01\u696D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u914D\u4E0B\u306E\u30B5\u30FC\u30D3\u30B9\u30FB\u5951\u7D04\u3082\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    am_none_providers: "\u63D0\u4F9B\u4F01\u696D\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    am_services_header: "\u30B5\u30FC\u30D3\u30B9",
    am_btn_add_service: "\u65B0\u898F\u30B5\u30FC\u30D3\u30B9",
    am_label_service_name: "\u30B5\u30FC\u30D3\u30B9\u540D",
    am_placeholder_service_name: "\u4F8B: \u5B9A\u671F\u70B9\u691C",
    am_label_provider: "\u63D0\u4F9B\u4F01\u696D",
    am_confirm_delete_service: "\u3053\u306E\u30B5\u30FC\u30D3\u30B9\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u95A2\u9023\u3059\u308B\u5951\u7D04\u30FB\u5229\u7528\u67A0\u30FB\u5F79\u5272\u30FB\u5272\u5F53\u3082\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    am_none_services: "\u30B5\u30FC\u30D3\u30B9\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    am_contracts_header: "\u5951\u7D04",
    am_btn_add_contract: "\u65B0\u898F\u5951\u7D04",
    am_label_contract_service: "\u30B5\u30FC\u30D3\u30B9",
    am_label_customer_group: "\u5951\u7D04\u7D44\u7E54",
    am_label_seat_limit: "\u5E2D\u6570\u4E0A\u9650",
    am_seat_unlimited: "\u7121\u5236\u9650",
    am_placeholder_seat: "\u7A7A\u6B04=\u7121\u5236\u9650",
    am_confirm_delete_contract: "\u3053\u306E\u5951\u7D04\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u95A2\u9023\u3059\u308B\u5229\u7528\u67A0\u3082\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    am_none_contracts: "\u5951\u7D04\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    am_service_of_provider: "{service}\uFF08{provider}\uFF09",
    // --- AM: 利用枠（ゲート②） ---
    am_section_grants: "\u5229\u7528\u67A0",
    am_grants_subtitle: "\u5951\u7D04\u6E08\u307F\u30B5\u30FC\u30D3\u30B9\u3092\u30B0\u30EB\u30FC\u30D7\u3078\u958B\u653E\u3057\u307E\u3059\uFF08\u81EA\u52D5\u7D99\u627F\u306A\u3057\uFF09",
    am_btn_add_grant: "\u5229\u7528\u67A0\u3092\u8FFD\u52A0",
    am_label_grant_group: "\u30B0\u30EB\u30FC\u30D7",
    am_label_grant_contract: "\u5951\u7D04\uFF08\u30B5\u30FC\u30D3\u30B9\uFF09",
    am_confirm_delete_grant: "\u3053\u306E\u5229\u7528\u67A0\u3092\u30B0\u30EB\u30FC\u30D7\u304B\u3089\u53D6\u308A\u6D88\u3057\u307E\u3059\u304B\uFF1F",
    am_none_grants: "\u5229\u7528\u67A0\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    // --- AM: 施設 ---
    am_section_facilities: "\u65BD\u8A2D",
    am_facilities_subtitle: "\u652F\u5E97\u304C\u7BA1\u7406\u3059\u308B\u5EFA\u7269\uFF08\u65BD\u8A2D\u69CB\u9020\u7269\u756A\u53F7\u30681:1\uFF09",
    am_btn_add_facility: "\u65B0\u898F\u65BD\u8A2D",
    am_label_structure_no: "\u65BD\u8A2D\u69CB\u9020\u7269\u756A\u53F7",
    am_label_building_use: "\u5EFA\u7269\u7528\u9014",
    am_placeholder_building_use: "\u4F8B: \u30AA\u30D5\u30A3\u30B9 / \u75C5\u9662 / \u5DE5\u5834",
    am_label_managing_group: "\u7BA1\u7406\u30B0\u30EB\u30FC\u30D7",
    am_confirm_delete_facility: "\u3053\u306E\u65BD\u8A2D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u95A2\u9023\u3059\u308B\u5272\u5F53\u3082\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    am_none_facilities: "\u65BD\u8A2D\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    // --- AM: 役割マスタ + 利用者割当（ゲート③） ---
    am_section_assignments: "\u5229\u7528\u8005\u5272\u5F53",
    am_assignments_subtitle: "\u5EFA\u7269\u3054\u3068\u306B\u5229\u7528\u8005\u3078\u30B5\u30FC\u30D3\u30B9\u5F79\u5272\u3092\u5272\u308A\u5F53\u3066\u307E\u3059",
    am_roles_header: "\u30B5\u30FC\u30D3\u30B9\u5F79\u5272\u30DE\u30B9\u30BF",
    am_btn_add_role: "\u65B0\u898F\u5F79\u5272",
    am_label_role_service: "\u30B5\u30FC\u30D3\u30B9",
    am_label_role_facility_type: "\u5EFA\u7269\u7528\u9014\uFF08\u7D5E\u308A\u8FBC\u307F\uFF09",
    am_facility_type_all: "(\u5168\u7A2E\u5225)",
    am_label_role_name: "\u5F79\u5272\u540D",
    am_placeholder_role_name: "\u4F8B: \u70B9\u691C\u7BA1\u7406\u8005",
    am_confirm_delete_role: "\u3053\u306E\u5F79\u5272\u3092\u30DE\u30B9\u30BF\u304B\u3089\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
    am_none_roles: "\u5F79\u5272\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    am_assignments_header: "\u5272\u5F53",
    am_btn_add_assignment: "\u5272\u5F53\u3092\u8FFD\u52A0",
    am_label_assign_user: "\u5229\u7528\u8005",
    am_label_assign_group: "\u30B0\u30EB\u30FC\u30D7\uFF08\u7ACB\u5834\uFF09",
    am_label_assign_service: "\u30B5\u30FC\u30D3\u30B9",
    am_label_assign_facility: "\u65BD\u8A2D\uFF08\u5EFA\u7269\uFF09",
    am_label_assign_role: "\u5F79\u5272",
    am_confirm_delete_assignment: "\u3053\u306E\u5272\u5F53\u3092\u89E3\u9664\u3057\u307E\u3059\u304B\uFF1F",
    am_none_assignments: "\u5272\u5F53\u304C\u3042\u308A\u307E\u305B\u3093",
    am_alert_seat_exceeded: "\u3053\u306E\u5951\u7D04\uFF0F\u5229\u7528\u67A0\u306E\u5E2D\u6570\u4E0A\u9650\u306B\u9054\u3057\u3066\u3044\u307E\u3059\u3002",
    am_alert_no_role: "\u9078\u3079\u308B\u5F79\u5272\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u5148\u306B\u5F79\u5272\u30DE\u30B9\u30BF\u3067\u5F79\u5272\u3092\u5B9A\u7FA9\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    // グループ管理者ポータル
    ga_title: "\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406\u30DD\u30FC\u30BF\u30EB",
    ga_subtitle: "\u7BA1\u7406\u30B0\u30EB\u30FC\u30D7\u306E\u30E1\u30F3\u30D0\u30FC\u3068\u30B5\u30FC\u30D3\u30B9\u5272\u5F53\u3092\u7BA1\u7406\u3057\u307E\u3059",
    ga_nav: "\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406",
    ga_tab_members: "\u30E1\u30F3\u30D0\u30FC",
    ga_tab_assignments: "\u30B5\u30FC\u30D3\u30B9\u5272\u5F53",
    ga_tab_access: "\u30A2\u30AF\u30BB\u30B9\u6A29",
    ga_no_groups: "\u30B0\u30EB\u30FC\u30D7\u7BA1\u7406\u8005\u3068\u3057\u3066\u5272\u308A\u5F53\u3066\u3089\u308C\u3066\u3044\u308B\u30B0\u30EB\u30FC\u30D7\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    ga_select_group: "\u30B0\u30EB\u30FC\u30D7\u3092\u9078\u629E",
    ga_access_readonly: "\u95B2\u89A7\u306E\u307F\u3002\u5909\u66F4\u306F\u30B7\u30B9\u30C6\u30E0\u7BA1\u7406\u8005\u306B\u4F9D\u983C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    ga_permission_app: "\u30A2\u30D7\u30EA",
    ga_permission_source: "\u9069\u7528\u5143",
    ga_permission_valid: "\u6709\u52B9\u671F\u9593",
    ga_source_user: "\u30E6\u30FC\u30B6\u30FC\u500B\u5225",
    ga_source_group: "\u30B0\u30EB\u30FC\u30D7",
    ga_no_access: "\u30A2\u30AF\u30BB\u30B9\u6A29\u304C\u3042\u308A\u307E\u305B\u3093",
    ga_no_assignments: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u306E\u30B5\u30FC\u30D3\u30B9\u5272\u5F53\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    ga_assign_user: "\u5229\u7528\u8005",
    ga_assign_facility: "\u65BD\u8A2D",
    ga_assign_role: "\u5F79\u5272",
    ga_assign_service: "\u30B5\u30FC\u30D3\u30B9",
    ga_assign_valid: "\u6709\u52B9\u671F\u9593",
    login_header: "\u30ED\u30B0\u30A4\u30F3:",
    email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
    password: "\u30D1\u30B9\u30EF\u30FC\u30C9",
    btn_login: "\u30ED\u30B0\u30A4\u30F3",
    forgot_password: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5FD8\u308C\u305F\u5834\u5408",
    back_to_login: "\u30ED\u30B0\u30A4\u30F3\u306B\u623B\u308B",
    title_signup: "\u65B0\u898F\u767B\u9332",
    signup: "\u65B0\u898F\u767B\u9332",
    signup_desc: "\u65B0\u3057\u3044\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u307E\u3059",
    no_account: "\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u304A\u6301\u3061\u3067\u306A\u3044\u3067\u3059\u304B\uFF1F",
    have_account: "\u3059\u3067\u306B\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u304A\u6301\u3061\u3067\u3059\u304B\uFF1F",
    logout: "\u30ED\u30B0\u30A2\u30A6\u30C8",
    cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
    save: "\u4FDD\u5B58",
    delete: "\u524A\u9664",
    edit: "\u7DE8\u96C6",
    status: "\u72B6\u614B",
    action: "\u64CD\u4F5C",
    dashboard_welcome: "\u3088\u3046\u3053\u305D: {email}",
    dashboard_apps_header: "\u5229\u7528\u53EF\u80FD\u306A\u30A2\u30D7\u30EA",
    btn_open_app: "\u30A2\u30D7\u30EA\u3092\u958B\u304F",
    profile_header: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
    profile_hint: "OIDC \u306E profile \u30B9\u30B3\u30FC\u30D7\u3067\u30A2\u30D7\u30EA\u306B\u6E21\u3055\u308C\u307E\u3059\u3002\u7A7A\u6B04\u306A\u3089\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u304C\u4F7F\u308F\u308C\u307E\u3059\u3002",
    label_name: "\u540D\u524D",
    label_preferred_username: "\u8868\u793A\u30E6\u30FC\u30B6\u30FC\u540D",
    label_picture: "\u753B\u50CFURL",
    btn_change_password: "\u30D1\u30B9\u30EF\u30FC\u30C9\u5909\u66F4",
    header_change_password: "\u30D1\u30B9\u30EF\u30FC\u30C9\u5909\u66F4",
    msg_password_changed: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5909\u66F4\u3057\u307E\u3057\u305F",
    no_apps_assigned: "\u5229\u7528\u53EF\u80FD\u306A\u30A2\u30D7\u30EA\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u7BA1\u7406\u8005\u306B\u554F\u3044\u5408\u308F\u305B\u3066\u304F\u3060\u3055\u3044\u3002",
    // ユーザー向けナビゲーション / アカウント設定
    nav_dashboard: "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    account_settings: "\u30A2\u30AB\u30A6\u30F3\u30C8\u8A2D\u5B9A",
    account_subtitle: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3068\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u7BA1\u7406\u3057\u307E\u3059",
    security_header: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3",
    desc_2fa_account: "\u30ED\u30B0\u30A4\u30F3\u6642\u306B\u30EF\u30F3\u30BF\u30A4\u30E0\u30B3\u30FC\u30C9\u3092\u8981\u6C42\u3057\u3001\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3092\u9AD8\u3081\u307E\u3059\u3002",
    msg_profile_saved: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002",
    back_to_account: "\u30A2\u30AB\u30A6\u30F3\u30C8\u8A2D\u5B9A\u306B\u623B\u308B",
    desc_change_password: "\u30B5\u30A4\u30F3\u30A4\u30F3\u306B\u4F7F\u3046\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002",
    section_apps: "\u9023\u643A\u30A2\u30D7\u30EA\u4E00\u89A7",
    header_new_app: "\u65B0\u898F\u30A2\u30D7\u30EA\u767B\u9332",
    header_edit_app: "\u30A2\u30D7\u30EA\u7DE8\u96C6",
    label_app_id: "\u30A2\u30D7\u30EAID",
    label_app_name: "\u30A2\u30D7\u30EA\u8868\u793A\u540D",
    label_base_url: "\u30D9\u30FC\u30B9URL",
    label_app_icon: "\u30A2\u30D7\u30EA\u30A2\u30A4\u30B3\u30F3 (\u6700\u5927100KB)",
    label_current_icon: "\u73FE\u5728\u306E\u30A2\u30A4\u30B3\u30F3",
    label_description: "\u30A2\u30D7\u30EA\u8AAC\u660E",
    // OIDC アプリ登録フィールド
    label_redirect_uris: "\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URI (OIDC)",
    ph_redirect_uris: "https://app.example.com/callback&#10;(1\u884C\u306B1\u3064 \u2014 \u5B8C\u5168\u4E00\u81F4)",
    help_redirect_uris: "1\u884C\u306B1\u3064\u3001\u5B8C\u5168\u4E00\u81F4\u3059\u308B\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8URI\u3092\u8A18\u8F09\u3057\u307E\u3059\u3002\u7A7A\u6B04\u306E\u5834\u5408\u306F\u30D9\u30FC\u30B9URL\u914D\u4E0B\u306E\u4EFB\u610F\u30D1\u30B9\u3092\u8A31\u53EF\u3057\u307E\u3059\uFF08\u65E7\u65B9\u5F0F\uFF09\u3002",
    label_bcl_uri: "\u30D0\u30C3\u30AF\u30C1\u30E3\u30CD\u30EB\u30ED\u30B0\u30A2\u30A6\u30C8URI (OIDC)",
    help_bcl_uri: "\u4EFB\u610F\u3002\u30ED\u30B0\u30A2\u30A6\u30C8\u6642\u306BIdP\u304C\u7F72\u540D\u4ED8\u304D logout_token \u3092\u3053\u3053\u3078POST\u3057\u3001RP\u5074\u3082\u81EA\u8EAB\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7D42\u4E86\u3057\u307E\u3059\uFF08\u30B7\u30F3\u30B0\u30EB\u30ED\u30B0\u30A2\u30A6\u30C8\uFF09\u3002",
    label_client_secret: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8 (OIDC)",
    note_confidential: "\u6A5F\u5BC6\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u3067\u3059\u3002/oauth/token \u3067 client_secret \u3068\u3057\u3066\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    note_public: "\u30D1\u30D6\u30EA\u30C3\u30AF\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u3067\u3059\u3002\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u306F\u7121\u304F\u3001PKCE \u304C\u5FC5\u9808\u3067\u3059\u3002",
    secret_public_placeholder: "(\u30D1\u30D6\u30EA\u30C3\u30AF\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 \u2014 \u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u306A\u3057)",
    confirm_make_public: "\u3053\u306E\u30A2\u30D7\u30EA\u3092\u30D1\u30D6\u30EA\u30C3\u30AF\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u306B\u3057\u307E\u3059\u304B\uFF1F \u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u306F\u524A\u9664\u3055\u308C\u3001PKCE \u304C\u5FC5\u9808\u306B\u306A\u308A\u307E\u3059\u3002",
    label_preview: "\u30D7\u30EC\u30D3\u30E5\u30FC",
    btn_regenerate_secret: "\u518D\u751F\u6210",
    btn_make_public: "\u30D1\u30D6\u30EA\u30C3\u30AF\u306B\u3059\u308B (SPA)",
    placeholder_description: "\u30A2\u30D7\u30EA\u306E\u6982\u8981\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044...",
    placeholder_app_id: "\u4F8B: todo-app",
    placeholder_app_name: "\u8868\u793A\u540D\u3092\u5165\u529B",
    placeholder_select: "\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044...",
    text_no_results: "\u8A72\u5F53\u306A\u3057",
    btn_add_app: "\u30A2\u30D7\u30EA\u3092\u8FFD\u52A0",
    btn_pause: "\u505C\u6B62\u3059\u308B",
    btn_resume: "\u518D\u958B\u3059\u308B",
    status_active: "\u7A3C\u50CD\u4E2D",
    status_inactive: "\u505C\u6B62\u4E2D",
    confirm_delete_app: "\u672C\u5F53\u306B\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u3053\u306E\u30A2\u30D7\u30EA\u306B\u95A2\u9023\u3059\u308B\u5168\u3066\u306E\u30E6\u30FC\u30B6\u30FC\u6A29\u9650\u30FB\u6240\u5C5E\u6A29\u9650\u3082\u5B8C\u5168\u306B\u524A\u9664\u3055\u308C\u307E\u3059\u3002",
    confirm_change_status: "{name} \u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u5909\u66F4\u3057\u307E\u3059\u304B\uFF1F",
    section_groups: "\u6240\u5C5E\u7BA1\u7406",
    header_new_group: "\u65B0\u898F\u6240\u5C5E\u767B\u9332",
    label_group_name: "\u6240\u5C5E\u540D",
    placeholder_group_name: "\u4F8B: \u55B6\u696D\u90E8",
    btn_add_group: "\u6240\u5C5E\u3092\u8FFD\u52A0",
    no_groups: "\u6240\u5C5E\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
    confirm_delete_group: "\u672C\u5F53\u306B\u3053\u306E\u6240\u5C5E\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u3053\u306E\u6240\u5C5E\u306B\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u308B\u30E6\u30FC\u30B6\u30FC\u306F\u300C\u6240\u5C5E\u306A\u3057\u300D\u306B\u306A\u308A\u307E\u3059\u3002",
    section_users: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406",
    header_invite: "\u65B0\u898F\u30E6\u30FC\u30B6\u30FC\u62DB\u5F85",
    placeholder_invite_email: "\u62DB\u5F85\u3059\u308B\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
    btn_generate_invite: "\u62DB\u5F85\u72B6\u3092\u4F5C\u6210",
    header_registered_users: "\u767B\u9332\u6E08\u307F\u30E6\u30FC\u30B6\u30FC",
    label_affiliation: "\u6240\u5C5E",
    no_affiliation: "\u6240\u5C5E\u306A\u3057",
    confirm_delete_user: "\u672C\u5F53\u306B\u3053\u306E\u30E6\u30FC\u30B6\u30FC\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\n\u3053\u306E\u64CD\u4F5C\u306F\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3002",
    confirm_revoke_permission: "\u672C\u5F53\u306B\u3053\u306E\u6A29\u9650\u3092\u53D6\u308A\u6D88\u3057\u307E\u3059\u304B\uFF1F",
    confirm_overwrite: "\u4EE5\u4E0B\u306E\u6A29\u9650\u304C {start} \uFF5E {end} \u3067\u4E0A\u66F8\u304D\u3055\u308C\u307E\u3059\u3002\n{list}\n\n\u672C\u5F53\u306B\u826F\u3044\u3067\u3059\u304B\uFF1F",
    alert_select_app: "\u30A2\u30D7\u30EA\u3092\u5C11\u306A\u304F\u3068\u30821\u3064\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",
    alert_update_fail: "\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F: {message}",
    alert_error: "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: {message}",
    btn_bulk_mode: "\u4E00\u62EC\u7DE8\u96C6\u30E2\u30FC\u30C9",
    btn_exit_bulk: "\u4E00\u62EC\u30E2\u30FC\u30C9\u7D42\u4E86",
    btn_bulk_apply: "\u4E00\u62EC\u9069\u7528",
    header_user_details: "\u30E6\u30FC\u30B6\u30FC\u8A73\u7D30\u30FB\u6A29\u9650",
    tab_permissions: "\u6A29\u9650\u72B6\u6CC1",
    header_grant: "\u6A29\u9650\u3092\u4ED8\u4E0E",
    header_grant_permission: "\u6A29\u9650\u4ED8\u4E0E",
    header_active_permissions: "\u6709\u52B9\u306A\u6A29\u9650\u30EA\u30B9\u30C8",
    label_user: "\u30E6\u30FC\u30B6\u30FC",
    label_app: "\u30A2\u30D7\u30EA",
    label_valid_from: "\u958B\u59CB\u65E5",
    label_valid_to: "\u7D42\u4E86\u65E5",
    btn_grant: "\u6A29\u9650\u4ED8\u4E0E",
    permission_source: "\u9069\u7528\u5143",
    source_user: "\u30E6\u30FC\u30B6\u30FC\u500B\u5225",
    source_group: "\u6240\u5C5E(\u7D99\u627F)",
    msg_override: "\u203B\u30E6\u30FC\u30B6\u30FC\u500B\u5225\u306E\u8A2D\u5B9A\u304C\u3042\u308B\u5834\u5408\u3001\u6240\u5C5E\u306E\u8A2D\u5B9A\u3088\u308A\u512A\u5148\u3055\u308C\u307E\u3059\u3002",
    modal_th_app: "\u30A2\u30D7\u30EA\u540D",
    modal_th_source: "\u9069\u7528\u5143",
    modal_th_valid: "\u6709\u52B9\u671F\u9593",
    modal_th_action: "\u64CD\u4F5C",
    modal_section_group: "\u6240\u5C5E\u8A2D\u5B9A",
    desc_group_override: "\u203B\u30E6\u30FC\u30B6\u30FC\u500B\u5225\u306E\u8A2D\u5B9A\u304C\u3042\u308B\u5834\u5408\u3001\u6240\u5C5E\u306E\u8A2D\u5B9A\u3088\u308A\u512A\u5148\u3055\u308C\u307E\u3059\u3002",
    modal_section_perm: "\u73FE\u5728\u306E\u6A29\u9650",
    modal_section_add: "\u6A29\u9650\u3092\u8FFD\u52A0",
    modal_label_app: "\u30A2\u30D7\u30EA\u3092\u9078\u629E (\u8907\u6570\u53EF)",
    modal_label_no_expire: "\u7121\u671F\u9650",
    btn_add_perm: "\u6A29\u9650\u3092\u8FFD\u52A0",
    btn_change: "\u5909\u66F4",
    btn_date_today: "\u4ECA\u65E5",
    btn_date_start_month: "\u6708\u521D",
    btn_term_1mo: "+1\u30F6\u6708",
    btn_term_1yr: "+1\u5E74",
    btn_term_forever: "\u7121\u671F\u9650",
    section_logs: "\u76E3\u67FB\u30ED\u30B0",
    th_time: "\u65E5\u6642",
    th_event: "\u30A4\u30D9\u30F3\u30C8",
    th_details: "\u8A73\u7D30",
    label_filter_event: "\u30A4\u30D9\u30F3\u30C8\u3067\u7D5E\u308A\u8FBC\u307F",
    option_all_events: "\u5168\u3066\u306E\u30A4\u30D9\u30F3\u30C8",
    btn_filter: "\u9069\u7528",
    pager_prev: "\u2190 \u524D\u3078",
    pager_next: "\u6B21\u3078 \u2192",
    pager_info: "\u30DA\u30FC\u30B8 {current} / {total} (\u5168 {count} \u4EF6)",
    event_APP_CREATED: "\u30A2\u30D7\u30EA\u4F5C\u6210",
    event_APP_UPDATED: "\u30A2\u30D7\u30EA\u66F4\u65B0",
    event_APP_DELETED: "\u30A2\u30D7\u30EA\u524A\u9664",
    event_PERMISSION_GRANT: "\u6A29\u9650\u4ED8\u4E0E",
    event_PERMISSION_REVOKE: "\u6A29\u9650\u53D6\u6D88",
    event_USER_UPDATE: "\u30E6\u30FC\u30B6\u30FC\u66F4\u65B0",
    event_USER_DELETED: "\u30E6\u30FC\u30B6\u30FC\u524A\u9664",
    event_GROUP_PERMISSION_GRANT: "G\u6A29\u9650\u4ED8\u4E0E",
    event_GROUP_PERMISSION_REVOKE: "G\u6A29\u9650\u53D6\u6D88",
    event_GROUP_DELETED: "\u6240\u5C5E\u524A\u9664",
    event_MEMBERSHIP_ADD: "\u30E1\u30F3\u30D0\u30FC\u8FFD\u52A0",
    event_MEMBERSHIP_REMOVE: "\u30E1\u30F3\u30D0\u30FC\u89E3\u9664",
    event_LOGIN: "\u30ED\u30B0\u30A4\u30F3",
    event_PASSWORD_CHANGE: "\u30D1\u30B9\u30EF\u30FC\u30C9\u5909\u66F4",
    log_login: "\u30E6\u30FC\u30B6\u30FC\u30ED\u30B0\u30A4\u30F3: {email}",
    log_login_app: "\u30E6\u30FC\u30B6\u30FC\u30ED\u30B0\u30A4\u30F3: {email} (\u5BFE\u8C61: {appName})",
    log_app_created: '\u30A2\u30D7\u30EA "{appName}" ({id}) \u4F5C\u6210\u8005: {admin}',
    log_app_updated: '\u30A2\u30D7\u30EA "{appName}" \u66F4\u65B0 (\u72B6\u614B: {status}) \u5B9F\u884C: {admin}',
    log_app_deleted: '\u30A2\u30D7\u30EA "{id}" \u524A\u9664 \u5B9F\u884C: {admin}',
    log_user_group_update: '\u30E6\u30FC\u30B6\u30FC {user} \u306E\u6240\u5C5E\u3092 "{group}" \u306B\u5909\u66F4 (\u5B9F\u884C: {admin})',
    log_permission_grant: "\u30E6\u30FC\u30B6\u30FC {user} \u306B\u30A2\u30D7\u30EA [{apps}] \u3092\u4ED8\u4E0E (\u5B9F\u884C: {admin})",
    log_permission_revoke: "\u6A29\u9650 {id} \u3092\u53D6\u6D88 (\u5B9F\u884C: {admin})",
    log_user_deleted: "\u30E6\u30FC\u30B6\u30FC {id} \u3092\u524A\u9664 (\u5B9F\u884C: {admin})",
    log_group_permission_grant: '\u30B0\u30EB\u30FC\u30D7 "{group}" \u306B\u30A2\u30D7\u30EA [{apps}] \u3092\u4ED8\u4E0E (\u5B9F\u884C: {admin})',
    log_group_permission_revoke: "\u30B0\u30EB\u30FC\u30D7\u6A29\u9650 {id} \u3092\u53D6\u6D88 (\u5B9F\u884C: {admin})",
    log_group_deleted: "\u6240\u5C5E {id} \u3092\u524A\u9664 (\u5B9F\u884C: {admin})",
    log_membership_add: "\u30B0\u30EB\u30FC\u30D7 {group} \u306B {count}\u540D \u3092 {role} \u3068\u3057\u3066\u8FFD\u52A0 (\u5B9F\u884C: {admin})",
    log_membership_remove: "\u6240\u5C5E {id} \u3092\u89E3\u9664 (\u5B9F\u884C: {admin})",
    log_bulk_update: "\u4E00\u62EC\u66F4\u65B0 ({count}\u540D) \u5B9F\u884C: {admin} | \u6240\u5C5E: {group}, \u30A2\u30D7\u30EA: {app}",
    log_password_change: "\u30E6\u30FC\u30B6\u30FC {email} \u304C\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5909\u66F4\u3057\u307E\u3057\u305F",
    welcome: "\u3088\u3046\u3053\u305D",
    setup_desc: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A\u3057\u307E\u3059:",
    reset_desc: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u518D\u8A2D\u5B9A\u3057\u307E\u3059:",
    label_new_password: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9",
    btn_create_account: "\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210",
    btn_reset_password: "\u30D1\u30B9\u30EF\u30FC\u30C9\u5909\u66F4",
    btn_send_link: "\u30EA\u30BB\u30C3\u30C8\u30EA\u30F3\u30AF\u3092\u9001\u4FE1",
    invite_created: "\u62DB\u5F85\u30EA\u30F3\u30AF\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F",
    invite_copy_hint: "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    link_sent: "\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u5B58\u5728\u3059\u308B\u5834\u5408\u3001\u30EA\u30BB\u30C3\u30C8\u30EA\u30F3\u30AF\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F(\u30B3\u30F3\u30BD\u30FC\u30EB\u78BA\u8A8D)",
    error_credentials: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u9593\u9055\u3063\u3066\u3044\u307E\u3059",
    error_rate_limited: "\u8A66\u884C\u56DE\u6570\u304C\u591A\u3059\u304E\u307E\u3059\u3002\u5C11\u3057\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    error_required: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
    error_user_exists: "\u30E6\u30FC\u30B6\u30FC\u306F\u65E2\u306B\u5B58\u5728\u3057\u307E\u3059",
    error_invalid_invite: "\u7121\u52B9\u306A\u30EA\u30F3\u30AF\u3067\u3059",
    error_access_denied: "\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093",
    error_not_started: "\u671F\u9593\u524D\u3067\u3059",
    error_expired: "\u671F\u9650\u5207\u308C\u3067\u3059",
    msg_account_created: "\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    stat_apps: "\u767B\u9332\u30A2\u30D7\u30EA\u6570",
    stat_users: "\u767B\u9332\u30E6\u30FC\u30B6\u30FC\u6570",
    stat_logs: "\u7DCF\u30ED\u30B0\u6570",
    title_setup_2fa: "2\u6BB5\u968E\u8A8D\u8A3C\u8A2D\u5B9A",
    header_setup_2fa: "2\u6BB5\u968E\u8A8D\u8A3C\u306E\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7",
    label_2fa_status: "2\u6BB5\u968E\u8A8D\u8A3C",
    status_enabled: "\u6709\u52B9",
    status_disabled: "\u7121\u52B9",
    btn_setup_2fa: "2\u6BB5\u968E\u8A8D\u8A3C\u3092\u8A2D\u5B9A",
    btn_disable_2fa: "\u7121\u52B9\u306B\u3059\u308B",
    title_2fa_verify: "2\u6BB5\u968E\u8A8D\u8A3C",
    header_2fa_verify: "\u8A8D\u8A3C\u30B3\u30FC\u30C9\u5165\u529B",
    desc_2fa_verify: "\u8A8D\u8A3C\u30A2\u30D7\u30EA\u306B\u8868\u793A\u3055\u308C\u3066\u3044\u308B6\u6841\u306E\u30B3\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    btn_verify: "\u8A8D\u8A3C\u3059\u308B",
    desc_setup_2fa: "\u8A8D\u8A3C\u30A2\u30D7\u30EA\uFF08Google Authenticator\u306A\u3069\uFF09\u3067QR\u30B3\u30FC\u30C9\u3092\u30B9\u30AD\u30E3\u30F3\u3057\u3001\u8868\u793A\u3055\u308C\u305F6\u6841\u306E\u30B3\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    label_secret_key: "\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u30AD\u30FC",
    label_otp_code: "\u78BA\u8A8D\u30B3\u30FC\u30C9",
    err_invalid_code: "\u30B3\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    msg_2fa_enabled: "2\u6BB5\u968E\u8A8D\u8A3C\u3092\u6709\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
    msg_2fa_disabled: "2\u6BB5\u968E\u8A8D\u8A3C\u3092\u7121\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
    confirm_disable_2fa: "\u672C\u5F53\u306B2\u6BB5\u968E\u8A8D\u8A3C\u3092\u7121\u52B9\u306B\u3057\u307E\u3059\u304B\uFF1F",
    // Config
    config_change_name: "\u30B7\u30B9\u30C6\u30E0\u540D\u79F0\u5909\u66F4",
    label_app_name_ja: "\u30B7\u30B9\u30C6\u30E0\u540D (\u65E5\u672C\u8A9E)",
    label_app_name_en: "\u30B7\u30B9\u30C6\u30E0\u540D (\u82F1\u8A9E)",
    label_app_subtitle_ja: "\u526F\u984C (\u65E5\u672C\u8A9E)",
    label_app_subtitle_en: "\u526F\u984C (\u82F1\u8A9E)"
  }
};

// node_modules/hono/dist/jsx/jsx-runtime.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/base.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/context.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/dom/context.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/dom/utils.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var setInternalTagFlag = /* @__PURE__ */ __name((fn) => {
  ;
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
}, "setInternalTagFlag");

// node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = /* @__PURE__ */ __name((values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
}, "createContextProviderFunction");

// node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var createContext = /* @__PURE__ */ __name((defaultValue) => {
  const values = [defaultValue];
  const context = /* @__PURE__ */ __name(((props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } catch (e) {
      values.pop();
      throw e;
    }
    if (string instanceof Promise) {
      return string.finally(() => values.pop()).then((resString) => raw(resString, resString.callbacks));
    } else {
      values.pop();
      return raw(string);
    }
  }), "context");
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
}, "createContext");
var useContext = /* @__PURE__ */ __name((context) => {
  return context.values.at(-1);
}, "useContext");

// node_modules/hono/dist/jsx/intrinsic-element/common.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";
var isStylesheetLinkWithPrecedence = /* @__PURE__ */ __name((props) => props.rel === "stylesheet" && "precedence" in props, "isStylesheetLinkWithPrecedence");
var shouldDeDupeByKey = /* @__PURE__ */ __name((tagName, supportSort) => {
  if (tagName === "link") {
    return supportSort;
  }
  return deDupeKeyMap[tagName].length > 0;
}, "shouldDeDupeByKey");

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var components_exports = {};
__export(components_exports, {
  button: () => button,
  form: () => form,
  input: () => input,
  link: () => link,
  meta: () => meta,
  script: () => script,
  style: () => style,
  title: () => title2
});
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();

// node_modules/hono/dist/jsx/children.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var toArray = /* @__PURE__ */ __name((children) => Array.isArray(children) ? children : [children], "toArray");

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = /* @__PURE__ */ __name((tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] ||= [];
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  const deDupeByKey = shouldDeDupeByKey(tagName, precedence !== void 0);
  if (deDupeByKey) {
    LOOP: for (const [, tagProps] of tags) {
      if (tagName === "link" && !(tagProps.rel === "stylesheet" && tagProps[dataPrecedenceAttr] !== void 0)) {
        continue;
      }
      for (const key of deDupeKeys) {
        if ((tagProps?.[key] ?? null) === props?.[key]) {
          duped = true;
          break LOOP;
        }
      }
    }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeByKey || tagName === "link") {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (tagName === "link" || precedence !== void 0) {
      const precedences = [];
      insertTags = tags.map(([tag2, , tagPrecedence], index) => {
        if (tagPrecedence === void 0) {
          return [tag2, Number.MAX_SAFE_INTEGER, index];
        }
        let order = precedences.indexOf(tagPrecedence);
        if (order === -1) {
          precedences.push(tagPrecedence);
          order = precedences.length - 1;
        }
        return [tag2, order, index];
      }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(([tag2]) => tag2);
    } else {
      insertTags = tags.map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
}, "insertIntoHead");
var returnWithoutSpecialBehavior = /* @__PURE__ */ __name((tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString()), "returnWithoutSpecialBehavior");
var documentMetadataTag = /* @__PURE__ */ __name((tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
}, "documentMetadataTag");
var title2 = /* @__PURE__ */ __name(({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag("title", children, props, false);
}, "title");
var script = /* @__PURE__ */ __name(({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag("script", children, props, false);
}, "script");
var style = /* @__PURE__ */ __name(({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", children, props, true);
}, "style");
var link = /* @__PURE__ */ __name(({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag("link", children, props, isStylesheetLinkWithPrecedence(props));
}, "link");
var meta = /* @__PURE__ */ __name(({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag("meta", children, props, false);
}, "meta");
var newJSXNode = /* @__PURE__ */ __name((tag, { children, ...props }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new JSXNode(tag, props, toArray(children ?? []))
), "newJSXNode");
var form = /* @__PURE__ */ __name((props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
}, "form");
var formActionableElement = /* @__PURE__ */ __name((tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
}, "formActionableElement");
var input = /* @__PURE__ */ __name((props) => formActionableElement("input", props), "input");
var button = /* @__PURE__ */ __name((props) => formActionableElement("button", props), "button");

// node_modules/hono/dist/jsx/utils.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = /* @__PURE__ */ __name((key) => normalizeElementKeyMap.get(key) || key, "normalizeIntrinsicElementKey");
var invalidAttributeNameCharRe = /[\s"'<>/=`\\\x00-\x1f\x7f-\x9f]/;
var validAttributeNameCache = /* @__PURE__ */ new Set();
var validAttributeNameCacheMax = 1024;
var invalidTagNameCharRe = /^[!?]|[\s"'<>/=`\\\x00-\x1f\x7f-\x9f]/;
var validTagNameCache = /* @__PURE__ */ new Set();
var validTagNameCacheMax = 256;
var cacheValidName = /* @__PURE__ */ __name((cache2, max, name) => {
  if (cache2.size >= max) {
    cache2.clear();
  }
  cache2.add(name);
}, "cacheValidName");
var isValidTagName = /* @__PURE__ */ __name((name) => {
  if (validTagNameCache.has(name)) {
    return true;
  }
  if (typeof name !== "string") {
    return false;
  }
  if (name.length === 0) {
    return true;
  }
  if (invalidTagNameCharRe.test(name)) {
    return false;
  }
  cacheValidName(validTagNameCache, validTagNameCacheMax, name);
  return true;
}, "isValidTagName");
var isValidAttributeName = /* @__PURE__ */ __name((name) => {
  if (validAttributeNameCache.has(name)) {
    return true;
  }
  const len = name.length;
  if (len === 0) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    const c = name.charCodeAt(i);
    if (!(c >= 97 && c <= 122 || // a-z
    c >= 65 && c <= 90 || // A-Z
    c >= 48 && c <= 57 || // 0-9
    c === 45 || // -
    c === 95 || // _
    c === 46 || // .
    c === 58)) {
      if (!invalidAttributeNameCharRe.test(name)) {
        cacheValidName(validAttributeNameCache, validAttributeNameCacheMax, name);
        return true;
      } else {
        return false;
      }
    }
  }
  cacheValidName(validAttributeNameCache, validAttributeNameCacheMax, name);
  return true;
}, "isValidAttributeName");
var invalidStylePropertyNameCharRe = /[\s"'():;\\/\[\]{}\x00-\x1f\x7f-\x9f]/;
var validStylePropertyNameCache = /* @__PURE__ */ new Set();
var validStylePropertyNameCacheMax = 1024;
var isValidStylePropertyName = /* @__PURE__ */ __name((name) => {
  if (validStylePropertyNameCache.has(name)) {
    return true;
  }
  const len = name.length;
  if (len === 0) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    const c = name.charCodeAt(i);
    if (!(c >= 97 && c <= 122 || // a-z
    c >= 65 && c <= 90 || // A-Z
    c >= 48 && c <= 57 || // 0-9
    c === 45 || // -
    c === 95)) {
      if (!invalidStylePropertyNameCharRe.test(name)) {
        cacheValidName(validStylePropertyNameCache, validStylePropertyNameCacheMax, name);
        return true;
      } else {
        return false;
      }
    }
  }
  cacheValidName(validStylePropertyNameCache, validStylePropertyNameCacheMax, name);
  return true;
}, "isValidStylePropertyName");
var unsafeStyleValueCharRe = /[;"'\\/\[\](){}]/;
var hasUnsafeStyleValue = /* @__PURE__ */ __name((value) => {
  if (!unsafeStyleValueCharRe.test(value)) {
    return false;
  }
  let quote = 0;
  const blockStack = [];
  for (let i = 0, len = value.length; i < len; i++) {
    const c = value.charCodeAt(i);
    if (c === 92) {
      if (i === len - 1) {
        return true;
      }
      i++;
    } else if (quote !== 0) {
      if (c === 10 || c === 12 || c === 13) {
        return true;
      }
      if (c === quote) {
        quote = 0;
      }
    } else if (c === 47 && value.charCodeAt(i + 1) === 42) {
      const end = value.indexOf("*/", i + 2);
      if (end === -1) {
        return true;
      }
      i = end + 1;
    } else if (c === 34 || c === 39) {
      quote = c;
    } else if (c === 40) {
      blockStack.push(41);
    } else if (c === 91) {
      blockStack.push(93);
    } else if (c === 123 || c === 125) {
      return true;
    } else if (c === 41 || c === 93) {
      if (blockStack[blockStack.length - 1] !== c) {
        return true;
      }
      blockStack.pop();
    } else if (c === 59 && blockStack.length === 0) {
      return true;
    }
  }
  return quote !== 0 || blockStack.length !== 0;
}, "hasUnsafeStyleValue");
var styleObjectForEach = /* @__PURE__ */ __name((style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    if (!isValidStylePropertyName(key)) {
      continue;
    }
    if (v == null) {
      fn(key, null);
      continue;
    }
    let value;
    if (typeof v === "number") {
      value = !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}`;
    } else if (typeof v === "string") {
      if (hasUnsafeStyleValue(v)) {
        continue;
      }
      value = v;
    } else {
      continue;
    }
    fn(key, value);
  }
}, "styleObjectForEach");

// node_modules/hono/dist/jsx/base.js
var nameSpaceContext = void 0;
var getNameSpaceContext = /* @__PURE__ */ __name(() => nameSpaceContext, "getNameSpaceContext");
var toSVGAttributeName = /* @__PURE__ */ __name((key) => /[A-Z]/.test(key) && // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
// Or other un-deprecated kebab-case attributes. "overline-position", "paint-order", "strikethrough-position", etc.
key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key, "toSVGAttributeName");
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = /* @__PURE__ */ __name((children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
}, "childrenToStringToBuffer");
var JSXNode = class {
  static {
    __name(this, "JSXNode");
  }
  tag;
  props;
  key;
  children;
  isEscaped = true;
  localContexts;
  constructor(tag, props, children) {
    if (typeof tag !== "function" && !isValidTagName(tag)) {
      throw new Error(`Invalid JSX tag name: ${tag}`);
    }
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  // Added for compatibility with libraries that rely on React's internal structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const buffer = [""];
    this.localContexts?.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      this.localContexts?.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = tag === "svg" || nameSpaceContext && useContext(nameSpaceContext) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (!isValidAttributeName(key)) {
        continue;
      }
      if (key === "children") {
      } else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  static {
    __name(this, "JSXFunctionNode");
  }
  toStringToBuffer(buffer) {
    const { children } = this;
    const props = { ...this.props };
    if (children.length) {
      props.children = children.length === 1 ? children[0] : children;
    }
    const res = this.tag.call(null, props);
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const currentContexts = globalContexts.map((c) => [c, c.values.at(-1)]);
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.localContexts = currentContexts;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks ||= [];
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  static {
    __name(this, "JSXFragmentNode");
  }
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var initDomRenderer = false;
var jsxFn = /* @__PURE__ */ __name((tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      ;
      components_exports[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (components_exports[tag]) {
    return new JSXFunctionNode(
      components_exports[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext ||= createContext("");
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
}, "jsxFn");

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}
__name(jsxDEV, "jsxDEV");

// src/index.tsx
var app = new Hono2();
var oidcCsrfExempt = /* @__PURE__ */ __name((path) => path === "/oauth/token" || path === "/oauth/revoke" || path === "/oauth/introspect" || path === "/register" || path === "/userinfo" || path === "/oidc/logout" || path.startsWith("/api/"), "oidcCsrfExempt");
app.use("*", async (c, next) => {
  if (oidcCsrfExempt(c.req.path)) return next();
  return csrf()(c, next);
});
var getLang = /* @__PURE__ */ __name((c) => {
  const accept = c.req.header("Accept-Language") || "";
  return accept.includes("ja") ? dict.ja : dict.en;
}, "getLang");
async function getSystemConfig(db) {
  const config2 = {
    appName: { ja: "Tobira", en: "Tobira" },
    appSubtitle: { ja: "Secure Identity Provider", en: "Secure Identity Provider" }
  };
  try {
    const { results } = await db.prepare("SELECT * FROM system_config").all();
    if (results) {
      results.forEach((r) => {
        if (r.key === "app_name_ja") config2.appName.ja = r.value;
        if (r.key === "app_name_en") config2.appName.en = r.value;
        if (r.key === "app_subtitle_ja") config2.appSubtitle.ja = r.value;
        if (r.key === "app_subtitle_en") config2.appSubtitle.en = r.value;
      });
    }
  } catch (e) {
    console.error("Config fetch failed:", e);
  }
  return config2;
}
__name(getSystemConfig, "getSystemConfig");
function getLocalizedValue(c, text) {
  const accept = c.req.header("Accept-Language") || "";
  return accept.includes("ja") ? text.ja : text.en;
}
__name(getLocalizedValue, "getLocalizedValue");
async function handleIconUpload(body) {
  const file = body["icon_file"];
  if (file && file instanceof File && file.size > 0) {
    if (file.size > 1024 * 150) {
      console.warn("Icon file too large:", file.size);
      return null;
    }
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:${file.type};base64,${btoa(binary)}`;
  }
  return null;
}
__name(handleIconUpload, "handleIconUpload");
async function checkPermission(c, userId, appId) {
  const now = Math.floor(Date.now() / 1e3);
  const app2 = await c.env.DB.prepare("SELECT status FROM apps WHERE id = ?").bind(appId).first();
  if (app2 && app2.status === "inactive") {
    return { allowed: false, reason: "App is paused" };
  }
  const userPerm = await c.env.DB.prepare("SELECT * FROM permissions WHERE user_id = ? AND app_id = ?").bind(userId, appId).first();
  if (userPerm) {
    if (userPerm.valid_from <= now && userPerm.valid_to >= now) return { allowed: true };
    else return { allowed: false, reason: "User permission expired/invalid" };
  }
  const user = await c.env.DB.prepare("SELECT group_id FROM users WHERE id = ?").bind(userId).first();
  if (user && user.group_id) {
    const groupPerm = await c.env.DB.prepare("SELECT * FROM group_permissions WHERE group_id = ? AND app_id = ?").bind(user.group_id, appId).first();
    if (groupPerm && groupPerm.valid_from <= now && groupPerm.valid_to >= now) return { allowed: true };
  }
  return { allowed: false, reason: "No permission found" };
}
__name(checkPermission, "checkPermission");
async function rateLimit(db, key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1e3);
  const row = await db.prepare("SELECT count, reset_at FROM rate_limits WHERE k = ?").bind(key).first();
  if (!row || row.reset_at <= now) {
    await db.prepare("INSERT INTO rate_limits (k, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = excluded.reset_at").bind(key, now + windowSec).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare("UPDATE rate_limits SET count = count + 1 WHERE k = ?").bind(key).run();
  return true;
}
__name(rateLimit, "rateLimit");
async function getAdmin(c) {
  const sessionId = getCookie(c, "__Host-idp_session");
  if (!sessionId) return null;
  const session = await c.env.DB.prepare("SELECT user_id FROM sessions WHERE id = ?").bind(sessionId).first();
  if (!session) return null;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first();
  const admin = await c.env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(user?.email).first();
  return admin ? user : null;
}
__name(getAdmin, "getAdmin");
async function getUser(c) {
  const sessionId = getCookie(c, "__Host-idp_session");
  if (!sessionId) return null;
  const session = await c.env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(sessionId, Math.floor(Date.now() / 1e3)).first();
  if (!session) return null;
  return await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first();
}
__name(getUser, "getUser");
async function logAudit(c, eventType, details) {
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind(eventType, JSON.stringify(details)).run();
}
__name(logAudit, "logAudit");
async function deleteServiceCascade(c, serviceId) {
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM service_user_assignments WHERE service_id = ?").bind(serviceId),
    c.env.DB.prepare("DELETE FROM service_role_master WHERE service_id = ?").bind(serviceId),
    c.env.DB.prepare("DELETE FROM group_service_grants WHERE service_id = ?").bind(serviceId),
    c.env.DB.prepare("DELETE FROM service_contracts WHERE service_id = ?").bind(serviceId),
    c.env.DB.prepare("DELETE FROM services WHERE id = ?").bind(serviceId)
  ]);
}
__name(deleteServiceCascade, "deleteServiceCascade");
async function getSessionRow(c) {
  const sessionId = getCookie(c, "__Host-idp_session");
  if (!sessionId) return null;
  return await c.env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > ?").bind(sessionId, Math.floor(Date.now() / 1e3)).first();
}
__name(getSessionRow, "getSessionRow");
async function createSession(c, userId) {
  const sessionId = generateToken();
  const now = Math.floor(Date.now() / 1e3);
  const expires = now + 86400;
  await c.env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at, auth_time) VALUES (?, ?, ?, ?)").bind(sessionId, userId, expires, now).run();
  setCookie(c, "__Host-idp_session", sessionId, getCookieOptions(expires));
}
__name(createSession, "createSession");
function parseRedirectUris(raw3) {
  return (raw3 || "").split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
}
__name(parseRedirectUris, "parseRedirectUris");
function isAllowedRedirectUri(redirectUri, app2) {
  const registered = parseRedirectUris(app2.redirect_uris);
  if (registered.length > 0) return registered.includes(redirectUri);
  let redir, base;
  try {
    redir = new URL(redirectUri);
    base = new URL(app2.base_url);
  } catch {
    return false;
  }
  if (redir.protocol !== "https:" && redir.protocol !== "http:") return false;
  if (redir.origin !== base.origin) return false;
  const basePath = base.pathname.replace(/\/+$/, "");
  if (basePath === "") return true;
  return redir.pathname === basePath || redir.pathname.startsWith(basePath + "/");
}
__name(isAllowedRedirectUri, "isAllowedRedirectUri");
app.get("/", async (c) => {
  try {
    const t = getLang(c);
    const user = await getUser(c);
    const config2 = await getSystemConfig(c.env.DB);
    const siteName = getLocalizedValue(c, config2.appName);
    if (!user) return c.redirect("/login");
    const now = Math.floor(Date.now() / 1e3);
    const { results: apps } = await c.env.DB.prepare(`
        SELECT DISTINCT a.* FROM apps a
        LEFT JOIN permissions up ON a.id = up.app_id AND up.user_id = ?
        LEFT JOIN group_permissions gp ON a.id = gp.app_id AND gp.group_id = ?
        WHERE 
          (a.status IS NULL OR a.status = 'active') AND
          ((up.valid_from <= ? AND up.valid_to >= ?) OR (up.id IS NULL AND gp.valid_from <= ? AND gp.valid_to >= ?))
      `).bind(user.id, user.group_id || null, now, now, now, now).all();
    const groupAdminCheck = await c.env.DB.prepare(
      `SELECT 1 FROM group_memberships WHERE user_id = ? AND role = 'group_admin' AND valid_from <= ? AND valid_to >= ? LIMIT 1`
    ).bind(user.id, now, now).first();
    const isGroupAdmin = !!groupAdminCheck;
    return c.html(/* @__PURE__ */ jsxDEV(UserDashboard, { t, userEmail: user.email, apps, siteName, profileName: user.name, profilePicture: user.picture, isGroupAdmin }));
  } catch (e) {
    return c.json({ error: e.message, stack: e.stack }, 500);
  }
});
app.get("/group-admin", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) return c.redirect("/login");
    const t = getLang(c);
    const config2 = await getSystemConfig(c.env.DB);
    const siteName = getLocalizedValue(c, config2.appName);
    const now = Math.floor(Date.now() / 1e3);
    const { results: managedGroups } = await c.env.DB.prepare(`
        SELECT g.*, (SELECT COUNT(*) FROM group_memberships m2 WHERE m2.group_id = g.id AND m2.valid_from <= ? AND m2.valid_to >= ?) AS member_count
        FROM groups g
        JOIN group_memberships m ON m.group_id = g.id
        WHERE m.user_id = ? AND m.role = 'group_admin' AND m.valid_from <= ? AND m.valid_to >= ?
        ORDER BY g.name
    `).bind(now, now, user.id, now, now).all();
    if (!managedGroups || managedGroups.length === 0) {
      const allUsers2 = [];
      return c.html(/* @__PURE__ */ jsxDEV(
        GroupAdminPage,
        {
          t,
          userEmail: user.email,
          siteName,
          profileName: user.name,
          profilePicture: user.picture,
          managedGroups: [],
          allUsers: allUsers2,
          membersByGroup: {},
          assignmentsByGroup: {},
          permissionsByGroup: {},
          apps: []
        }
      ));
    }
    const groupIds = managedGroups.map((g) => g.id);
    const { results: allUsers } = await c.env.DB.prepare("SELECT id, email, name FROM users ORDER BY email").all();
    const membersByGroup = {};
    for (const gid of groupIds) {
      const { results } = await c.env.DB.prepare(`
            SELECT m.id, m.user_id, u.email, u.name, m.role, m.valid_from, m.valid_to
            FROM group_memberships m JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? ORDER BY (m.role = 'group_admin') DESC, u.email
        `).bind(gid).all();
      membersByGroup[gid] = results || [];
    }
    const assignmentsByGroup = {};
    for (const gid of groupIds) {
      const { results } = await c.env.DB.prepare(`
            SELECT a.id, u.email AS user_email, u.name AS user_name,
                   s.name AS service_name, a.facility_id,
                   f.structure_no, f.building_use,
                   r.role_name, a.valid_from, a.valid_to
            FROM service_user_assignments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN facilities f ON a.facility_id = f.id
            LEFT JOIN service_roles r ON a.service_role_id = r.id
            WHERE a.group_id = ?
            ORDER BY u.email, s.name
        `).bind(gid).all();
      assignmentsByGroup[gid] = results || [];
    }
    const permissionsByGroup = {};
    for (const gid of groupIds) {
      const perms = [];
      const members = membersByGroup[gid] || [];
      for (const m of members) {
        const { results: userPerms } = await c.env.DB.prepare(`
                SELECT p.app_id, a.name AS app_name, p.valid_from, p.valid_to
                FROM permissions p JOIN apps a ON p.app_id = a.id
                WHERE p.user_id = ? AND p.valid_from <= ? AND p.valid_to >= ?
            `).bind(m.user_id, now, now).all();
        for (const p of userPerms || []) {
          perms.push({ ...p, source: "user", user_email: m.email });
        }
      }
      const { results: grpPerms } = await c.env.DB.prepare(`
            SELECT p.app_id, a.name AS app_name, p.valid_from, p.valid_to
            FROM group_permissions p JOIN apps a ON p.app_id = a.id
            WHERE p.group_id = ? AND p.valid_from <= ? AND p.valid_to >= ?
        `).bind(gid, now, now).all();
      for (const p of grpPerms || []) {
        perms.push({ ...p, source: "group", user_email: "(\u30B0\u30EB\u30FC\u30D7\u5171\u901A)" });
      }
      permissionsByGroup[gid] = perms;
    }
    return c.html(/* @__PURE__ */ jsxDEV(
      GroupAdminPage,
      {
        t,
        userEmail: user.email,
        siteName,
        profileName: user.name,
        profilePicture: user.picture,
        managedGroups,
        allUsers,
        membersByGroup,
        assignmentsByGroup,
        permissionsByGroup,
        apps: []
      }
    ));
  } catch (e) {
    return c.json({ error: e.message, stack: e.stack }, 500);
  }
});
app.get("/account", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const msgKey = c.req.query("msg");
  const message = msgKey && t[msgKey] ? t[msgKey] : void 0;
  return c.html(/* @__PURE__ */ jsxDEV(AccountPage, { t, userEmail: user.email, siteName, has2FA: !!user.two_factor_secret, profileName: user.name, profileUsername: user.preferred_username, profilePicture: user.picture, message }));
});
app.get("/login", async (c) => {
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const siteSubtitle = getLocalizedValue(c, config2.appSubtitle);
  const redirectTo = c.req.query("redirect_to");
  const returnTo = c.req.query("return_to");
  const msgKey = c.req.query("msg");
  const message = msgKey && t[msgKey] ? t[msgKey] : void 0;
  const reauth = c.req.query("reauth") === "1";
  const loginHint = c.req.query("login_hint");
  const user = await getUser(c);
  if (user && !reauth) {
    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo);
    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo);
    const admin = await c.env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(user.email).first();
    return c.redirect(admin ? "/admin" : "/");
  }
  return c.html(/* @__PURE__ */ jsxDEV(Login, { t, redirectTo, returnTo, message, siteName, siteSubtitle, email: loginHint }));
});
app.post("/login", async (c) => {
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const siteSubtitle = getLocalizedValue(c, config2.appSubtitle);
  const loginIp = c.req.header("CF-Connecting-IP") || "unknown";
  if (!await rateLimit(c.env.DB, `login:${loginIp}`, 10, 60)) {
    return c.html(/* @__PURE__ */ jsxDEV(Login, { t, error: t.error_rate_limited, siteName, siteSubtitle }), 429);
  }
  const body = await c.req.parseBody();
  const email = body["email"];
  const password = body["password"];
  const redirectTo = body["redirect_to"];
  const returnTo = body["return_to"];
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user || !await verifyPassword(password, user.password_hash)) {
    return c.html(/* @__PURE__ */ jsxDEV(Login, { t, redirectTo, returnTo, error: t.error_credentials, siteName, siteSubtitle }));
  }
  if (user.two_factor_secret) {
    const secret = c.env.JWT_SECRET || "dev_secret";
    const token = await sign2({ sub: user.id, role: "pre_2fa", exp: Math.floor(Date.now() / 1e3) + 300 }, secret);
    setCookie(c, "pre_2fa_token", token, { path: "/", secure: true, httpOnly: true, maxAge: 300, sameSite: "Lax" });
    const params = new URLSearchParams();
    if (redirectTo) params.set("redirect_to", redirectTo);
    if (returnTo) params.set("return_to", returnTo);
    const qs = params.toString();
    return c.redirect("/login/2fa" + (qs ? "?" + qs : ""));
  }
  await createSession(c, user.id);
  let targetAppName = "Tobira Dashboard";
  const admin = await c.env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(email).first();
  if (redirectTo) {
    const { results } = await c.env.DB.prepare("SELECT * FROM apps WHERE status = ?").bind("active").all();
    const app2 = results.find((a) => isAllowedRedirectUri(redirectTo, a));
    if (app2) targetAppName = app2.name;
  } else if (admin) {
    targetAppName = "Tobira Admin";
  }
  const details = JSON.stringify({ key: "log_login_app", params: { email, appName: targetAppName } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("LOGIN", details).run();
  if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo);
  if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo);
  return c.redirect(admin ? "/admin" : "/");
});
app.get("/signup", async (c) => {
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const siteSubtitle = getLocalizedValue(c, config2.appSubtitle);
  const redirectTo = c.req.query("redirect_to");
  const returnTo = c.req.query("return_to");
  const user = await getUser(c);
  if (user) {
    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo);
    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo);
    return c.redirect("/");
  }
  return c.html(/* @__PURE__ */ jsxDEV(Signup, { t, redirectTo, returnTo, siteName, siteSubtitle }));
});
app.post("/signup", async (c) => {
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const siteSubtitle = getLocalizedValue(c, config2.appSubtitle);
  const body = await c.req.parseBody();
  const email = (body["email"] || "").trim();
  const password = body["password"];
  const redirectTo = body["redirect_to"];
  const returnTo = body["return_to"];
  const view = /* @__PURE__ */ __name((error) => c.html(/* @__PURE__ */ jsxDEV(Signup, { t, redirectTo, returnTo, error, siteName, siteSubtitle })), "view");
  const signupIp = c.req.header("CF-Connecting-IP") || "unknown";
  if (!await rateLimit(c.env.DB, `signup:${signupIp}`, 5, 60)) {
    return c.html(/* @__PURE__ */ jsxDEV(Signup, { t, redirectTo, returnTo, error: t.error_rate_limited, siteName, siteSubtitle }), 429);
  }
  if (!email || !password) return view(t.error_required);
  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return view(t.error_user_exists);
  const grpRow = await c.env.DB.prepare("SELECT value FROM system_config WHERE key = 'signup_group_id'").first();
  const groupId = grpRow?.value || null;
  const userId = crypto.randomUUID();
  const pwHash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1e3);
  try {
    await c.env.DB.prepare("INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, email, pwHash, groupId, now, now).run();
  } catch (e) {
    return view(t.error_user_exists);
  }
  const details = JSON.stringify({ key: "log_login", params: { email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("SIGNUP", details).run();
  await createSession(c, userId);
  if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo);
  if (redirectTo) return issueCodeAndRedirect(c, userId, redirectTo);
  return c.redirect("/");
});
async function issueCodeAndRedirect(c, userId, redirectTo) {
  const { results } = await c.env.DB.prepare("SELECT * FROM apps WHERE status = ?").bind("active").all();
  const app2 = results.find((a) => isAllowedRedirectUri(redirectTo, a));
  if (!app2) {
    console.error(`[Auth] No app matches redirect_to: ${redirectTo}`);
    return c.text("Invalid App: Redirect URL not registered", 400);
  }
  const check = await checkPermission(c, userId, app2.id);
  if (!check.allowed) return c.text("Access Denied: " + (check.reason || ""), 403);
  const code = generateToken();
  const expires = Math.floor(Date.now() / 1e3) + 300;
  const session = await getSessionRow(c);
  await c.env.DB.prepare("INSERT INTO auth_codes (code, user_id, app_id, expires_at, auth_time) VALUES (?, ?, ?, ?, ?)").bind(code, userId, app2.id, expires, session?.auth_time ?? null).run();
  const separator = redirectTo.includes("?") ? "&" : "?";
  return c.redirect(`${redirectTo}${separator}code=${code}`);
}
__name(issueCodeAndRedirect, "issueCodeAndRedirect");
app.get("/logout", async (c) => {
  const sessionId = getCookie(c, "__Host-idp_session");
  if (sessionId) {
    const session = await c.env.DB.prepare("SELECT user_id FROM sessions WHERE id = ?").bind(sessionId).first();
    if (session) {
      await c.env.DB.prepare("DELETE FROM app_sessions WHERE user_id = ?").bind(session.user_id).run();
    }
    try {
      await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    } catch (e) {
    }
  }
  setCookie(c, "__Host-idp_session", "", { path: "/", secure: true, httpOnly: true, expires: /* @__PURE__ */ new Date(0) });
  return c.redirect("/login");
});
app.get("/user/2fa/setup", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const secret = generateSecret();
  const qrCode = await generateQRCode(secret, user.email, "Tobira");
  return c.html(/* @__PURE__ */ jsxDEV(Setup2FA, { t, qrCodeDataUrl: qrCode, secret, siteName, userEmail: user.email, profileName: user.name, profilePicture: user.picture }));
});
app.post("/user/2fa/setup", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const t = getLang(c);
  const body = await c.req.parseBody();
  const token = body["token"].replace(/\s+/g, "");
  const secret = body["secret"];
  if (verifyToken(token, secret)) {
    await c.env.DB.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").bind(secret, user.id).run();
    const details = JSON.stringify({ key: "log_2fa_enable", params: { email: user.email } });
    await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("2FA_ENABLE", details).run();
    return c.redirect("/account?msg=msg_2fa_enabled");
  } else {
    const config2 = await getSystemConfig(c.env.DB);
    const siteName = getLocalizedValue(c, config2.appName);
    const qrCode = await generateQRCode(secret, user.email, "Tobira");
    return c.html(/* @__PURE__ */ jsxDEV(Setup2FA, { t, qrCodeDataUrl: qrCode, secret, siteName, userEmail: user.email, profileName: user.name, profilePicture: user.picture, error: t.err_invalid_code }));
  }
});
app.post("/user/2fa/disable", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  await c.env.DB.prepare("UPDATE users SET two_factor_secret = NULL WHERE id = ?").bind(user.id).run();
  const details = JSON.stringify({ key: "log_2fa_disable", params: { email: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("2FA_DISABLE", details).run();
  return c.redirect("/account?msg=msg_2fa_disabled");
});
app.get("/change-password", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  return c.html(/* @__PURE__ */ jsxDEV(ChangePassword, { t: getLang(c), siteName, userEmail: user.email, profileName: user.name, profilePicture: user.picture }));
});
app.post("/change-password", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const password = body["password"];
  const pwHash = await hashPassword(password);
  await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(pwHash, user.id).run();
  const details = JSON.stringify({ key: "log_password_change", params: { email: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("PASSWORD_CHANGE", details).run();
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  return c.html(/* @__PURE__ */ jsxDEV(ChangePassword, { t: getLang(c), siteName, userEmail: user.email, profileName: user.name, profilePicture: user.picture, message: getLang(c).msg_password_changed }));
});
app.post("/user/profile", async (c) => {
  const user = await getUser(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body["name"] || "").trim() || null;
  const preferredUsername = (body["preferred_username"] || "").trim() || null;
  const picture = (body["picture"] || "").trim() || null;
  const now = Math.floor(Date.now() / 1e3);
  await c.env.DB.prepare("UPDATE users SET name = ?, preferred_username = ?, picture = ?, updated_at = ? WHERE id = ?").bind(name, preferredUsername, picture, now, user.id).run();
  return c.redirect("/account?msg=msg_profile_saved");
});
app.get("/api/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return bearerUnauthorized(c);
  const token = authHeader.split(" ")[1];
  const session = await c.env.DB.prepare("SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!session) return bearerUnauthorized(c, "invalid_token", "the access token is invalid or expired");
  const user = await c.env.DB.prepare("SELECT id, email, group_id, created_at FROM users WHERE id = ?").bind(session.user_id).first();
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});
app.post("/api/token", async (c) => {
  const body = await c.req.json().catch(() => {
  });
  const code = body["code"];
  if (!code) return c.json({ error: "Missing code" }, 400);
  const authCode = await c.env.DB.prepare("SELECT * FROM auth_codes WHERE code = ?").bind(code).first();
  if (!authCode || authCode.expires_at < Date.now() / 1e3 || authCode.used_at) return c.json({ error: "Invalid code" }, 400);
  await c.env.DB.prepare("UPDATE auth_codes SET used_at = ? WHERE code = ?").bind(Date.now() / 1e3, code).run();
  const token = generateToken();
  const refreshToken = generateToken();
  const expiresAt = Math.floor(Date.now() / 1e3) + 3600;
  await c.env.DB.prepare("INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)").bind(token, refreshToken, authCode.user_id, authCode.app_id, expiresAt).run();
  return c.json({ access_token: token, refresh_token: refreshToken, expires_in: 3600 });
});
app.post("/api/refresh", async (c) => {
  const body = await c.req.json().catch(() => {
  });
  const refreshToken = body["refresh_token"];
  if (!refreshToken) return c.json({ error: "Missing refresh_token" }, 400);
  const session = await c.env.DB.prepare("SELECT * FROM app_sessions WHERE refresh_token = ?").bind(refreshToken).first();
  if (!session) return c.json({ error: "Invalid refresh token" }, 400);
  const check = await checkPermission(c, session.user_id, session.app_id);
  if (!check.allowed) {
    await c.env.DB.prepare("DELETE FROM app_sessions WHERE refresh_token = ?").bind(refreshToken).run();
    return c.json({ error: "Access Denied", details: check.reason }, 403);
  }
  const newToken = generateToken();
  const newRefreshToken = generateToken();
  const newExpiresAt = Math.floor(Date.now() / 1e3) + 3600;
  await c.env.DB.prepare("UPDATE app_sessions SET token=?, refresh_token=?, expires_at=? WHERE refresh_token=?").bind(newToken, newRefreshToken, newExpiresAt, refreshToken).run();
  return c.json({ access_token: newToken, refresh_token: newRefreshToken, expires_in: 3600 });
});
function isSafeReturnTo(v) {
  return typeof v === "string" && v.startsWith("/authorize");
}
__name(isSafeReturnTo, "isSafeReturnTo");
function buildRedirect(redirectUri, mode, params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") usp.set(k, v);
  const sep = mode === "fragment" ? "#" : redirectUri.includes("?") ? "&" : "?";
  return redirectUri + sep + usp.toString();
}
__name(buildRedirect, "buildRedirect");
function tokenError(c, error, description, status = 400) {
  return c.json({ error, error_description: description }, status);
}
__name(tokenError, "tokenError");
function bearerUnauthorized(c, error, description) {
  let challenge = 'Bearer realm="tobira"';
  if (error) {
    challenge += `, error="${error}"`;
    if (description) challenge += `, error_description="${description}"`;
  }
  c.header("WWW-Authenticate", challenge);
  return c.json({ error: error || "invalid_request", error_description: description }, 401);
}
__name(bearerUnauthorized, "bearerUnauthorized");
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
__name(safeEqual, "safeEqual");
async function authenticateClient(c, appId, providedSecret, usedPkce) {
  const app2 = await c.env.DB.prepare("SELECT client_secret FROM apps WHERE id = ?").bind(appId).first();
  const registered = app2?.client_secret;
  if (registered) {
    if (!providedSecret || !safeEqual(providedSecret, registered)) {
      return { ok: false, res: tokenError(c, "invalid_client", "client authentication failed", 401) };
    }
  } else if (!usedPkce) {
    return { ok: false, res: tokenError(c, "invalid_client", "client authentication required: use PKCE or a registered client_secret") };
  }
  return { ok: true };
}
__name(authenticateClient, "authenticateClient");
function parseBasicAuth(c) {
  const authz = c.req.header("Authorization");
  if (!authz || !authz.startsWith("Basic ")) return {};
  try {
    const dec = atob(authz.slice(6));
    const i = dec.indexOf(":");
    return { clientId: decodeURIComponent(dec.slice(0, i)), secret: decodeURIComponent(dec.slice(i + 1)) };
  } catch {
    return {};
  }
}
__name(parseBasicAuth, "parseBasicAuth");
async function parseClientBody(c) {
  const ct = c.req.header("Content-Type") || "";
  if (ct.includes("application/json")) return await c.req.json().catch(() => ({}));
  const body = await c.req.parseBody();
  const out = {};
  for (const [k, v] of Object.entries(body)) if (typeof v === "string") out[k] = v;
  return out;
}
__name(parseClientBody, "parseClientBody");
function buildOidcClaims(user, scope) {
  const scopes = (scope || "").split(/\s+/).filter(Boolean);
  const claims = {};
  if (scopes.includes("profile")) {
    claims.name = user.name || user.email;
    claims.preferred_username = user.preferred_username || user.email;
    if (user.picture) claims.picture = user.picture;
    claims.updated_at = user.updated_at;
  }
  if (scopes.includes("email")) {
    claims.email = user.email;
    claims.email_verified = true;
  }
  return claims;
}
__name(buildOidcClaims, "buildOidcClaims");
async function computeAtHash(accessToken) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken)));
  const half = digest.slice(0, 16);
  let bin = "";
  for (let i = 0; i < half.length; i++) bin += String.fromCharCode(half[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(computeAtHash, "computeAtHash");
async function issueOidcTokens(c, user, clientId, nonce, scope, authTime) {
  const now = Math.floor(Date.now() / 1e3);
  const expiresIn = 3600;
  const grantedScope = scope || "openid";
  const offlineAccess = grantedScope.split(/\s+/).includes("offline_access");
  const effectiveAuthTime = authTime ?? now;
  const accessToken = generateToken();
  const refreshToken = generateToken();
  await c.env.DB.prepare("INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(accessToken, refreshToken, user.id, clientId, now + expiresIn, grantedScope, effectiveAuthTime).run();
  const issuer = new URL(c.req.url).origin;
  const atHash = await computeAtHash(accessToken);
  const idToken = await signRS256({
    iss: issuer,
    sub: user.id,
    aud: clientId,
    iat: now,
    exp: now + expiresIn,
    auth_time: effectiveAuthTime,
    at_hash: atHash,
    ...nonce ? { nonce } : {},
    ...buildOidcClaims(user, grantedScope)
  }, c.env.DB, c.env.OIDC_KEK);
  return c.json({
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    ...offlineAccess ? { refresh_token: refreshToken } : {},
    scope: grantedScope
  });
}
__name(issueOidcTokens, "issueOidcTokens");
app.get("/.well-known/openid-configuration", (c) => {
  const issuer = new URL(c.req.url).origin;
  return c.json({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    end_session_endpoint: `${issuer}/oidc/logout`,
    // OIDC Back-Channel Logout 1.0: 各 RP の登録エンドポイントへ logout_token を
    // POST する。subject ベース(sid なし)なので session_supported=false。
    backchannel_logout_supported: true,
    backchannel_logout_session_supported: false,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    revocation_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
    introspection_endpoint: `${issuer}/oauth/introspect`,
    introspection_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
    // RFC 7591 動的クライアント登録(保護付き: Initial Access Token が必要)。
    registration_endpoint: `${issuer}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
    code_challenge_methods_supported: ["S256"],
    claims_supported: ["sub", "email", "email_verified", "name", "preferred_username", "iss", "aud", "exp", "iat", "nonce", "auth_time", "at_hash"]
  });
});
app.get("/.well-known/jwks.json", async (c) => {
  const keys = await getJwksKeys(c.env.DB, c.env.OIDC_KEK);
  return c.json({ keys: keys.map((k) => ({ ...k, alg: "RS256", use: "sig" })) });
});
app.get("/authorize", async (c) => {
  const q = c.req.query();
  const { client_id: clientId, redirect_uri: redirectUri, state, nonce, response_mode: responseMode } = q;
  const responseType = q.response_type;
  const scope = q.scope || "openid";
  if (!clientId || !redirectUri) return c.text("invalid_request: client_id and redirect_uri are required", 400);
  const app2 = await c.env.DB.prepare("SELECT * FROM apps WHERE id = ?").bind(clientId).first();
  if (!app2) return c.text("invalid_client: unknown client_id", 400);
  if (!isAllowedRedirectUri(redirectUri, app2)) return c.text("invalid_request: redirect_uri is not registered for this client", 400);
  if (responseType && responseType !== "code") {
    return c.redirect(buildRedirect(redirectUri, responseMode, { error: "unsupported_response_type", error_description: "only response_type=code is supported", state }));
  }
  if (q.code_challenge && q.code_challenge_method !== "S256") {
    return c.redirect(buildRedirect(redirectUri, responseMode, {
      error: "invalid_request",
      error_description: "code_challenge_method must be S256 (plain is not supported)",
      state
    }));
  }
  const now = Math.floor(Date.now() / 1e3);
  const promptValues = (q.prompt || "").split(/\s+/).filter(Boolean);
  const promptNone = promptValues.includes("none");
  const forceLogin = promptValues.includes("login") || promptValues.includes("select_account");
  const maxAge = /^\d+$/.test(q.max_age || "") ? parseInt(q.max_age, 10) : null;
  const session = await getSessionRow(c);
  const user = session ? await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first() : null;
  const maxAgeExceeded = !!(user && maxAge !== null && now - (session?.auth_time ?? 0) > maxAge);
  const needReauth = !user || forceLogin || maxAgeExceeded;
  if (needReauth) {
    if (promptNone) {
      return c.redirect(buildRedirect(redirectUri, responseMode, {
        error: "login_required",
        error_description: user ? "re-authentication required but prompt=none" : "no active session and prompt=none",
        state
      }));
    }
    const resume = new URL(c.req.url);
    resume.searchParams.delete("prompt");
    const returnTo = "/authorize" + resume.search;
    const hint = q.login_hint ? "&login_hint=" + encodeURIComponent(q.login_hint) : "";
    return c.redirect("/login?reauth=1" + hint + "&return_to=" + encodeURIComponent(returnTo));
  }
  const check = await checkPermission(c, user.id, app2.id);
  if (!check.allowed) {
    return c.redirect(buildRedirect(redirectUri, responseMode, { error: "access_denied", error_description: check.reason || "access denied", state }));
  }
  const code = generateToken();
  const expires = Math.floor(Date.now() / 1e3) + 300;
  await c.env.DB.prepare(
    "INSERT INTO auth_codes (code, user_id, app_id, expires_at, nonce, code_challenge, code_challenge_method, redirect_uri, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(code, user.id, app2.id, expires, nonce || null, q.code_challenge || null, q.code_challenge_method || null, redirectUri, scope, session?.auth_time ?? null).run();
  return c.redirect(buildRedirect(redirectUri, responseMode, { code, state }));
});
app.post("/oauth/token", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");
  const body = await parseClientBody(c);
  let basicClientId;
  let basicClientSecret;
  const authz = c.req.header("Authorization");
  if (authz && authz.startsWith("Basic ")) {
    try {
      const dec = atob(authz.slice(6));
      const i = dec.indexOf(":");
      basicClientId = decodeURIComponent(dec.slice(0, i));
      basicClientSecret = decodeURIComponent(dec.slice(i + 1));
    } catch {
    }
  }
  const providedSecret = body.client_secret || basicClientSecret;
  const grantType = body.grant_type;
  if (grantType === "authorization_code") {
    const code = body.code;
    if (!code) return tokenError(c, "invalid_request", "missing code");
    const ac = await c.env.DB.prepare("SELECT * FROM auth_codes WHERE code = ?").bind(code).first();
    const nowSec = Math.floor(Date.now() / 1e3);
    if (!ac || ac.used_at || ac.expires_at < nowSec) return tokenError(c, "invalid_grant", "authorization code is invalid or expired");
    await c.env.DB.prepare("UPDATE auth_codes SET used_at = ? WHERE code = ?").bind(nowSec, code).run();
    const clientId = body.client_id || basicClientId;
    if (clientId && clientId !== ac.app_id) return tokenError(c, "invalid_grant", "client_id does not match the authorization code");
    if (ac.redirect_uri) {
      if (!body.redirect_uri) return tokenError(c, "invalid_grant", "redirect_uri is required");
      if (body.redirect_uri !== ac.redirect_uri) return tokenError(c, "invalid_grant", "redirect_uri does not match");
    }
    const pkceOk = await verifyPkce(body.code_verifier, ac.code_challenge, ac.code_challenge_method);
    if (!pkceOk) return tokenError(c, "invalid_grant", "PKCE verification failed");
    const auth = await authenticateClient(c, ac.app_id, providedSecret, !!ac.code_challenge);
    if (!auth.ok) return auth.res;
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(ac.user_id).first();
    if (!user) return tokenError(c, "invalid_grant", "user not found");
    return issueOidcTokens(c, user, ac.app_id, ac.nonce || null, ac.scope || null, ac.auth_time ?? null);
  }
  if (grantType === "refresh_token") {
    const refreshToken = body.refresh_token;
    if (!refreshToken) return tokenError(c, "invalid_request", "missing refresh_token");
    const session = await c.env.DB.prepare("SELECT * FROM app_sessions WHERE refresh_token = ?").bind(refreshToken).first();
    if (!session) return tokenError(c, "invalid_grant", "invalid refresh_token");
    const auth = await authenticateClient(c, session.app_id, providedSecret, true);
    if (!auth.ok) return auth.res;
    const check = await checkPermission(c, session.user_id, session.app_id);
    if (!check.allowed) {
      await c.env.DB.prepare("DELETE FROM app_sessions WHERE refresh_token = ?").bind(refreshToken).run();
      return tokenError(c, "invalid_grant", check.reason || "access denied");
    }
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first();
    if (!user) return tokenError(c, "invalid_grant", "user not found");
    await c.env.DB.prepare("DELETE FROM app_sessions WHERE refresh_token = ?").bind(refreshToken).run();
    return issueOidcTokens(c, user, session.app_id, null, session.scope || null, session.auth_time ?? null);
  }
  return tokenError(c, "unsupported_grant_type", grantType ? `grant_type '${grantType}' is not supported` : "missing grant_type");
});
app.on(["GET", "POST"], "/userinfo", async (c) => {
  const auth = c.req.header("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return bearerUnauthorized(c);
  const token = auth.slice(7);
  const session = await c.env.DB.prepare("SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!session) return bearerUnauthorized(c, "invalid_token", "the access token is invalid or expired");
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first();
  if (!user) return bearerUnauthorized(c, "invalid_token", "the access token is invalid or expired");
  return c.json({
    sub: user.id,
    ...buildOidcClaims(user, session.scope || null)
  });
});
async function backchannelLogoutToken(c, issuer, clientId, userId) {
  return signRS256({
    iss: issuer,
    aud: clientId,
    sub: userId,
    iat: Math.floor(Date.now() / 1e3),
    jti: generateToken(),
    events: { "http://schemas.openid.net/event/backchannel-logout": {} }
  }, c.env.DB, c.env.OIDC_KEK, "logout+jwt");
}
__name(backchannelLogoutToken, "backchannelLogoutToken");
async function sendBackchannelLogouts(c, issuer, userId) {
  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT a.id AS app_id, a.backchannel_logout_uri AS uri
           FROM app_sessions s JOIN apps a ON a.id = s.app_id
          WHERE s.user_id = ? AND a.backchannel_logout_uri IS NOT NULL AND a.backchannel_logout_uri != ''`
  ).bind(userId).all();
  const targets = results || [];
  if (targets.length === 0) return;
  await Promise.allSettled(targets.map(async (t) => {
    const logoutToken = await backchannelLogoutToken(c, issuer, t.app_id, userId);
    const bindingName = "RP_" + String(t.app_id).toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const fetcher = c.env[bindingName]?.fetch ? c.env[bindingName] : { fetch };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4e3);
    try {
      await fetcher.fetch(t.uri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ logout_token: logoutToken }).toString(),
        signal: ctrl.signal
      });
    } catch {
    } finally {
      clearTimeout(timer);
    }
  }));
}
__name(sendBackchannelLogouts, "sendBackchannelLogouts");
app.on(["GET", "POST"], "/oidc/logout", async (c) => {
  const q = c.req.query();
  let p = { ...q };
  if (c.req.method === "POST") {
    try {
      const body = await c.req.parseBody();
      for (const [k, v] of Object.entries(body)) if (typeof v === "string") p[k] = v;
    } catch {
    }
  }
  const idTokenHint = p.id_token_hint;
  const state = p.state;
  const dest = p.post_logout_redirect_uri || p.returnTo;
  const sessionId = getCookie(c, "__Host-idp_session");
  let userId = null;
  if (sessionId) {
    const session = await c.env.DB.prepare("SELECT user_id FROM sessions WHERE id = ?").bind(sessionId).first();
    if (session) userId = session.user_id;
  }
  let hintAud = null;
  if (idTokenHint) {
    const payload = await verifyRS256(idTokenHint, c.env.DB, c.env.OIDC_KEK);
    if (payload) {
      hintAud = typeof payload.aud === "string" ? payload.aud : Array.isArray(payload.aud) ? String(payload.aud[0]) : null;
      if (!userId && typeof payload.sub === "string") userId = payload.sub;
    }
  }
  if (userId) {
    try {
      await sendBackchannelLogouts(c, new URL(c.req.url).origin, userId);
    } catch (e) {
    }
  }
  if (userId) {
    try {
      await c.env.DB.prepare("DELETE FROM app_sessions WHERE user_id = ?").bind(userId).run();
    } catch (e) {
    }
  }
  if (sessionId) {
    try {
      await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    } catch (e) {
    }
  }
  setCookie(c, "__Host-idp_session", "", { path: "/", secure: true, httpOnly: true, expires: /* @__PURE__ */ new Date(0) });
  if (dest) {
    const { results } = await c.env.DB.prepare("SELECT id, base_url, redirect_uris FROM apps WHERE status = ?").bind("active").all();
    const matching = results.filter((a) => isAllowedRedirectUri(dest, a));
    const allowed = hintAud ? matching.some((a) => a.id === hintAud) : matching.length > 0;
    if (allowed) {
      const target = state ? dest + (dest.includes("?") ? "&" : "?") + "state=" + encodeURIComponent(state) : dest;
      return c.redirect(target);
    }
  }
  return c.redirect("/login");
});
app.post("/oauth/revoke", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");
  const body = await parseClientBody(c);
  const basic = parseBasicAuth(c);
  const providedSecret = body.client_secret || basic.secret;
  const token = body.token;
  if (!token) return tokenError(c, "invalid_request", "missing token");
  const hint = body.token_type_hint;
  const byRefresh = c.env.DB.prepare("SELECT * FROM app_sessions WHERE refresh_token = ?").bind(token);
  const byAccess = c.env.DB.prepare("SELECT * FROM app_sessions WHERE token = ?").bind(token);
  let session = await (hint === "access_token" ? byAccess : byRefresh).first();
  if (!session) session = await (hint === "access_token" ? byRefresh : byAccess).first();
  if (session) {
    const auth = await authenticateClient(c, session.app_id, providedSecret, true);
    if (!auth.ok) return auth.res;
    const clientId = body.client_id || basic.clientId;
    if (!clientId || clientId === session.app_id) {
      await c.env.DB.prepare("DELETE FROM app_sessions WHERE id = ?").bind(session.id).run();
    }
  }
  return c.body(null, 200);
});
app.post("/oauth/introspect", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");
  const body = await parseClientBody(c);
  const basic = parseBasicAuth(c);
  const providedSecret = body.client_secret || basic.secret;
  const callerId = body.client_id || basic.clientId;
  const token = body.token;
  if (!token) return tokenError(c, "invalid_request", "missing token");
  if (!callerId) return tokenError(c, "invalid_client", "client authentication required", 401);
  const auth = await authenticateClient(c, callerId, providedSecret, true);
  if (!auth.ok) return auth.res;
  const hint = body.token_type_hint;
  const inactive = /* @__PURE__ */ __name(() => c.json({ active: false }), "inactive");
  const byRefresh = c.env.DB.prepare("SELECT * FROM app_sessions WHERE refresh_token = ?").bind(token);
  const byAccess = c.env.DB.prepare("SELECT * FROM app_sessions WHERE token = ?").bind(token);
  let session = await (hint === "refresh_token" ? byRefresh : byAccess).first();
  let matchedAccess = !!session && session.token === token;
  if (!session) {
    session = await (hint === "refresh_token" ? byAccess : byRefresh).first();
    matchedAccess = !!session && session.token === token;
  }
  if (!session || session.app_id !== callerId) return inactive();
  const now = Math.floor(Date.now() / 1e3);
  if (matchedAccess && session.expires_at <= now) return inactive();
  return c.json({
    active: true,
    scope: session.scope || void 0,
    client_id: session.app_id,
    sub: session.user_id,
    token_type: matchedAccess ? "Bearer" : "refresh_token",
    ...matchedAccess ? { exp: session.expires_at } : {},
    ...session.auth_time != null ? { auth_time: session.auth_time } : {}
  });
});
app.post("/register", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");
  const regError = /* @__PURE__ */ __name((code, desc) => c.json({ error: code, error_description: desc }, 400), "regError");
  const unauthorized = /* @__PURE__ */ __name((desc) => c.json({ error: "invalid_token", error_description: desc }, 401, { "WWW-Authenticate": 'Bearer error="invalid_token"' }), "unauthorized");
  const authz = c.req.header("Authorization") || "";
  const iat = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!iat) return unauthorized("an Initial Access Token is required (Authorization: Bearer ...)");
  const nowSec = Math.floor(Date.now() / 1e3);
  const tokenRow = await c.env.DB.prepare("SELECT * FROM registration_tokens WHERE token = ?").bind(iat).first();
  if (!tokenRow || tokenRow.expires_at && tokenRow.expires_at < nowSec) {
    return unauthorized("the Initial Access Token is invalid or expired");
  }
  let meta2;
  try {
    meta2 = await c.req.json();
  } catch {
    return regError("invalid_client_metadata", "request body must be a JSON object");
  }
  if (!meta2 || typeof meta2 !== "object") return regError("invalid_client_metadata", "request body must be a JSON object");
  const requestedGrants = Array.isArray(meta2.grant_types) && meta2.grant_types.length ? meta2.grant_types : ["authorization_code"];
  const supportedGrants = ["authorization_code", "refresh_token"];
  for (const g of requestedGrants) if (!supportedGrants.includes(g)) return regError("invalid_client_metadata", "unsupported grant_type: " + g);
  const needsRedirect = requestedGrants.includes("authorization_code");
  const redirectUris = Array.isArray(meta2.redirect_uris) ? meta2.redirect_uris.filter((u) => typeof u === "string") : [];
  if (needsRedirect && redirectUris.length === 0) return regError("invalid_redirect_uri", "redirect_uris is required for the authorization_code grant");
  for (const u of redirectUris) {
    let parsed;
    try {
      parsed = new URL(u);
    } catch {
      return regError("invalid_redirect_uri", "not a valid absolute URI: " + u);
    }
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocal)) return regError("invalid_redirect_uri", "must be https (http allowed only for localhost): " + u);
    if (parsed.hash) return regError("invalid_redirect_uri", "must not contain a fragment: " + u);
  }
  const authMethod = typeof meta2.token_endpoint_auth_method === "string" ? meta2.token_endpoint_auth_method : "client_secret_basic";
  if (!["none", "client_secret_basic", "client_secret_post"].includes(authMethod)) return regError("invalid_client_metadata", "unsupported token_endpoint_auth_method: " + authMethod);
  const isPublic = authMethod === "none";
  const clientId = "dcr-" + generateToken();
  const clientSecret = isPublic ? null : generateToken() + generateToken().replace(/-/g, "");
  const clientName = typeof meta2.client_name === "string" && meta2.client_name.trim() ? meta2.client_name.trim() : clientId;
  let baseUrl = "";
  if (typeof meta2.client_uri === "string") {
    try {
      baseUrl = new URL(meta2.client_uri).origin;
    } catch {
    }
  }
  if (!baseUrl && redirectUris.length) {
    try {
      baseUrl = new URL(redirectUris[0]).origin;
    } catch {
    }
  }
  if (!baseUrl) baseUrl = "https://example.invalid";
  const backchannel = typeof meta2.backchannel_logout_uri === "string" && meta2.backchannel_logout_uri.trim() ? meta2.backchannel_logout_uri.trim() : null;
  const iconUrl = typeof meta2.logo_uri === "string" ? meta2.logo_uri : null;
  await c.env.DB.prepare("INSERT INTO apps (id, name, base_url, status, created_at, icon_url, client_secret, redirect_uris, backchannel_logout_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(clientId, clientName, baseUrl, "active", nowSec, iconUrl, clientSecret, redirectUris.join("\n"), backchannel).run();
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_REGISTERED", JSON.stringify({ key: "log_app_created", params: { appName: clientName, id: clientId, admin: "dynamic-registration (" + (tokenRow.created_by || "iat") + ")" } })).run();
  const resp = {
    client_id: clientId,
    client_id_issued_at: nowSec,
    redirect_uris: redirectUris,
    grant_types: requestedGrants,
    response_types: needsRedirect ? ["code"] : [],
    token_endpoint_auth_method: authMethod,
    client_name: clientName
  };
  if (clientSecret) {
    resp.client_secret = clientSecret;
    resp.client_secret_expires_at = 0;
  }
  if (backchannel) resp.backchannel_logout_uri = backchannel;
  if (typeof meta2.scope === "string") resp.scope = meta2.scope;
  return c.json(resp, 201);
});
app.get("/admin", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const t = getLang(c);
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const stats = {
    apps: await c.env.DB.prepare("SELECT COUNT(*) as c FROM apps").first("c"),
    users: await c.env.DB.prepare("SELECT COUNT(*) as c FROM users").first("c"),
    logs: await c.env.DB.prepare("SELECT COUNT(*) as c FROM audit_logs").first("c")
  };
  return c.html(/* @__PURE__ */ jsxDEV(AdminHome, { t, userEmail: user.email, stats, siteName, appConfig: config2 }));
});
app.get("/admin/apps", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const { results } = await c.env.DB.prepare("SELECT * FROM apps ORDER BY created_at DESC").all();
  const regTokens = await c.env.DB.prepare("SELECT token, created_at, expires_at FROM registration_tokens ORDER BY created_at DESC").all();
  return c.html(/* @__PURE__ */ jsxDEV(AppsPage, { t: getLang(c), userEmail: user.email, apps: results, regTokens: regTokens.results, siteName, appConfig: config2 }));
});
app.post("/admin/registration-tokens", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const days = parseInt(body["days"] || "0", 10);
  const now = Math.floor(Date.now() / 1e3);
  const expiresAt = Number.isFinite(days) && days > 0 ? now + days * 86400 : null;
  const token = "iat-" + generateToken() + generateToken().replace(/-/g, "");
  await c.env.DB.prepare("INSERT INTO registration_tokens (token, created_by, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(token, user.email, now, expiresAt).run();
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("REG_TOKEN_CREATED", JSON.stringify({ key: "log_app_updated", params: { appName: "registration token", status: "created", admin: user.email } })).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/registration-tokens/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  await c.env.DB.prepare("DELETE FROM registration_tokens WHERE token = ?").bind(body["token"]).run();
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("REG_TOKEN_REVOKED", JSON.stringify({ key: "log_app_updated", params: { appName: "registration token", status: "revoked", admin: user.email } })).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/apps", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const now = Math.floor(Date.now() / 1e3);
  const iconData = await handleIconUpload(body);
  const iconUrl = iconData || body["icon_url"] || await fetchAppIcon(body["base_url"]);
  const clientSecret = generateToken() + generateToken().replace(/-/g, "");
  const redirectUris = (body["redirect_uris"] || "").trim() || null;
  const backchannelLogoutUri = (body["backchannel_logout_uri"] || "").trim() || null;
  await c.env.DB.prepare("INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url, client_secret, redirect_uris, backchannel_logout_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(body["id"], body["name"], body["base_url"], "active", now, body["description"], iconUrl, clientSecret, redirectUris, backchannelLogoutUri).run();
  const details = JSON.stringify({ key: "log_app_created", params: { appName: body["name"], id: body["id"], admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_CREATED", details).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/apps/secret", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  const action = body["action"];
  const secret = action === "clear" ? null : generateToken() + generateToken().replace(/-/g, "");
  await c.env.DB.prepare("UPDATE apps SET client_secret = ? WHERE id = ?").bind(secret, id).run();
  const details = JSON.stringify({ key: "log_app_updated", params: { appName: id, status: action === "clear" ? "secret cleared" : "secret regenerated", admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_UPDATED", details).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/apps/update", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  const iconData = await handleIconUpload(body);
  const iconUrl = iconData || body["icon_url"] || await fetchAppIcon(body["base_url"]);
  const redirectUris = (body["redirect_uris"] || "").trim() || null;
  const backchannelLogoutUri = (body["backchannel_logout_uri"] || "").trim() || null;
  await c.env.DB.prepare("UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ?, redirect_uris = ?, backchannel_logout_uri = ? WHERE id = ?").bind(body["name"], body["base_url"], body["description"], iconUrl, redirectUris, backchannelLogoutUri, id).run();
  const details = JSON.stringify({ key: "log_app_updated", params: { appName: body["name"], status: "Updated", admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_UPDATED", details).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/apps/toggle", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  const status = body["status"];
  await c.env.DB.prepare("UPDATE apps SET status = ? WHERE id = ?").bind(status, id).run();
  const details = JSON.stringify({ key: "log_app_updated", params: { appName: id, status, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_UPDATED", details).run();
  return c.redirect("/admin/apps");
});
app.post("/admin/apps/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM permissions WHERE app_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM group_permissions WHERE app_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM auth_codes WHERE app_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM app_sessions WHERE app_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM apps WHERE id = ?").bind(id)
  ]);
  const details = JSON.stringify({ key: "log_app_deleted", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("APP_DELETED", details).run();
  return c.redirect("/admin/apps");
});
app.get("/admin/groups", async (c) => {
  try {
    const user = await getAdmin(c);
    if (!user) return c.redirect("/login");
    const config2 = await getSystemConfig(c.env.DB);
    const siteName = getLocalizedValue(c, config2.appName);
    const groups = await c.env.DB.prepare("SELECT * FROM groups ORDER BY created_at DESC").all();
    const apps = await c.env.DB.prepare("SELECT * FROM apps").all();
    if (!groups.success) throw new Error("Groups DB Error: " + groups.error);
    if (!apps.success) throw new Error("Apps DB Error: " + apps.error);
    return c.html(/* @__PURE__ */ jsxDEV(GroupsPage, { t: getLang(c), userEmail: user.email, groups: groups.results, apps: apps.results, siteName, appConfig: config2 }));
  } catch (e) {
    return c.text("Error: " + e.message + "\n" + e.stack, 500);
  }
});
app.post("/admin/groups", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1e3);
  await c.env.DB.prepare("INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)").bind(id, body["name"], now).run();
  return c.redirect("/admin/groups");
});
app.post("/admin/groups/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM group_permissions WHERE group_id = ?").bind(id),
    c.env.DB.prepare("UPDATE users SET group_id = NULL WHERE group_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM groups WHERE id = ?").bind(id)
  ]);
  const details = JSON.stringify({ key: "log_group_deleted", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("GROUP_DELETED", details).run();
  return c.redirect("/admin/groups");
});
app.get("/admin/users", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const users = await c.env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  const apps = await c.env.DB.prepare("SELECT * FROM apps").all();
  const groups = await c.env.DB.prepare("SELECT * FROM groups").all();
  return c.html(/* @__PURE__ */ jsxDEV(UsersPage, { t: getLang(c), userEmail: user.email, users: users.results, apps: apps.results, groups: groups.results, inviteUrl: c.req.query("invite_url"), error: c.req.query("error"), siteName, appConfig: config2 }));
});
app.post("/admin/invite", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const email = body["email"];
  if (!email) return c.redirect("/admin/users?error=Email required");
  const token = generateToken();
  const expiresAt = Math.floor(Date.now() / 1e3) + 86400 * 30;
  try {
    await c.env.DB.prepare("INSERT INTO invitations (id, email, invited_by, expires_at) VALUES (?, ?, ?, ?)").bind(token, email, user.id, expiresAt).run();
  } catch (e) {
    return c.redirect(`/admin/users?error=${encodeURIComponent("Error: " + e.message)}`);
  }
  const url = new URL(c.req.url);
  return c.redirect(`/admin/users?invite_url=${encodeURIComponent(url.protocol + "//" + url.host + "/invite?token=" + token)}`);
});
app.post("/admin/users/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM permissions WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM app_sessions WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM auth_codes WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM invitations WHERE invited_by = ?").bind(id),
    c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id)
  ]);
  const details = JSON.stringify({ key: "log_user_deleted", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("USER_DELETED", details).run();
  return c.redirect("/admin/users");
});
app.post("/admin/users/bulk", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const text = await c.req.text();
  const params = new URLSearchParams(text);
  const ids = params.getAll("user_ids");
  const groupId = params.get("group_id");
  const appId = params.get("app_id");
  if (!ids || ids.length === 0) return c.redirect("/admin/users");
  let gName = null;
  if (groupId) {
    const val = groupId === "__CLEAR__" || groupId === "" ? null : groupId;
    for (const uid of ids) {
      await c.env.DB.prepare("UPDATE users SET group_id = ? WHERE id = ?").bind(val, uid).run();
    }
    if (val) {
      const g = await c.env.DB.prepare("SELECT name FROM groups WHERE id = ?").bind(val).first();
      gName = g ? g.name : val;
    } else {
      gName = "None";
    }
  }
  let aName = null;
  if (appId) {
    const start = Math.floor(Date.now() / 1e3);
    const end = start + 31536e3;
    const now = Math.floor(Date.now() / 1e3);
    for (const uid of ids) {
      await c.env.DB.prepare(`
                INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
            `).bind(uid, appId, start, end, now, start, end).run();
    }
    const a = await c.env.DB.prepare("SELECT name FROM apps WHERE id = ?").bind(appId).first();
    aName = a ? a.name : appId;
  }
  const details = JSON.stringify({
    key: "log_bulk_update",
    params: { count: ids.length, admin: user.email, group: gName || "-", app: aName || "-" }
  });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("USER_UPDATE", details).run();
  return c.redirect("/admin/users");
});
app.get("/admin/api/user-details/:id", async (c) => {
  if (!await getAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const userId = c.req.param("id");
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user) return c.json({ error: "Not found" }, 404);
  const { results: direct } = await c.env.DB.prepare("SELECT p.*, a.name as app_name FROM permissions p JOIN apps a ON p.app_id = a.id WHERE p.user_id = ?").bind(userId).all();
  let groupPerms = [];
  if (user.group_id) {
    const res = await c.env.DB.prepare("SELECT p.*, a.name as app_name FROM group_permissions p JOIN apps a ON p.app_id = a.id WHERE p.group_id = ?").bind(user.group_id).all();
    groupPerms = res.results;
  }
  const allApps = await c.env.DB.prepare("SELECT id, name FROM apps").all();
  const combined = allApps.results.map((app2) => {
    const d = direct.find((x) => x.app_id === app2.id);
    const g = groupPerms.find((x) => x.app_id === app2.id);
    if (d) return { ...d, source: "user", is_override: true };
    if (g) return { ...g, source: "group", is_override: false };
    return null;
  }).filter((x) => x);
  return c.json({ email: user.email, permissions: combined, group_id: user.group_id });
});
app.post("/admin/api/user/group", async (c) => {
  try {
    const user = await getAdmin(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const userId = body["user_id"];
    const groupId = body["group_id"] || null;
    await c.env.DB.prepare("UPDATE users SET group_id = ? WHERE id = ?").bind(groupId || null, userId).run();
    let gName = "None";
    if (groupId) {
      const g = await c.env.DB.prepare("SELECT name FROM groups WHERE id = ?").bind(groupId).first();
      if (g) gName = g.name;
    }
    const details = JSON.stringify({ key: "log_user_group_update", params: { user: userId, group: gName, admin: user.email } });
    await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("USER_UPDATE", details).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message, stack: e.stack }, 500);
  }
});
app.post("/admin/api/user/permission/revoke", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = body["id"];
  await c.env.DB.prepare("DELETE FROM permissions WHERE id = ?").bind(id).run();
  const details = JSON.stringify({ key: "log_permission_revoke", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("PERMISSION_REVOKE", details).run();
  return c.json({ success: true });
});
app.post("/admin/api/user/permission/grant", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const userId = body["user_id"];
  const appIds = body["app_ids"];
  const appId = body["app_id"];
  const validTo = body["valid_to"];
  const validFrom = body["valid_from"] || Math.floor(Date.now() / 1e3);
  const targets = Array.isArray(appIds) ? appIds : [appId];
  const appNames = [];
  const now = Math.floor(Date.now() / 1e3);
  for (const aid of targets) {
    if (!aid) continue;
    await c.env.DB.prepare(`
            INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(userId, aid, validFrom, validTo, now, validFrom, validTo).run();
    const a = await c.env.DB.prepare("SELECT name FROM apps WHERE id = ?").bind(aid).first();
    if (a) appNames.push(a.name);
  }
  const details = JSON.stringify({ key: "log_permission_grant", params: { apps: appNames.join(", "), user: userId, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("PERMISSION_GRANT", details).run();
  return c.json({ success: true });
});
app.get("/admin/api/group-details/:id", async (c) => {
  if (!await getAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("id");
  const { results } = await c.env.DB.prepare(`
        SELECT p.*, a.name as app_name 
        FROM group_permissions p 
        JOIN apps a ON p.app_id = a.id 
        WHERE p.group_id = ?
    `).bind(groupId).all();
  return c.json({ permissions: results });
});
app.post("/admin/api/group/permission/grant", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const groupId = body["group_id"];
  const appIds = body["app_ids"];
  const validTo = body["valid_to"];
  const validFrom = body["valid_from"] || Math.floor(Date.now() / 1e3);
  const targets = Array.isArray(appIds) ? appIds : [];
  const appNames = [];
  const now = Math.floor(Date.now() / 1e3);
  for (const aid of targets) {
    if (!aid) continue;
    await c.env.DB.prepare(`
            INSERT INTO group_permissions (group_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(group_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(groupId, aid, validFrom, validTo, now, validFrom, validTo).run();
    const a = await c.env.DB.prepare("SELECT name FROM apps WHERE id = ?").bind(aid).first();
    if (a) appNames.push(a.name);
  }
  const g = await c.env.DB.prepare("SELECT name FROM groups WHERE id = ?").bind(groupId).first();
  const gName = g ? g.name : groupId;
  const details = JSON.stringify({ key: "log_group_permission_grant", params: { apps: appNames.join(", "), group: gName, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("GROUP_PERMISSION_GRANT", details).run();
  return c.json({ success: true });
});
app.post("/admin/api/group/permission/revoke", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = body["id"];
  await c.env.DB.prepare("DELETE FROM group_permissions WHERE id = ?").bind(id).run();
  const details = JSON.stringify({ key: "log_group_permission_revoke", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("GROUP_PERMISSION_REVOKE", details).run();
  return c.json({ success: true });
});
app.get("/admin/am/groups", async (c) => {
  try {
    const user = await getAdmin(c);
    if (!user) return c.redirect("/login");
    const config2 = await getSystemConfig(c.env.DB);
    const siteName = getLocalizedValue(c, config2.appName);
    const groups = await c.env.DB.prepare(`
            SELECT g.*, (SELECT COUNT(*) FROM group_memberships m WHERE m.group_id = g.id) AS member_count
            FROM groups g ORDER BY g.created_at DESC
        `).all();
    const users = await c.env.DB.prepare("SELECT * FROM users ORDER BY email").all();
    if (!groups.success) throw new Error("Groups DB Error: " + groups.error);
    if (!users.success) throw new Error("Users DB Error: " + users.error);
    return c.html(/* @__PURE__ */ jsxDEV(AccountGroupsPage, { t: getLang(c), userEmail: user.email, groups: groups.results, users: users.results, siteName, appConfig: config2 }));
  } catch (e) {
    return c.text("Error: " + e.message + "\n" + e.stack, 500);
  }
});
app.post("/admin/am/groups", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body["name"] || "").trim();
  if (!name) return c.redirect("/admin/am/groups");
  const parentId = body["parent_id"] || null;
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1e3);
  await c.env.DB.prepare("INSERT INTO groups (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)").bind(id, name, parentId, now).run();
  return c.redirect("/admin/am/groups");
});
app.post("/admin/am/groups/parent", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = body["id"];
  let parentId = body["parent_id"] || null;
  if (parentId === "") parentId = null;
  if (parentId && parentId === id) return c.json({ error: "self" }, 400);
  if (parentId) {
    const { results } = await c.env.DB.prepare("SELECT id, parent_id FROM groups").all();
    const parentOf = new Map(results.map((r) => [r.id, r.parent_id]));
    let cur = parentId;
    let guard = 0;
    while (cur && guard++ < 1e4) {
      if (cur === id) return c.json({ error: "cycle" }, 400);
      cur = parentOf.get(cur) ?? null;
    }
  }
  await c.env.DB.prepare("UPDATE groups SET parent_id = ? WHERE id = ?").bind(parentId, id).run();
  return c.json({ success: true });
});
app.post("/admin/am/groups/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const id = body["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM group_memberships WHERE group_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM group_permissions WHERE group_id = ?").bind(id),
    c.env.DB.prepare("UPDATE users SET group_id = NULL WHERE group_id = ?").bind(id),
    c.env.DB.prepare("UPDATE groups SET parent_id = NULL WHERE parent_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM groups WHERE id = ?").bind(id)
  ]);
  const details = JSON.stringify({ key: "log_group_deleted", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("GROUP_DELETED", details).run();
  return c.redirect("/admin/am/groups");
});
app.get("/admin/api/am/group-members/:id", async (c) => {
  if (!await getAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("id");
  const { results } = await c.env.DB.prepare(`
        SELECT m.id, m.user_id, m.role, m.valid_from, m.valid_to, u.email, u.name
        FROM group_memberships m JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ? ORDER BY (m.role = 'group_admin') DESC, u.email
    `).bind(groupId).all();
  return c.json({ members: results });
});
app.post("/admin/api/am/membership/add", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const groupId = body["group_id"];
  const userIds = body["user_ids"] || [];
  const role = body["role"] === "group_admin" ? "group_admin" : "member";
  const validFrom = Number(body["valid_from"]);
  const validTo = Number(body["valid_to"]);
  if (!groupId || userIds.length === 0) return c.json({ error: "group_id and user_ids required" }, 400);
  for (const uid of userIds) {
    await c.env.DB.prepare(`
            INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, group_id) DO UPDATE SET role=excluded.role, valid_from=excluded.valid_from, valid_to=excluded.valid_to
        `).bind(uid, groupId, role, validFrom, validTo).run();
  }
  const details = JSON.stringify({ key: "log_membership_add", params: { count: userIds.length, group: groupId, role, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("MEMBERSHIP_ADD", details).run();
  return c.json({ success: true });
});
app.post("/admin/api/am/membership/remove", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = body["id"];
  await c.env.DB.prepare("DELETE FROM group_memberships WHERE id = ?").bind(id).run();
  const details = JSON.stringify({ key: "log_membership_remove", params: { id, admin: user.email } });
  await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("MEMBERSHIP_REMOVE", details).run();
  return c.json({ success: true });
});
app.get("/admin/am/services", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const providers = await c.env.DB.prepare("SELECT * FROM service_providers ORDER BY created_at DESC").all();
  const services = await c.env.DB.prepare(`
        SELECT s.*, p.name AS provider_name FROM services s
        LEFT JOIN service_providers p ON s.provider_id = p.id ORDER BY s.created_at DESC`).all();
  const contracts = await c.env.DB.prepare(`
        SELECT ct.*, s.name AS service_name, p.name AS provider_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
        ORDER BY ct.valid_from DESC`).all();
  const groups = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AccountServicesPage,
    {
      t: getLang(c),
      userEmail: user.email,
      siteName,
      appConfig: config2,
      providers: providers.results,
      services: services.results,
      contracts: contracts.results,
      groups: groups.results
    }
  ));
});
app.post("/admin/am/providers", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body["name"] || "").trim();
  if (name) {
    await c.env.DB.prepare("INSERT INTO service_providers (id, name, created_at) VALUES (?, ?, ?)").bind(crypto.randomUUID(), name, Math.floor(Date.now() / 1e3)).run();
    await logAudit(c, "PROVIDER_ADD", { key: "log_provider_add", params: { name, admin: user.email } });
  }
  return c.redirect("/admin/am/services");
});
app.post("/admin/am/providers/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  const svc = await c.env.DB.prepare("SELECT id FROM services WHERE provider_id = ?").bind(id).all();
  for (const s of svc.results) await deleteServiceCascade(c, s.id);
  await c.env.DB.prepare("DELETE FROM service_providers WHERE id = ?").bind(id).run();
  await logAudit(c, "PROVIDER_DELETE", { key: "log_provider_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/services");
});
app.post("/admin/am/services", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body["name"] || "").trim();
  const providerId = body["provider_id"] || "";
  if (name && providerId) {
    await c.env.DB.prepare("INSERT INTO services (id, provider_id, name, created_at) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), providerId, name, Math.floor(Date.now() / 1e3)).run();
    await logAudit(c, "SERVICE_ADD", { key: "log_service_add", params: { name, admin: user.email } });
  }
  return c.redirect("/admin/am/services");
});
app.post("/admin/am/services/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await deleteServiceCascade(c, id);
  await logAudit(c, "SERVICE_DELETE", { key: "log_service_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/services");
});
app.post("/admin/am/contracts", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const serviceId = body["service_id"] || "";
  const groupId = body["customer_group_id"] || "";
  const seatRaw = (body["seat_limit"] || "").trim();
  const seatLimit = seatRaw === "" ? null : Number(seatRaw);
  const validFrom = Math.floor(new Date(body["valid_from"]).getTime() / 1e3);
  const validTo = Math.floor(new Date(body["valid_to"]).getTime() / 1e3);
  if (serviceId && groupId) {
    await c.env.DB.prepare("INSERT INTO service_contracts (id, service_id, customer_group_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), serviceId, groupId, seatLimit, validFrom, validTo).run();
    await logAudit(c, "CONTRACT_ADD", { key: "log_contract_add", params: { service: serviceId, admin: user.email } });
  }
  return c.redirect("/admin/am/services");
});
app.post("/admin/am/contracts/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM group_service_grants WHERE contract_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM service_contracts WHERE id = ?").bind(id)
  ]);
  await logAudit(c, "CONTRACT_DELETE", { key: "log_contract_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/services");
});
app.get("/admin/am/grants", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const grants = await c.env.DB.prepare(`
        SELECT gr.*, g.name AS group_name, s.name AS service_name, p.name AS provider_name
        FROM group_service_grants gr
        LEFT JOIN groups g ON gr.group_id = g.id
        LEFT JOIN services s ON gr.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        ORDER BY gr.valid_from DESC`).all();
  const groups = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all();
  const contracts = await c.env.DB.prepare(`
        SELECT ct.*, s.name AS service_name, p.name AS provider_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
        ORDER BY ct.valid_from DESC`).all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AccountGrantsPage,
    {
      t: getLang(c),
      userEmail: user.email,
      siteName,
      appConfig: config2,
      grants: grants.results,
      groups: groups.results,
      contracts: contracts.results
    }
  ));
});
app.post("/admin/am/grants", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const groupId = body["group_id"] || "";
  const contractId = body["contract_id"] || "";
  if (!groupId || !contractId) return c.redirect("/admin/am/grants");
  const ct = await c.env.DB.prepare("SELECT service_id FROM service_contracts WHERE id = ?").bind(contractId).first();
  if (!ct) return c.redirect("/admin/am/grants");
  const seatRaw = (body["seat_limit"] || "").trim();
  const seatLimit = seatRaw === "" ? null : Number(seatRaw);
  const validFrom = Math.floor(new Date(body["valid_from"]).getTime() / 1e3);
  const validTo = Math.floor(new Date(body["valid_to"]).getTime() / 1e3);
  await c.env.DB.prepare(`
        INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_id, service_id) DO UPDATE SET contract_id=excluded.contract_id, seat_limit=excluded.seat_limit, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(groupId, ct.service_id, contractId, seatLimit, validFrom, validTo).run();
  await logAudit(c, "GRANT_ADD", { key: "log_grant_add", params: { group: groupId, service: ct.service_id, admin: user.email } });
  return c.redirect("/admin/am/grants");
});
app.post("/admin/am/grants/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await c.env.DB.prepare("DELETE FROM group_service_grants WHERE id = ?").bind(id).run();
  await logAudit(c, "GRANT_DELETE", { key: "log_grant_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/grants");
});
app.get("/admin/am/facilities", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const facilities = await c.env.DB.prepare(`
        SELECT f.*, g.name AS group_name FROM facilities f
        LEFT JOIN groups g ON f.managing_group_id = g.id ORDER BY f.created_at DESC`).all();
  const groups = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AccountFacilitiesPage,
    {
      t: getLang(c),
      userEmail: user.email,
      siteName,
      appConfig: config2,
      facilities: facilities.results,
      groups: groups.results
    }
  ));
});
app.post("/admin/am/facilities", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const groupId = body["managing_group_id"] || "";
  const structureNo = (body["structure_no"] || "").trim() || null;
  const buildingUse = (body["building_use"] || "").trim() || null;
  if (groupId) {
    await c.env.DB.prepare("INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), structureNo, buildingUse, groupId, Math.floor(Date.now() / 1e3)).run();
    await logAudit(c, "FACILITY_ADD", { key: "log_facility_add", params: { structure_no: structureNo, admin: user.email } });
  }
  return c.redirect("/admin/am/facilities");
});
app.post("/admin/am/facilities/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM service_user_assignments WHERE facility_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM facilities WHERE id = ?").bind(id)
  ]);
  await logAudit(c, "FACILITY_DELETE", { key: "log_facility_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/facilities");
});
app.get("/admin/am/assignments", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const roles = await c.env.DB.prepare(`
        SELECT r.*, s.name AS service_name, p.name AS provider_name FROM service_role_master r
        LEFT JOIN services s ON r.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        ORDER BY r.id DESC`).all();
  const assignments = await c.env.DB.prepare(`
        SELECT a.*, u.email AS user_email, u.name AS user_name, g.name AS group_name,
               s.name AS service_name, f.structure_no AS structure_no, rm.role_name AS role_name
        FROM service_user_assignments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN groups g ON a.group_id = g.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN facilities f ON a.facility_id = f.id
        LEFT JOIN service_role_master rm ON a.service_role_id = rm.id
        ORDER BY a.valid_from DESC`).all();
  const services = await c.env.DB.prepare(`
        SELECT s.*, p.name AS provider_name FROM services s
        LEFT JOIN service_providers p ON s.provider_id = p.id ORDER BY s.name`).all();
  const facilities = await c.env.DB.prepare(`
        SELECT f.*, g.name AS group_name FROM facilities f
        LEFT JOIN groups g ON f.managing_group_id = g.id ORDER BY f.structure_no`).all();
  const groups = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all();
  const users = await c.env.DB.prepare("SELECT * FROM users ORDER BY email").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AccountAssignmentsPage,
    {
      t: getLang(c),
      userEmail: user.email,
      siteName,
      appConfig: config2,
      roles: roles.results,
      assignments: assignments.results,
      services: services.results,
      facilities: facilities.results,
      groups: groups.results,
      users: users.results,
      error: c.req.query("error")
    }
  ));
});
app.post("/admin/am/roles", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const serviceId = body["service_id"] || "";
  const facilityType = (body["facility_type"] || "").trim() || null;
  const roleName = (body["role_name"] || "").trim();
  if (serviceId && roleName) {
    await c.env.DB.prepare("INSERT INTO service_role_master (service_id, facility_type, role_name) VALUES (?, ?, ?) ON CONFLICT DO NOTHING").bind(serviceId, facilityType, roleName).run();
    await logAudit(c, "ROLE_ADD", { key: "log_role_add", params: { role: roleName, admin: user.email } });
  }
  return c.redirect("/admin/am/assignments");
});
app.post("/admin/am/roles/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM service_user_assignments WHERE service_role_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM service_role_master WHERE id = ?").bind(id)
  ]);
  await logAudit(c, "ROLE_DELETE", { key: "log_role_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/assignments");
});
app.post("/admin/am/assignments", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const body = await c.req.parseBody();
  const userId = body["user_id"] || "";
  const groupId = body["group_id"] || "";
  const serviceId = body["service_id"] || "";
  const facilityId = body["facility_id"] || "";
  const roleId = Number(body["service_role_id"]);
  const validFrom = Math.floor(new Date(body["valid_from"]).getTime() / 1e3);
  const validTo = Math.floor(new Date(body["valid_to"]).getTime() / 1e3);
  if (!userId || !groupId || !serviceId || !facilityId || !roleId) return c.redirect("/admin/am/assignments");
  const grant = await c.env.DB.prepare("SELECT * FROM group_service_grants WHERE group_id = ? AND service_id = ?").bind(groupId, serviceId).first();
  if (!grant) return c.redirect("/admin/am/assignments?error=no_grant");
  const existing = await c.env.DB.prepare("SELECT COUNT(*) AS c FROM service_user_assignments WHERE user_id = ? AND group_id = ? AND service_id = ?").bind(userId, groupId, serviceId).first();
  const isNewSeat = (existing?.c || 0) === 0;
  if (isNewSeat) {
    if (grant.seat_limit != null) {
      const usedG = await c.env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM service_user_assignments WHERE group_id = ? AND service_id = ?").bind(groupId, serviceId).first();
      if ((usedG?.c || 0) >= grant.seat_limit) return c.redirect("/admin/am/assignments?error=seat");
    }
    const contract = await c.env.DB.prepare("SELECT seat_limit FROM service_contracts WHERE id = ?").bind(grant.contract_id).first();
    if (contract && contract.seat_limit != null) {
      const usedC = await c.env.DB.prepare(`
                SELECT COUNT(DISTINCT a.user_id) AS c FROM service_user_assignments a
                JOIN group_service_grants g ON a.group_id = g.group_id AND a.service_id = g.service_id
                WHERE g.contract_id = ?`).bind(grant.contract_id).first();
      if ((usedC?.c || 0) >= contract.seat_limit) return c.redirect("/admin/am/assignments?error=seat");
    }
  }
  await c.env.DB.prepare(`
        INSERT INTO service_user_assignments (user_id, group_id, service_id, facility_id, service_role_id, valid_from, valid_to)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, group_id, service_id, facility_id) DO UPDATE SET service_role_id=excluded.service_role_id, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(userId, groupId, serviceId, facilityId, roleId, validFrom, validTo).run();
  await logAudit(c, "ASSIGNMENT_ADD", { key: "log_assignment_add", params: { user: userId, service: serviceId, admin: user.email } });
  return c.redirect("/admin/am/assignments");
});
app.post("/admin/am/assignments/delete", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const id = (await c.req.parseBody())["id"];
  await c.env.DB.prepare("DELETE FROM service_user_assignments WHERE id = ?").bind(id).run();
  await logAudit(c, "ASSIGNMENT_DELETE", { key: "log_assignment_delete", params: { id, admin: user.email } });
  return c.redirect("/admin/am/assignments");
});
app.get("/admin/logs", async (c) => {
  const user = await getAdmin(c);
  if (!user) return c.redirect("/login");
  const config2 = await getSystemConfig(c.env.DB);
  const siteName = getLocalizedValue(c, config2.appName);
  const page = parseInt(c.req.query("page") || "1");
  const filterEvent = c.req.query("event") || "";
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  let query = "SELECT * FROM audit_logs";
  let countQuery = "SELECT COUNT(*) as c FROM audit_logs";
  const params = [];
  if (filterEvent) {
    const where = " WHERE event_type = ?";
    query += where;
    countQuery += where;
    params.push(filterEvent);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(pageSize, offset);
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const countParams = filterEvent ? [filterEvent] : [];
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  const totalCount = totalRes?.c || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  return c.html(/* @__PURE__ */ jsxDEV(
    LogsPage,
    {
      t: getLang(c),
      userEmail: user.email,
      logs: results,
      currentPage: page,
      totalPages,
      totalCount,
      currentFilter: filterEvent,
      siteName,
      appConfig: config2
    }
  ));
});
app.get("/invite", async (c) => {
  const t = getLang(c);
  const token = c.req.query("token");
  if (!token) return c.html(/* @__PURE__ */ jsxDEV(Invite, { t, error: t.error_invalid_invite }));
  const invite = await c.env.DB.prepare("SELECT * FROM invitations WHERE id = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!invite) return c.html(/* @__PURE__ */ jsxDEV(Invite, { t, error: t.error_invalid_invite }));
  return c.html(/* @__PURE__ */ jsxDEV(Invite, { t, token, email: invite.email }));
});
app.post("/invite", async (c) => {
  const t = getLang(c);
  const body = await c.req.parseBody();
  const token = body["token"].replace(/\s+/g, "");
  const password = body["password"];
  const invite = await c.env.DB.prepare("SELECT * FROM invitations WHERE id = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!invite) return c.html(/* @__PURE__ */ jsxDEV(Invite, { t, error: t.error_invalid_invite }));
  const userId = crypto.randomUUID();
  const pwHash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1e3);
  try {
    await c.env.DB.prepare("INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").bind(userId, invite.email, pwHash, now, now).run();
    await c.env.DB.prepare("DELETE FROM invitations WHERE id = ?").bind(token).run();
    return c.redirect("/login?msg=msg_account_created");
  } catch (e) {
    return c.html(/* @__PURE__ */ jsxDEV(Invite, { t, token, error: t.error_user_exists }));
  }
});
app.get("/forgot-password", (c) => c.html(/* @__PURE__ */ jsxDEV(ForgotPassword, { t: getLang(c) })));
app.post("/forgot-password", async (c) => {
  const t = getLang(c);
  const body = await c.req.parseBody();
  const email = body["email"];
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (user) {
    const token = generateToken();
    const expires = Math.floor(Date.now() / 1e3) + 3600;
    await c.env.DB.prepare("INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();
    const resetLink = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
    const htmlBody = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Password Reset</strong></p>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>\u7E5D\u4EE3\u305B\u7E5D\uFF6F\u7E5D\uFF7C\u7E5D\u5CE8\u039C\u7E67\uFF7B\u7E5D\u30FB\u30E8</strong></p>
        <p>\u7E5D\u4EE3\u305B\u7E5D\uFF6F\u7E5D\uFF7C\u7E5D\u5CE8\u039C\u7E67\uFF7B\u7E5D\u30FB\u30E8\u7E3A\uFF6E\u7E5D\uFF6A\u7E67\uFF6F\u7E67\uFF68\u7E67\uFF79\u7E5D\u533B\uFF52\u873F\u52B1\uFFE0\u8389\u5025\uFFE0\u7E3A\uFF7E\u7E3A\u52B1\u25C6\u7E32\u3086\uFF7B\uFF65\u8373\u4E5D\u30FB\u7E5D\uFF6A\u7E5D\uFF73\u7E67\uFF6F\u7E67\u5075\u3051\u7E5D\uFF6A\u7E5D\u30FB\u3051\u7E3A\u52B1\u203B\u7E32\u2235\u7720\u7E3A\u52B1\uFF1E\u7E5D\u4EE3\u305B\u7E5D\uFF6F\u7E5D\uFF7C\u7E5D\u5CE8\uFF52\u96AA\uFF6D\u87B3\u58F9\uFF20\u7E3A\uFF66\u7E3A\u4E0A\u25A1\u7E3A\u8F14\uFF1E\u7E32\u30FB/p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
      </div>
    `;
    await sendEmail(c.env, email, "Password Reset / \u7E5D\u4EE3\u305B\u7E5D\uFF6F\u7E5D\uFF7C\u7E5D\u5CE8\u039C\u7E67\uFF7B\u7E5D\u30FB\u30E8", htmlBody);
  }
  return c.html(/* @__PURE__ */ jsxDEV(ForgotPassword, { t, message: t.link_sent }));
});
app.get("/reset-password", async (c) => {
  const t = getLang(c);
  const token = c.req.query("token");
  if (!token) return c.redirect("/forgot-password");
  const reset = await c.env.DB.prepare("SELECT * FROM password_resets WHERE token = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!reset) return c.html(/* @__PURE__ */ jsxDEV(ResetPassword, { t, token: "", error: t.error_invalid_invite }));
  return c.html(/* @__PURE__ */ jsxDEV(ResetPassword, { t, token }));
});
app.post("/reset-password", async (c) => {
  const t = getLang(c);
  const body = await c.req.parseBody();
  const token = body["token"].replace(/\s+/g, "");
  const password = body["password"];
  const reset = await c.env.DB.prepare("SELECT * FROM password_resets WHERE token = ? AND expires_at > ?").bind(token, Math.floor(Date.now() / 1e3)).first();
  if (!reset) return c.html(/* @__PURE__ */ jsxDEV(ResetPassword, { t, token: "", error: t.error_invalid_invite }));
  const pwHash = await hashPassword(password);
  await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(pwHash, reset.user_id).run();
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(reset.user_id).run();
  try {
    await c.env.DB.prepare("DELETE FROM app_sessions WHERE user_id = ?").bind(reset.user_id).run();
  } catch (e) {
  }
  await c.env.DB.prepare("DELETE FROM password_resets WHERE token = ?").bind(token).run();
  return c.redirect("/login");
});
app.post("/admin/config", async (c) => {
  try {
    const user = await getAdmin(c);
    if (!user) return c.redirect("/login");
    const body = await c.req.parseBody();
    const app_name_ja = body["app_name_ja"];
    const app_name_en = body["app_name_en"];
    const app_subtitle_ja = body["app_subtitle_ja"];
    const app_subtitle_en = body["app_subtitle_en"];
    if (app_name_ja) await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?").bind("app_name_ja", app_name_ja, app_name_ja).run();
    if (app_name_en) await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?").bind("app_name_en", app_name_en, app_name_en).run();
    if (app_subtitle_ja) await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?").bind("app_subtitle_ja", app_subtitle_ja, app_subtitle_ja).run();
    if (app_subtitle_en) await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?").bind("app_subtitle_en", app_subtitle_en, app_subtitle_en).run();
    const details = JSON.stringify({ key: "log_config_update", params: { admin: user.email } });
    await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("CONFIG_UPDATE", details).run();
    return c.redirect("/admin");
  } catch (e) {
    return c.text("Error updating config: " + e.message, 500);
  }
});
app.get("/login/2fa", async (c) => {
  const t = getLang(c);
  const token = getCookie(c, "pre_2fa_token");
  if (!token) return c.redirect("/login");
  try {
    await verify2(token, c.env.JWT_SECRET || "dev_secret", "HS256");
  } catch (e) {
    return c.redirect("/login");
  }
  const redirectTo = c.req.query("redirect_to");
  const returnTo = c.req.query("return_to");
  return c.html(/* @__PURE__ */ jsxDEV(Login2FA, { t, redirectTo, returnTo }));
});
app.post("/login/2fa", async (c) => {
  const t = getLang(c);
  const body = await c.req.parseBody();
  const otp = body["token"].replace(/\s+/g, "");
  const redirectTo = body["redirect_to"];
  const returnTo = body["return_to"];
  const preToken = getCookie(c, "pre_2fa_token");
  if (!preToken) return c.redirect("/login");
  let payload;
  try {
    payload = await verify2(preToken, c.env.JWT_SECRET || "dev_secret", "HS256");
  } catch (e) {
    return c.redirect("/login");
  }
  const userId = payload.sub;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  if (!user || !user.two_factor_secret) return c.redirect("/login");
  if (verifyToken(otp, user.two_factor_secret)) {
    await createSession(c, user.id);
    deleteCookie(c, "pre_2fa_token");
    let targetAppName = "Tobira Dashboard";
    const admin = await c.env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(user.email).first();
    if (redirectTo) {
      const { results } = await c.env.DB.prepare("SELECT * FROM apps WHERE status = ?").bind("active").all();
      const app2 = results.find((a) => isAllowedRedirectUri(redirectTo, a));
      if (app2) targetAppName = app2.name;
    } else if (admin) {
      targetAppName = "Tobira Admin";
    }
    const details = JSON.stringify({ key: "log_login_app", params: { email: user.email, method: "2FA", appName: targetAppName } });
    await c.env.DB.prepare("INSERT INTO audit_logs (event_type, details) VALUES (?, ?)").bind("LOGIN", details).run();
    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo);
    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo);
    return c.redirect(admin ? "/admin" : "/");
  } else {
    return c.html(/* @__PURE__ */ jsxDEV(Login2FA, { t, redirectTo, returnTo, error: t.err_invalid_code }));
  }
});
var index_default = app;
export {
  index_default as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)

@otplib/plugin-crypto/index.js:
  (**
   * @otplib/plugin-crypto
   *
   * @author Gerald Yeo <contact@fusedthought.com>
   * @version: 12.0.1
   * @license: MIT
   **)

@otplib/plugin-thirty-two/index.js:
  (**
   * @otplib/plugin-thirty-two
   *
   * @author Gerald Yeo <contact@fusedthought.com>
   * @version: 12.0.1
   * @license: MIT
   **)

@otplib/core/index.js:
  (**
   * @otplib/core
   *
   * @author Gerald Yeo <contact@fusedthought.com>
   * @version: 12.0.1
   * @license: MIT
   **)

@otplib/preset-default/index.js:
  (**
   * @otplib/preset-default
   *
   * @author Gerald Yeo <contact@fusedthought.com>
   * @version: 12.0.1
   * @license: MIT
   **)

otplib/index.js:
  (**
   * otplib
   *
   * @author Gerald Yeo <contact@fusedthought.com>
   * @version: 12.0.1
   * @license: MIT
   **)
*/
//# sourceMappingURL=index.js.map
