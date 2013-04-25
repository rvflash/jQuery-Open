/**
 * jQuery Open plugin
 *
 * @desc Enable to open links in iframe with loading message, in ajax, in current view or in a new window
 * @version 1.1.0
 * @author Hervé GOUCHET
 * @author Julien LEFEVRE
 * @use jQuery 1.7+
 * @licenses Creative Commons BY-SA 2.0
 * @see https://github.com/rvflash/jQuery-Open
 */
;
(function($)
{
    var _workspace = {
        data : {
            id : '_openid',
            loaded : '_openloaded'
        },
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
        autoload : false,
        browser : {
            name : '_openbrowser',
            error : {
                name : '_openfailure',
                content : 'An error was occured. Please to retry later.',
                enable : true
            },
            closure : {
                class : '_close',
                content : 'X',
                enable : false
            },
            loading : {
                name : '_openloader',
                content : 'Please be patient, loading ...',
                enable : true
            },
            displayInline : false,
            outerClosure : false,
            maxTab : 5
        },
        ajax : {
            toggle : true,
            onLoaded : null,
            onView : null,
            onExit : null
        },
        iframe : {
            options : {
                src : '',
                scrolling : 'auto',
                frameborder : 0
            },
            onLoaded : null,
            onView : null,
            onExit : null
        },
        popup : {
            options : {
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
            onExit : null
        },
        window : {
            onExit : null
        }
    };

    var open = function (elem, settings)
    {
        if (null == elem.data(_workspace.data.id)) {
            elem.data(_workspace.data.id, '_open' + Math.floor((Math.random() * 1001) + 1));
        }
        settings.name = elem.data(_workspace.data.id);

        // Type of
        var type;
        if (elem.hasClass(_workspace.type.self)) {
            type = _workspace.type.self;
        } else if (elem.hasClass(_workspace.type.blank)) {
            type = _workspace.type.blank;
        } else if (elem.hasClass(_workspace.type.iframe)) {
            type = _workspace.type.iframe;
        } else if (elem.hasClass(_workspace.type.ajax)) {
            type = _workspace.type.ajax;
        } else {
            type = settings.type;
        }

        var url;
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

    var close = function(elem, browser, settings)
    {
        // Apply callback function on exit
        if ($.isFunction(settings.onExit)) {
            settings.onExit(elem.attr('id'));
        }
        elem.hide();

        // Active browser ?
        if (0 == browser.children('div:visible').length) {
            browser.removeClass(_workspace.data.loaded);
        }
    };

    var outerClosure = function (e, settings)
    {
        var clicked = $(e.target);
        var browser = $('#' + settings.browser.name);
        var elem = browser.children('div:visible');

        if (0 < elem.length && clicked[0] != elem[0] && 0 == clicked.parents("#" + elem.attr('id')).length) {
            if (elem.children('iframe').length) {
                close(elem, browser, settings.iframe);
            } else {
                close(elem, browser, settings.ajax);
            }
        }
    };

    var _ajax = function (url, settings)
    {
        _buildBrowser(settings);

        if (null == $('#' + settings.name).data(_workspace.data.loaded)) {
            return $.get(url, function(data)
            {
                $('#' + settings.name).append(data);
            }).success(function()
            {
                _loadedView(settings, _workspace.type.ajax);
            }).error(function()
            {
                if (settings.browser.error.enable) {
                    $('#' + settings.browser.error.name).show().delay(1000).hide();
                }
            });
        }
        return _loadedView(settings, _workspace.type.ajax);
    };

    var _iframe = function(url, settings)
    {
        _buildBrowser(settings);

        if (null == $('#' + settings.name).data(_workspace.data.loaded)) {
            var properties = [];
            for (var opts in settings.iframe.options) {
                properties.push(opts + ' = "' + settings.iframe.options[opts] + '"');
            }
            $('#' + settings.name).append('<iframe ' + properties.join(' ') + '></iframe>');
        }

        var iframe = $('#' + settings.name + ' > iframe');
        if (settings.browser.loading.enable) {
            if ('' == iframe.attr('src')) {
                return iframe.attr('src', url).load(function() {
                    _loadedView(settings, _workspace.type.iframe);
                });
            }
        } else if ('' == iframe.attr('src')) {
            iframe.attr('src', url);
        }
        return _loadedView(settings, _workspace.type.iframe);
    };

    var _popup = function(url, settings)
    {
        var header = [];
        var options = settings.popup.options;
        options.height = (screen.height * 0.80);
        options.width = (screen.width * 0.80);

        if (options.width < _workspace.popup.height) {
            options.height = _workspace.popup.height;
        }
        if (options.height < _workspace.popup.width) {
            options.width = _workspace.popup.width;
        }
        for (var opts in options) {
            header.push(opts + '=' + options[opts]);
        }
        if ($.isFunction(settings.popup.onExit)) {
            settings.popup.onExit(settings.popup.name);
        }
        return window.open(url, settings.name, header.join(','));
    };

    var _redirect = function(url, settings)
    {
        if ($.isFunction(settings.window.onExit)) {
            settings.window.onExit(settings.name);
        }
        return window.location.href = url;
    };

    var _buildBrowser = function(settings)
    {
        _workspace.onView = settings.name;

        // Build environment
        if (0 == $('#' + settings.browser.name).length) {
            $(document.body).append('<div id="' + settings.browser.name + '"></div>');
        }
        // Display loading message
        if (settings.browser.loading.enable) {
            if (0 == $('#' + settings.browser.loading.name).length) {
                $(document.body).append(
                    '<div id="' + settings.browser.loading.name + '">' + settings.browser.loading.content + '</div>'
                );
            } else {
                $('#' + settings.browser.loading.name).show();
            }
        }
        // Display error message
        if (settings.browser.error.enable) {
            if (0 == $('#' + settings.browser.error.name).length) {
                $(document.body).append(
                    '<div id="' + settings.browser.error.name + '">' + settings.browser.error.content + '</div>'
                );
            }
            $('#' + settings.browser.error.name).hide();
        }
        // Check available tabs
        if (0 == $('#' + settings.name).length) {
            // Keep a maximum number of ajax container in DOM
            var browser = $('#' + settings.browser.name + ' > div');
            if (settings.browser.maxTab <= browser.length) {
                browser.filter(':first').remove();
            }
            var x = '';
            if (settings.browser.closure.enable) {
                x = '<div class="' + settings.browser.closure.class + '">' + settings.browser.closure.content + '</div>';
            }
            $('#' + settings.browser.name).append('<div id="' + settings.name + '">' + x + '</div>');
        }
        $('#' + settings.browser.name + ' > div').hide();
    };

    var _loadedView = function(settings, type)
    {
        if (_workspace.onView != settings.name) {
            return;
        }
        // Hide loading message
        if (settings.browser.loading.enable) {
            $('#' + settings.browser.loading.name).hide();
        }
        // Open viewer
        var elem = $('#' + settings.name);
        var browser = $('#' + settings.browser.name);
        if (_workspace.type.ajax == type && settings.toggle && elem.is(':visible')) {
            close(elem, browser, settings);
        } else {
            if (settings.browser.displayInline) {
                elem.show();
            } else {
                elem.css('display', 'block');
            }
            browser.addClass(_workspace.data.loaded);

            var options;
            if (elem.children('iframe').length) {
                options = settings.iframe;
            } else {
                options = settings.ajax;
            }

            // Apply callback function on first loading
            if (null == elem.data(_workspace.data.loaded)) {
                if ($.isFunction(options.onLoaded)) {
                    options.onLoaded(settings.name);
                }
                elem.data(_workspace.data.loaded, true);
            }
            // Apply callback function on each view
            if ($.isFunction(options.onView)) {
                options.onView(settings.name);
            }
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
        var url;
        if (null != (url = _getUrl(elem))) {
            // Convert hash tag as query string in order to send ajax call
            if (
                (elem.hasClass(_workspace.type.ajax) || _workspace.type.ajax == settings.type) &&
                -1 != url.indexOf('#')
            ) {
                url = url.replace('#', (-1 != url.indexOf('?') ? '&' : '?'));
            }
            // Add optional parameters
            if (null != elem.data('arg')) {
                url += (-1 != url.indexOf('?') ? '&' : '?') + elem.data('arg');
            }
            // Extend with an unique identifier
            if (elem.hasClass(_workspace.uniqueIdentifier)) {
                url += (-1 != url.indexOf('?') ? '&' : '?') + '_i=' + new Date().getTime();
            }
        }
        return url;
    };

    var _getUrl = function(elem)
    {
        if ('undefined' !== typeof elem.attr('href')) {
            return elem.attr('href'); // <a href='http://...'>
        } else if ('undefined' !== typeof elem.data('url')) {
            return elem.data('url'); // <span data-url='http://...'>
        } else if ('undefined' !== typeof elem.data('erl')) {
            return _rot13(elem.data('erl')); // <span data-erl='uggc://...'>
        } else if ('undefined' !== typeof elem.data('nrl')){
            var sNrl = elem.data('nrl'); // <span data-nrl='http://... ou uggc://...'>
            if (-1 !== sNrl.indexOf('uggc:')) {
                return _rot13(sNrl);
            }
            return sNrl;
        } else if ('undefined' !== typeof elem.data('irl')){
            return _getUrl($('#' + elem.data('irl'))); // <span data-irl='myId'> goto element with url path
        }
        return null;
    };

    $.open = function(pattern, settings)
    {
        var options;
        if ('undefined' != typeof settings) {
            options = $.extend(true, {}, _defaults, settings);
        } else {
            options = _defaults;
        }
        $(options.container).on('click', pattern, function(e)
        {
            e.preventDefault();
            open($(this), options);
        }).on('click', '#' + options.browser.name + ' .' + options.browser.closure.class, function()
        {
            if (options.browser.closure.enable) {
                var elem = $(this).parent();
                if (elem.children('iframe').length) {
                    close(elem, $('#' + options.browser.name), options.iframe);
                } else {
                    close(elem, $('#' + options.browser.name), options.ajax);
                }
            }
        }).on('click', function(e)
        {
            if (options.browser.outerClosure) {
                outerClosure(e, options);
            }
        });
        if (options.autoload) {
            open($(pattern).filter(':first'), options);
        }
    };
})(jQuery);