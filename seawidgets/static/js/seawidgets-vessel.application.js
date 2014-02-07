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
            // refresh other widgets
            receiveData(['map','position', 'speed', 'cog', 'sog','depth'], data);
        });
        $.getJSON('/vessel/current_termosal.json', function(data) {
            // refresh widgets with termosal information
            receiveData(['sea_water_temperature', 'sea_water_salinity', 'sea_water_electrical_conductivity', 'fluor'],data);
            if (data.error){
                $("#last-vessel-termosal").html('Error: ' + data.error);
            } else {
                $("#last-vessel-termosal").html('Updated at ' + data.time);
            }
        });
        $.getJSON('/vessel/current_meteo.json', function(data) {
            // refresh widgets with meteo information
            receiveData(['wind_speed', 'wind_speed_mean', 'humidity', 'air_pressure', 'air_temperature', 'sun_radiation','wind_from_direction'],data);
            if (data.error){
                $("#last-vessel-meteo").html('Error: ' + data.error);
            } else {
                $("#last-vessel-meteo").html('Updated at ' + data.time);
            }
        });
    }

    function getFirstData() {
        $.getJSON('/vessel/location.json', function(data) {
            // refresh widgets
            initialData(['position', 'speed', 'cog', 'sog','depth'],data);
        });
        $.getJSON('/vessel/termosal.json', function(data) {
            // refresh widgets with termosal information
            initialData(['sea_water_temperature', 'sea_water_salinity', 'sea_water_electrical_conductivity', 'fluor'],data);
            if (data.error){
                $("#last-vessel-termosal").html('Error: ' + data.error);
            } else {
                $("#last-vessel-termosal").html('Updated at ' + data.time[data.time.length - 1]);
            }
        });
        $.getJSON('/vessel/meteo.json', function(data) {
            // refresh widgets with meteo information
            initialData(['wind_speed', 'wind_speed_mean', 'humidity', 'air_pressure', 'air_temperature', 'sun_radiation','wind_from_direction'],data);
            if (data.error){
                $("#last-vessel-meteo").html('Error: ' + data.error);
            } else {
                $("#last-vessel-meteo").html('Updated at ' + data.time[data.time.length - 1]);
            }
        });
    }


    Dashing.on('ready', function() {
        getFirstData();
        setInterval(refreshData, 6000 * 1); // call every minute
    });



}).call(this);