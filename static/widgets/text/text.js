(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.Text = (function(_super) {
    __extends(Text, _super);

    function Text() {
      _ref = Text.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return Text;

  })(Dashing.Widget);

}).call(this);