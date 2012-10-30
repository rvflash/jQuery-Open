/**
 * jQuery Open plugin
 * 
 * @desc Enable to open links in iframe with loading message, in current view or
 *       in a new window
 * @author Hervé GOUCHET
 * @author Julien LEFEVRE
 * @requires jQuery 1.4.3+
 * @licenses Creative Commons BY-SA 2.0
 * @see https://github.com/rvflash/jQuery-Open
 */
;
(function($) {
    var _workspace = {
        type : {
            self : 'self',
            blank : 'blank',
            iframe : 'iframe'
        },
        onview : null,
        addUniqueIdentifierClass : 'unique'
    };

    var _defaults = {
        type : _workspace.type.self, // self or blank or iframe, can be
        container : 'body',
        // overload by className
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

    var open = function(elem, settings) {
        // Generate unique identifier
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
        } else {
            type = settings.type;
        }
        if (null != (url = _url(elem, settings))) {
            switch (type) {
            case _workspace.type.iframe:
                return _iframe(url, settings);
            case _workspace.type.blank:
                return _popup(url, settings);
            case _workspace.type.self:
            default:
                return _redirect(url, settings);
            }
        }
    };

    var _iframe = function(url, settings) {
        _workspace.onview = settings.name;

        // Build environment
        if (0 == $('#' + settings.iframe.name).length) {
            $(document.body).append('<div id="' + settings.iframe.name + '"></div>');
        }
        // Display loading message
        if (settings.iframe.loading.enable) {
            if (0 == $('#' + settings.iframe.loading.name).length) {
                $(document.body).append('<div id="' + settings.iframe.loading.name + '">' + settings.iframe.loading.content + '</div>');
            } else {
                $('#' + settings.iframe.loading.name).show();
            }
        }
        // Build iframe for this link
        if (0 == $('#' + settings.name).length) {
            var properties = [];
            var options = $.extend({}, settings.iframe.options, {
                id : settings.name
            });
            for (opts in options) {
                properties.push(opts + ' = "' + options[opts] + '"');
            }
            var iframes = $('#' + settings.iframe.name + ' iframe');
            if (settings.iframe.domMaxSize <= iframes.length) {
                iframes.filter(':first').remove();
            }
            $('#' + settings.iframe.name).append('<iframe ' + properties.join(' ') + '></iframe>');
        }
        $('#' + settings.iframe.name + ' iframe').hide();

        // Redirect to
        if (settings.iframe.loading.enable) {
            if ('' == $('#' + settings.name).attr('src')) {
                return $('#' + settings.name).attr('src', url).load(function() {
                    _iframeOpened(settings);
                });
            }
        }
        return _iframeOpened(settings);
    };

    var _iframeOpened = function(settings) {
        if (_workspace.onview != settings.name) {
            return;
        }
        if (settings.iframe.loading.enable) {
            $('#' + settings.iframe.loading.name).hide();
        }
        if (settings.iframe.displayInline) {
            $('#' + settings.name).show();
        } else {
            $('#' + settings.name).css('display', 'block');
        }
        if ($.isFunction(settings.onExit)) {
            settings.onExit(settings.name);
        }
    };

    var _popup = function(url, settings) {
        var options = settings.popup;
        options.width = (screen.width * 0.80);
        if (options.width < 780) {
            settings.popup.width = 780;
        }
        options.height = (screen.height * 0.80);
        if (options.height < 420) {
            settings.popup.height = 420;
        }
        var header = [];
        for (opts in options) {
            header.push(opts + '=' + options[opts]);
        }
        if ($.isFunction(settings.onExit)) {
            settings.onExit(settings.name);
        }
        return window.open(url, options.name, header.join(','));
    };

    var _redirect = function(url, settings) {
        if ($.isFunction(settings.onExit)) {
            settings.onExit(settings.name);
        }
        return window.location.href = url;
    };

    var _url = function(elem, settings) {
        if (undefined != $(elem).attr('href')) {
            url = $(elem).attr('href');
        } else if (null != $(elem).data('url')) {
            url = $(elem).data('url');
        } else if (null != $(elem).data('erl')) {
            url = _rot13($(elem).data('erl'));
        } else if (null !== $(elem).data('nrl')){
            var sNrl = $(elem).data('nrl');
            if (-1 !== sNrl.indexOf('uggc')) {
                url = _rot13(sNrl);
            } else {
                url = sNrl;
            }
        }
        else
        {
            return null;
        }
        if ($(elem).hasClass(_workspace.addUniqueIdentifierClass)) {
            url += (-1 != url.indexOf('?') ? '&' : '?') + '_i=' + new Date().getTime();
        }
        return url;
    };

    var _rot13 = function(encoded) {
        var decoded = new String();
        var a, A, z, Z = new String();
        a = "a";
        A = "A";
        z = "z";
        Z = "Z";

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

    $.open = function(sSelector, settings) {
        var settings = $.extend(_defaults, settings);
        // Using delegate on body
        $(settings.container).delegate(sSelector, 'click', function(e){
            e.preventDefault();
            open(this, settings);
        });
    };

    $.fn.open = function(settings) {

        var settings = $.extend(_defaults, settings);

        if (settings.autoload) {
            open($(this).filter(':first'), settings);
        }
        $(this).bind('click', function(e) {
            e.preventDefault();
            open(this, settings);
        });

    };

})(jQuery);
