Javascript Widgets
==================

batman.js
---------
Seaboard Wigdets use `batman.js <http://batmanjs.org/>`_, a javascript framework that brings a system of view (html) bindings and observable properties.


dashing.js
----------
Built on top of batman.js, this library is taken from a dashboard application name `dashing <http://shopify.github.io/dashing/>`_. Widgets are inserted in the html code as follows:: 

 	<div data-id="__widget_id__" data-view="__WidgetClass__" data-*="__any_atribute__"></div>


Widget example
--------------
All widgets are stored in a folder inside static/widgets, containing 3 files:

	- **widget_name.js**: originally widget_name.coffee, that could be a good option in a future

	- **widget_name.html**: static html with variable binding (its retrieved from /views/widget_name.html)

	- **widget_name.less**: css written with less. This file has to be included in css/seawidgets.less (via @import "../widgets/widget_name/widget_name.less";)


widget_name.js
``````````````
.. code-block:: javascript
    
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

	  Dashing.WidgetName = (function(_super) {
	    __extends(BeachFlag, _super);

	    function WidgetName() {
	      this.refreshData = __bind(this.refreshData, this);
	      _ref = WidgetName.__super__.constructor.apply(this, arguments);
	      return _ref;
	    }

	    WidgetName.prototype.ready = function() {
	      this.refreshData();
	      return setInterval(this.refreshData, 60000 * 60 * 2); // every 2 hours
	    };

	    WidgetName.prototype.refreshData = function() {
	      var url = 'any_url.json';
	      var that = this;
	      $.getJSON(url, function(data) {
	        that.showData(data);
	      });
	    };

	    WidgetName.prototype.showData = function(data) {
	      // set binded variables or add more processing logic
	      this.set('variable_binded_in_html', data);
	    };

	    return BeachFlag;

	  })(Dashing.Widget);

	}).call(this);


