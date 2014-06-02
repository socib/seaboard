// Generated by CoffeeScript 1.6.2
(function() {
  var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  var inputUnits = {
    'sea_water_temperature': '°C',
    'sea_water_salinity': 'psu',
    'sea_water_electrical_conductivity': 'ms cm-1',
    'fluor': 'V',
    'depth': 'm',
    'speed': 'kn',
    'wind_speed': 'kn',
    'wind_speed_mean': 'm s-1',
    'air_pressure': 'hPa',
    'humidity': '%',
    'air_temperature': '°C',
    'sun_radiation': 'W m^2-1'
  };

  var formatNumber = function(value,decimalpositions){
    if (decimalpositions === undefined){
      decimalpositions = 1;
    }
    var result = parseFloat(value);
    if (isNaN(result))
      return 'No data';
    return result.toFixed(decimalpositions);
  };

  var conversions = {
    'wind_speed': function (value){
      return ((value / 1852) * 3600).toFixed(1);
    },
    'sea_water_temperature': function (value){
      return formatNumber(value);
    },
    'sea_water_salinity': function (value){
      return formatNumber(value);
    },
    'sea_water_electrical_conductivity': function (value){
      return formatNumber(value);
    },
    'air_pressure': function (value){
      return formatNumber(value);
    },
    'air_temperature': function (value){
      return formatNumber(value);
    },
    'humidity': function (value){
      return formatNumber(value);
    },
    'fluor': function (value){
      return formatNumber(value, 2);
    }
  };



  Dashing.VesselInfo = (function(_super) {
    __extends(VesselInfo, _super);

    function VesselInfo() {
      this.initialData = __bind(this.initialData, this);
      this.setItem = __bind(this.setItem, this);
      _ref = VesselInfo.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    VesselInfo.prototype.ready = function() {
      $(this.node).addClass(this.get('id'));
    };

    VesselInfo.prototype.unitConversion = function(value) {
      if (this.get('id') in conversions){
        return conversions[this.get('id')].call(this, value);
      }else{
        return value;
      }
    };

    VesselInfo.prototype.onData = function(data) {
      if (data.error){
        return;
      }

      var oldItem = {};
      if (this.get('item') !== undefined)
        oldItem = this.get('item');


      var item = {};
      var current_value = '';
      item.display_name = this.get('title');
      item.standard_name = this.get('id');
      item.current = {};
      item.current.time = data.time;
      if (this.get('id') == 'position'){
        item.current.value = data.long + ',' + data.lat;
        item.current.dispvalue = this.decimalDegrees2DMS(data.lat, 'Latitude') + ' <br /> ' +
                             this.decimalDegrees2DMS(data.long, 'Longitude');
      }else{
        item.current.value = data[this.get('id')];
        item.current.dispvalue = this.unitConversion(data[this.get('id')]);
        item.inputUnits = inputUnits[this.get('id')];
      }
      item.min = {};

      if (!oldItem.min || !oldItem.min.value || parseFloat(oldItem.min.value) > parseFloat(item.current.value)){
        item.min.value = item.current.value;
        item.min.dispvalue = item.current.dispvalue;
        item.min.time = data.time;
      }else{
        item.min.value = oldItem.min.value;
        item.min.dispvalue = oldItem.min.dispvalue;
        item.min.time = oldItem.min.time;
      }

      item.max = {};
      if (!oldItem.max || !oldItem.max.value || parseFloat(oldItem.max.value) < parseFloat(item.current.value)){
        item.max.value = item.current.value;
        item.max.dispvalue = item.current.dispvalue;
        item.max.time = data.time;
      }else{
        item.max.value = oldItem.max.value;
        item.max.dispvalue = oldItem.max.dispvalue;
        item.max.time = oldItem.max.time;
      }

      this.set('item',item);
    };

    VesselInfo.prototype.initialData = function(data) {
      var item = {};

      item.display_name = this.get('title');
      item.standard_name = this.get('id');
      item.current = {};
      item.min = {};
      item.max = {};

      var length = data.time.length;
      item.current.time = data.time[length - 1];
      if (this.get('id') == 'position'){
        item.current.value = data['long'][length - 1] + ',' + data['lat'][length - 1];
        item.current.dispvalue = this.decimalDegrees2DMS(data['lat'][length - 1],'Latitude') + '<br/>' +
                             this.decimalDegrees2DMS(data['long'][length - 1],'Longitude');
      }else{
        item.current.value = data[this.get('id')][length - 1];
        item.current.dispvalue = this.unitConversion(data[this.get('id')][length - 1]);
        item.inputUnits = inputUnits[this.get('id')];
        if (this.get('id') != 'depth'){
          item.min.value = Math.min.apply(Math, data[this.get('id')] );
          item.max.value = Math.max.apply(Math, data[this.get('id')] );
          if (item.min.value == Infinity) { item.min.value = 'N/A'; }
          if (item.max.value == -Infinity) { item.max.value = 'N/A'; }
          item.min.dispvalue = this.unitConversion(item.min.value);
          item.max.dispvalue = this.unitConversion(item.max.value);
          index_min = data[this.get('id')].indexOf(item.min.value.toString());
          item.min.time = data.time[index_min];
          index_max = data[this.get('id')].indexOf(item.max.value.toString());
          item.max.time = data.time[index_max];
        }
      }

      this.set('item',item);
    };

    /*
        Converts a Decimal Degree Value into
        Degrees Minute Seconds Notation.

        Pass value as double
        type = {Latitude or Longitude} as string

        returns a string as D:M:S:Direction
    */
    VesselInfo.prototype.decimalDegrees2DMS = function(value, type) {
      degrees = Math.floor(value);
      minutes = Math.abs( (value - degrees ) * 60).toFixed(2);
      // subseconds = Math.abs((submin-minutes) * 60);
      direction = "";
      if (type == "Longitude"){
        if (degrees < 0)
            direction = "W";
        else if (degrees > 0)
            direction = "E";
        else
            direction = "";
      } else if (type == "Latitude"){
          if (degrees < 0)
              direction = "S";
          else if (degrees > 0)
              direction = "N";
          else
              direction = "";
      }
      degrees = Math.abs(degrees);
      notation = degrees + "° " + minutes + "' " + direction;
      return notation;
    };


    return VesselInfo;

  })(Dashing.Widget);

}).call(this);
