var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AV.AWSSource = (function(_super) {

  __extends(AWSSource, _super);

  function AWSSource(credentails) {
    this.url = 'https://s3.amazonaws.com' + credentails.res;
	this.headtoken = credentails.a + ':' + credentails.head;
	this.gettoken = credentails.a + ':' + credentails.get;
	this.expiry = credentails.ex;
    this.chunkSize = 1 << 20;
    this.inflight = false;
    this.reset();
  }

  AWSSource.prototype.start = function() {
    var _this = this;
    this.inflight = true;
    this.xhr = new XMLHttpRequest();
    this.xhr.onload = function(event) {
      _this.length = parseInt(_this.xhr.getResponseHeader("Content-Length"));
      _this.inflight = false;
      return _this.loop();
    };
    this.xhr.onerror = function(err) {
      _this.pause();
      return _this.emit('error', err);
    };
    this.xhr.onabort = function(event) {
      console.log("HTTP Aborted: Paused?");
      return _this.inflight = false;
    };
    this.xhr.open("HEAD", this.url, true);
	this.xhr.setRequestHeader('Authorization', 'AWS ' + this.headtoken);
	this.xhr.setRequestHeader('X-Amz-Date', this.expiry);
    return this.xhr.send(null);
  };

  AWSSource.prototype.loop = function() {
    var endPos,
      _this = this;
    if (this.inflight || !this.length) {
      return this.emit('error', 'Something is wrong in AWSSource.loop');
    }
    if (this.offset === this.length) {
      this.inflight = false;
      this.emit('end');
      return;
    }
    this.inflight = true;
    this.xhr = new XMLHttpRequest();
    this.xhr.onprogress = function(event) {
      return _this.emit('progress', (_this.offset + event.loaded) / _this.length * 100);
    };
    this.xhr.onload = function(event) {
      var buf, buffer, i, txt, _i, _ref;
      if (_this.xhr.response) {
        buf = new Uint8Array(_this.xhr.response);
      } else {
        txt = _this.xhr.responseText;
        buf = new Uint8Array(txt.length);
        for (i = _i = 0, _ref = txt.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          buf[i] = txt.charCodeAt(i) & 0xff;
        }
      }
      buffer = new AV.Buffer(buf);
      _this.offset += buffer.length;
      _this.emit('data', buffer);
      if (_this.offset === _this.length) {
        _this.emit('end');
      }
      _this.emit('progress', _this.offset / _this.length * 100);
      _this.inflight = false;
      return _this.loop();
    };
    this.xhr.onerror = function(err) {
      _this.emit('error', err);
      return _this.pause();
    };
    this.xhr.onabort = function(event) {
      return _this.inflight = false;
    };
    this.xhr.open("GET", this.url, true);
    this.xhr.responseType = "arraybuffer";
    endPos = Math.min(this.offset + this.chunkSize, this.length);
    this.xhr.setRequestHeader("Range", "bytes=" + this.offset + "-" + endPos);
	this.xhr.setRequestHeader('Authorization', 'AWS ' + this.gettoken);
	this.xhr.setRequestHeader('X-Amz-Date', this.expiry);
    this.xhr.overrideMimeType('text/plain; charset=x-user-defined');
    return this.xhr.send(null);
  };

  AWSSource.prototype.pause = function() {
    var _ref;
    this.inflight = false;
    return (_ref = this.xhr) != null ? _ref.abort() : void 0;
  };

  AWSSource.prototype.reset = function() {
    this.pause();
    return this.offset = 0;
  };

  return AWSSource;

})(AV.EventEmitter);


AV.Asset.fromAWS = function(credentails) {
    var source;
    source = new AV.AWSSource(credentails);
    return new AV.Asset(source);
};

AV.Player.fromAWS = function(credentails) {
  var asset;
  asset = AV.Asset.fromAWS(credentails);
  return new AV.Player(asset);
};