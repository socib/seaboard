// Generated by CoffeeScript 1.6.2
(function() {
  var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Clockutc = (function(_super) {
    __extends(Clockutc, _super);

    function Clockutc() {
      this.startTime = __bind(this.startTime, this);      _ref = Clockutc.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Clockutc.prototype.ready = function() {
      return setInterval(this.startTime, 500);
    };

    Clockutc.prototype.startTime = function() {
      var h, m, s, today;

      today = new Date();
      h = today.getHours();
      m = today.getMinutes();
      s = today.getSeconds();
      m = this.formatTime(m);
      this.set('time', h + ":" + m);
      h = today.getUTCHours();
      m = today.getUTCMinutes();
      s = today.getUTCSeconds();
      m = this.formatTime(m);
      this.set('timeutc', " (" + h + ":" + m + " UTC) ");          
      return this.set('date', today.toDateString());
    };

    Clockutc.prototype.formatTime = function(i) {
      if (i < 10) {
        return "0" + i;
      } else {
        return i;
      }
    };

    return Clockutc;

  })(Dashing.Widget);

}).call(this);
