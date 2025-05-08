// Simple polyfill that only targets the specific SlowBuffer issue
if (typeof global.SlowBuffer === "undefined") {
  global.SlowBuffer = Buffer;
}
