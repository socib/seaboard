$(function() {

  var widget_base_dimensions = [300, 360];
  var widget_margins = [5, 5];
  var numColumns = 4;
  var contentWidth = (widget_base_dimensions[0] + widget_margins[0] * 2) * numColumns;

  $('.gridster').width(contentWidth);
  $('.gridster ul:first').gridster({
    widget_margins: widget_margins,
    widget_base_dimensions: widget_base_dimensions,
    avoid_overlapped_widgets: true
  });

});