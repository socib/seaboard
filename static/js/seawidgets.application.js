(function() {
    // Nothing to do, after removing gridster.
    Dashing.on('ready', function() {
        console.log('Dashing ready');
    });
    $.ajaxSetup({ cache: false });


    // Auto refresh the page every two hours, to minimize the risk of application freezing.    
    function refreshPage() {
        var url = '/status.json';
        $.getJSON(url, { "noCache": "noCache" } , function(data) {
            if (data.ok)
                window.location.href = window.location.href;
            else
                ; // server is not responding, do not refresh the page. It will try two hours later
        });
    }
    setInterval(refreshPage, 60000 * 60 * 2 ); // every 2 hours  


}).call(this);