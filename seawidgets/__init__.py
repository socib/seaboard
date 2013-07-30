"""
This package is a django application for seaboard project.

Most of this modules only produce json data that will be consumed for the javascript class that controlls seaboard widgets.

Dash view (dash.html template indeed) is the responsible to show the panel with all the widgets. The widgets are included this way::

    <div data-id="__widget_id__" data-view="__WidgetClass__" data-*="__any_atribute__"></div>


"""
