L.Control.ThermosalParameters = L.Control.extend({
    options: {
        position: 'topleft',
        title: 'Thermosal Parameters',
        parameters: [{
            'id': 'temperatura',
            'title': 'sea water temperature',
            'button': 'T'
        }, {
            'id': 'salinidad',
            'title': 'sea water salinity',
            'button': 'S'
        }, {
            'id': 'fluor',
            'title': 'fluor',
            'button': 'F'
        }]
    },
    onAdd: function(map) {
        var className = 'leaflet-control-thermosal-parameters ',
            container;
        container = L.DomUtil.create('div', 'leaflet-bar');

        if (this.options.parameters) {
            for (var i = 0, l = this.options.parameters.length; i < l; i++) {
                this._createButton(this.options.parameters[i].id,
                                   this.options.parameters[i].title,
                                   this.options.parameters[i].button,
                                   className + this.options.parameters[i].id,
                                   container,
                                   this.activeParameter,
                                   map);
            }
        }
        return container;
    },

    _createButton: function(id, title, button, className, container, fn, context) {
        var link = L.DomUtil.create('a', className, container);
        link.href = '#';
        link.title = title;
        link.value = id;
        link.innerHTML = button;

        L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', fn, context);

        return link;
    },

    activeParameter: function(event) {
        if (event.target.active){
            event.target.active = false;
            $(event.target).removeClass('active');
            // Moorings.Overview.onParameterUnselected(event.target.value);
        } else {
            event.target.active = true;
            $('.leaflet-control-thermosal-parameters').removeClass('active');
            $('.leaflet-control-thermosal-parameters').each(function(){
                this.active = false;
            });
            $(event.target).addClass('active');
            this.vesselmap.loadTrajectory(event.target.value);
        }
    }

});

L.Map.addInitHook(function() {
    if (this.options.thermosalParametersControl) {
        this.thermosalParametersControl = L.control.thermosalparameters(this.options.thermosalParametersControl);
        this.addControl(this.thermosalParametersControl);
    }
});

L.control.thermosalparameters = function(options) {
    return new L.Control.ThermosalParameters(options);
};