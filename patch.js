// patch.js
// Direct patch for the SlowBuffer error
Buffer.SlowBuffer = Buffer;
global.SlowBuffer = Buffer;

// This is the critical line - it modifies the actual prototype chain
Object.defineProperty(Buffer, "prototype", {
  get: function () {
    return Buffer.prototype;
  },
  configurable: true,
});

console.log("✅ Applied buffer-equal-constant-time patch");
