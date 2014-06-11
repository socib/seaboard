var lastLocation, lastTermosal, lastMeteo = null;
(function() {

    function receiveData(variables, data) {
        _.each(variables, function(variable) {
            if (_.has(Dashing.widgets, variable)) {
                _.each(Dashing.widgets[variable], function(widget) {
                    widget.receiveData(data);
                });
            }
        });
    }

    function initialData(variables, data) {
        _.each(variables, function(variable) {
            if (_.has(Dashing.widgets, variable)) {
                _.each(Dashing.widgets[variable], function(widget) {
                    widget.initialData(data);
                });
            }
        });
    }

    // Refresh vessel data, and send it to the widgets
    function refreshData() {
        $.getJSON('/vessel/current_location.json', function(data) {
            lastLocation = data;
            // refresh other widgets
            receiveData(['map','position', 'speed', 'cog', 'sog','depth'], data);
            if (data.error){
                $("#vessel-position").attr('title','Error: ' + data.error);
                $("#vessel-position").addClass('error');
            } else {
                $("#vessel-position").find('.updated-at').html('Updated at ' + data.time);
                $("#vessel-position").removeClass('error');
                $("#vessel-position").attr('title','');
            }
        });
        $.getJSON('/vessel/current_termosal.json', function(data) {
            lastTermosal = data;
            // refresh widgets with termosal information
            receiveData(['termosal', 'sea_water_temperature', 'sea_water_salinity', 'sea_water_electrical_conductivity', 'fluor'],data);
            if (data.error){
                $("#vessel-termosal").attr('title','Error: ' + data.error);
                $("#vessel-termosal").addClass('error');
            } else {
                $("#vessel-termosal").find('.updated-at').html('Updated at ' + data.time);
                $("#vessel-termosal").removeClass('error');
                $("#vessel-termosal").attr('title','');
            }
        });
        $.getJSON('/vessel/current_meteo.json', function(data) {
            lastMeteo = data;
            // refresh widgets with meteo information
            receiveData(['meteo', 'wind_speed', 'wind_speed_mean', 'humidity', 'air_pressure', 'air_temperature', 'sun_radiation','wind_from_direction'],data);
            if (data.error){
                $("#vessel-meteo").attr('title','Error: ' + data.error);
                $("#vessel-meteo").addClass('error');
            } else {
                $("#vessel-meteo").find('.updated-at').html('Updated at ' + data.time);
                $("#vessel-meteo").removeClass('error');
                $("#vessel-meteo").attr('title','');
            }
        });
    }

    function getFirstData() {
        $.getJSON('/vessel/location.json', function(data) {
            // refresh widgets
            initialData(['position', 'speed', 'cog', 'sog','depth'],data);
            if (data.error){
                $("#vessel-position").attr('title','Error: ' + data.error);
                $("#vessel-position").addClass('error');
            } else {
                $("#vessel-position").removeClass('error');
                $("#vessel-position").attr('title','');
            }
        });
        $.getJSON('/vessel/termosal.json', function(data) {
            // refresh widgets with termosal information
            initialData(['termosal', 'sea_water_temperature', 'sea_water_salinity', 'sea_water_electrical_conductivity', 'fluor'],data);
            if (data.error){
                $("#vessel-termosal").attr('title','Error: ' + data.error);
                $("#vessel-termosal").addClass('error');
            } else {
                $("#vessel-termosal").removeClass('error');
                $("#vessel-termosal").attr('title','');
            }
        });
        $.getJSON('/vessel/meteo.json', function(data) {
            // refresh widgets with meteo information
            initialData(['meteo', 'wind_speed', 'wind_speed_mean', 'humidity', 'air_pressure', 'air_temperature', 'sun_radiation','wind_from_direction'],data);
            if (data.error){
                $("#vessel-meteo").attr('title','Error: ' + data.error);
                $("#vessel-meteo").addClass('error');
            } else {
                $("#vessel-meteo").removeClass('error');
                $("#vessel-meteo").attr('title','');
            }
        });
    }


    Dashing.on('ready', function() {
        getFirstData();
        setInterval(refreshData, 10000 * 1); // call every 10 seconds
    });



}).call(this);