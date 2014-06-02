// Generated by CoffeeScript 1.6.2
(function() {
  var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Dashing.VesselWind = (function(_super) {
    __extends(VesselWind, _super);

    function VesselWind() {
      this.initialData = __bind(this.initialData, this);
      this.setItem = __bind(this.setItem, this);
      _ref = VesselWind.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    VesselWind.prototype.ready = function() {
      $(this.node).addClass(this.get('id'));
    };

    VesselWind.prototype.onData = function(data) {
      if (!data.error){
        if (data.wind_from_direction){
          var wind_value = Math.round(parseFloat(data.wind_from_direction));
          var arrow_rotate = wind_value - 180;
          $(this.node).find('.wind-arrow').css({
              transform: 'rotate('+ arrow_rotate +'deg)'
          });
          this.set('wind_from_direction', wind_value + '°');
        }
      }

    };

    VesselWind.prototype.initialData = function(data) {
      if (!data.error){
        if (data.wind_from_direction){
          var length = data.wind_from_direction.length;
          var wind_value = Math.round(parseFloat(data.wind_from_direction[length - 1]));
          var arrow_rotate = wind_value - 180;
          $(this.node).find('.wind-arrow').css({
              transform: 'rotate('+ arrow_rotate +'deg)'
          });
          this.set('wind_from_direction',wind_value + '°');
        }
      }
    };

    return VesselWind;

  })(Dashing.Widget);

}).call(this);
