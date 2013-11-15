// Generated by CoffeeScript 1.6.2
(function() {
  var _ref,
    __bind = function(fn, me) {
      return function() {
        return fn.apply(me, arguments);
      };
    },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) {
      for (var key in parent) {
        if (__hasProp.call(parent, key)) child[key] = parent[key];
      }

      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
      child.__super__ = parent.prototype;
      return child;
    };

  Dashing.MooringVariables = (function(_super) {
    __extends(MooringVariables, _super);

    function MooringVariables() {
      this.refreshData = __bind(this.refreshData, this);
      _ref = MooringVariables.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    MooringVariables.prototype.ready = function() {
      this.refreshData();
      if (this.get('title') !== undefined && this.get('title') === '') {
        $(this.node).find('h1').remove();
      }
      return setInterval(this.refreshData, 60000 * 20 ); // every 20 minutes
    };

    MooringVariables.prototype.refreshData = function() {
      var that = this;
      var url = '/deployments/variables.json';

      $.getJSON(url, function(data) {
        variables = [];
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var variable = data[key];
            variable.standardName = key;
            variable.image = that.slugify(key);
            variables.push(variable);
          }
        }
        that.set('variables', variables);
      });
    };


    MooringVariables.prototype.slugify = function(str) {
      str = str.replace(/[^a-zA-Z0-9_\s]/g,"");
      str = str.toLowerCase();
      str = str.replace(/\s/g,'-');
      return str;
    };


    return MooringVariables;

  })(Dashing.Widget);

}).call(this);