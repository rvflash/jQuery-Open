/**
 * jQuery Open plugin
 * 
 * @desc Enable to open links in iframe with loading message, in ajax, in current view or in a new window
 * @author Hervé GOUCHET
 * @author Julien LEFEVRE
 * @use jQuery 1.4.3+
 * @licenses Creative Commons BY-SA 2.0
 * @see https://github.com/rvflash/jQuery-Open
 */
; 
(function($)
{
    var _workspace = {
        type : {
            self : 'self',
            blank : 'blank',
            iframe : 'iframe',
            ajax : 'ajax'
        },
        popup : {
            height : 780,
            width : 420
        },
        onView : null,
        uniqueIdentifier : 'unique'
    };

    var _defaults = {
        type : _workspace.type.self,
        container : 'body',
        ajax : {
            name : '_openviewer',
            loading : {
                name : '_opencharger',
                content : 'Please be patient, loading ...',
                enable : true
            },
            error : {
                name : '_openfailure',
                content : 'An error was occured. Please to retry later.',
                enable : true
            },
            displayInline : false,
            toggle : true
        },
        iframe : {
            name : '_openbrowser',
            options : {
                src : '',
                scrolling : 'auto',
                frameborder : 0
            },
            loading : {
                name : '_openloader',
                content : 'Please be patient, loading ...',
                enable : true
            },
            displayInline : false,
            domMaxSize : 5
        },
        popup : {
            scrollbars : 'yes',
            toolbar : 'yes',
            location : 'yes',
            directories : 'yes',
            menubar : 'yes',
            resizable : 'yes',
            status : 'yes',
            top : 0,
            left : 0,
            height : 780,
            width : 420
        },
        onExit : null,
        autoload : false
    };
    
    var open = function (elem, settings)
    {
        if (null == $(elem).data('_openid')) {
            $(elem).data('_openid', '_open' + Math.floor((Math.random() * 1001) + 1));
        }
        settings.name = $(elem).data('_openid');

        // Type of
        if ($(elem).hasClass(_workspace.type.self)) {
            type = _workspace.type.self;
        } else if ($(elem).hasClass(_workspace.type.blank)) {
            type = _workspace.type.blank;
        } else if ($(elem).hasClass(_workspace.type.iframe)) {
            type = _workspace.type.iframe;
        } else if ($(elem).hasClass(_workspace.type.ajax)) {
            type = _workspace.type.ajax;
        } else {
            type = settings.type;
        }
        if (null != (url = _getCompleteUrl(elem, settings))) {
            switch (type) {
                case _workspace.type.ajax:
                    return _ajax(url, settings);
                case _workspace.type.iframe:
                    return _iframe(url, settings);
                case _workspace.type.blank:
                    return _popup(url, settings);
                case _workspace.type.self:
                default:
                    return _redirect(url, settings);
            }
        }
        return false;
    };

    var _ajax = function (url, settings)
    {
        _buildBrowser(settings.name, settings.ajax);

        if (0 == $('#' + settings.name).length) {
            $('#' + settings.ajax.name).append('<div id="' + settings.name + '"></div>');
        } else if (false == settings.ajax.toggle) {
            $('#' + settings.ajax.name + ' > div').hide();
        }

        if ('' == $('#' + settings.name).html()) {
            $('#' + settings.name).hide().html(' ');

            return $.get(url, function(data)
            {
                $('#' + settings.name).html(data);
            }).success(function()
            {
                _loadedView(settings.name, settings.ajax, settings.onExit);
            }).error(function()
            {
                if (settings.ajax.error.enable) {
                    $('#' + settings.ajax.error.name).show().delay(1000).hide();
                }
            });
        }
        return _loadedView(settings.name, settings.ajax, settings.onExit);
    };

    var _iframe = function(url, settings)
    {
        _buildBrowser(settings.name, settings.iframe);

        if (0 == $('#' + settings.name).length) {
            var properties = [];
            var options = $.extend({}, settings.iframe.options, {
                id : settings.name
            });
            for (opts in options) {
                properties.push(opts + ' = "' + options[opts] + '"');
            }
            // Keep a maximum number of iframe in DOM
            var iframes = $('#' + settings.iframe.name + ' > iframe');
            if (settings.iframe.domMaxSize <= iframes.length) {
                iframes.filter(':first').remove();
            }
            $('#' + settings.iframe.name).append('<iframe ' + properties.join(' ') + '></iframe>');
        }
        $('#' + settings.iframe.name + ' > iframe').hide();

        if (settings.iframe.loading.enable) {
            if ('' == $('#' + settings.name).attr('src')) {
                return $('#' + settings.name).attr('src', url).load(function() {
                    _loadedView(settings.name, settings.iframe, settings.onExit);
                });
            }
        } else if ('' == $('#' + settings.name).attr('src')) {
            $('#' + settings.name).attr('src', url);
        }
        return _loadedView(settings.name, settings.iframe, settings.onExit);
    };

    var _popup = function(url, settings)
    {
        var options = settings.popup;
        options.width = (screen.width * 0.80);
        if (options.width < _workspace.popup.height) {
            options.height = _workspace.popup.height;
        }
        options.height = (screen.height * 0.80);
        if (options.height < _workspace.popup.width) {
            options.width = _workspace.popup.width;
        }
        var header = [];
        for (var opts in options) {
            header.push(opts + '=' + options[opts]);
        }
        if ($.isFunction(settings.onExit)) {
            settings.onExit(settings.name);
        }
        return window.open(url, settings.name, header.join(','));
    };

    var _redirect = function(url, settings)
    {
        if ($.isFunction(settings.onExit)) {
            settings.onExit(settings.name);
        }
        return window.location.href = url;
    };

    var _open = function (elem, e, settings)
    {
        e.preventDefault();
        open(elem, settings);
    };

    var _buildBrowser = function(name, options)
    {
        _workspace.onView = name;

        // Build environment
        if (0 == $('#' + options.name).length) {
            $(document.body).append('<div id="' + options.name + '"></div>');
        }
        // Display loading message
        if (options.loading.enable) {
            if (0 == $('#' + options.loading.name).length) {
                $(document.body).append('<div id="' + options.loading.name + '">' + options.loading.content + '</div>');
            } else {
                $('#' + options.loading.name).show();
            }
        }
        // Display error message
        if ('undefined' != typeof options.error && options.error.enable) {
            if (0 == $('#' + options.error.name).length) {
                $(document.body).append('<div id="' + options.error.name + '">' + options.error.content + '</div>');
            }
            $('#' + options.error.name).hide();
        }
    };

    var _loadedView = function(name, options, callback)
    {
        if (_workspace.onView != name) {
            return;
        }
        // Hide loading message
        if (options.loading.enable) {
            $('#' + options.loading.name).hide();
        }
        // Open viewer
        if ('undefined' != typeof options.toggle && options.toggle && $('#' + name).is(':visible')) {
            $('#' + name).hide();
        } else if (options.displayInline) {
            $('#' + name).show();
        } else {
            $('#' + name).css('display', 'block');
        }
        // Apply callback function 
        if ($.isFunction(callback)) {
            callback(name);
        }
    };

    var _rot13 = function(encoded)
    {
        var decoded = new String();
        var a, A, z, Z = new String();
        a = "a"; A = "A"; z = "z"; Z = "Z";

        var i = -1, cc;
        while (i++ < encoded.length - 1) {
            cc = encoded.charCodeAt(i);
            if (cc >= a.charCodeAt() && cc <= z.charCodeAt()) {
                cc = ((cc - a.charCodeAt() + 13) % 26) + a.charCodeAt();
            } else if (cc >= A.charCodeAt() && cc <= Z.charCodeAt()) {
                cc = ((cc - A.charCodeAt() + 13) % 26) + A.charCodeAt();
            }
            decoded += String.fromCharCode(cc);
        }
        return decoded;
    };
    
    var _getCompleteUrl = function(elem, settings)
    {
        if (null != (url = _getUrl(elem))) {
            // Add optional parameters
            if (null != $(elem).data('arg')) {
                url += (-1 != url.indexOf('?') ? '&' : '?') + $(elem).data('arg');
            }
            // Extend with an unique identifier
            if ($(elem).hasClass(_workspace.uniqueIdentifier)) {
                url += (-1 != url.indexOf('?') ? '&' : '?') + '_i=' + new Date().getTime();
            }
        }
        return url;
    };

    var _getUrl = function(elem)
    {
        if ('undefined' !== typeof $(elem).attr('href')) {
            return $(elem).attr('href'); // <a href='http://...'>
        } else if ('undefined' !== typeof $(elem).data('url')) {
            return $(elem).data('url'); // <span data-url='http://...'>
        } else if ('undefined' !== typeof $(elem).data('erl')) {
            return _rot13($(elem).data('erl')); // <span data-erl='uggc://...'>
        } else if ('undefined' !== typeof $(elem).data('nrl')){
            var sNrl = $(elem).data('nrl'); // <span data-nrl='http://... ou uggc://...'>
            if (-1 !== sNrl.indexOf('uggc:')) {
                return _rot13(sNrl);
            }
            return sNrl;
        } else if ('undefined' !== typeof $(elem).data('irl')){
            return _getUrl($('#' + $(elem).data('irl'))); // <span data-irl='myId'> goto element with url path
        }
        return null;
    };

    $.open = function(elem, settings)
    {
        var options = $.extend(true, {}, defaults, settings);
        $(options.container).delegate(elem, 'click', function(e)
        {
            _open(this, e, options);
        });
    };

    $.fn.open = function(settings)
    {
        var options = $.extend(true, {}, _defaults, settings);
        $(this).bind('click', function(e)
        {
            _open(this, e, options);
        });
        if (options.autoload) {
            open($(this).filter(':first'), options);
        }
    };
})(jQuery);
