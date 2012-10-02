/**
 * jQuery Open plugin
 * 
 * @desc Enable to open links in iframe with loading message, in current view or
 *       in a new window
 * @author Hervé GOUCHET
 * @requires jQuery 1.4.3+
 * @licenses Creative Commons BY-SA 2.0
 * @see https://github.com/rvflash/jQuery-Open
 */
;
(function($) {
    var OPEN_IN_VIEW = 'self';
    var OPEN_IN_WINDOW = 'blank';
    var OPEN_IN_FRAME = 'iframe';

    var open = function(elem, settings) {
        // Generate unique identifier
        if (null == $(elem).data('_openid')) {
            $(elem).data('_openid',
                    '_open' + Math.floor((Math.random() * 1001) + 1));
        }
        settings.name = $(elem).data('_openid');

        // Url to redirect
        if (undefined != $(elem).attr('href')) {
            url = $(elem).attr('href');
        } else if (null != $(elem).data('url')) {
            url = $(elem).data('url');
        } else {
            return;
        }
        // Type of
        if ($(elem).hasClass(OPEN_IN_VIEW)) {
            type = OPEN_IN_VIEW;
        } else if ($(elem).hasClass(OPEN_IN_WINDOW)) {
            type = OPEN_IN_WINDOW;
        } else if ($(elem).hasClass(OPEN_IN_FRAME)) {
            type = OPEN_IN_FRAME;
        } else {
            type = settings.type;
        }
        // Prevent exit ?
        if ($.isFunction(settings.onExit)) {
            settings.onExit(_self);
        }
        // Redirect to
        if (OPEN_IN_WINDOW == type) {
            return popup(url, settings);
        } else if (OPEN_IN_FRAME == type) {
            return iframe(url, settings);
        } else {
            return window.location.href = url;
        }
    };

    var iframe = function(url, settings) {
        // Build environment
        if (0 == $('#' + settings.iframe.name).length) {
            $(document.body).append(
                    '<div id="' + settings.iframe.name + '"></div>');
        }
        // Display loading message
        if (settings.iframe.loading.enable) {
            if (0 == $('#' + settings.iframe.loading.name).length) {
                $(document.body).append(
                        '<div id="' + settings.iframe.loading.name + '">'
                                + settings.iframe.loading.content + '</div>');
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
            $('#' + settings.iframe.name).append(
                    '<iframe ' + properties.join(' ') + '></iframe>');
        }
        $('#' + settings.iframe.name + ' iframe').hide();

        // Redirect to
        if (settings.iframe.loading.enable) {
            if (undefined == $('#' + settings.name).attr('src')) {
                $('#' + settings.name).attr('src', url).load(function() {
                    $('#' + settings.iframe.loading.name).hide();
                    $(this).show();
                });
            } else {
                $('#' + settings.iframe.loading.name).hide();
            }
        }
        $('#' + settings.name).show();
    };

    var popup = function(url, settings) {
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
        return window.open(url, options.name, header.join(','));
    };

    $.fn.open = function(settings) {
        var defaults = {
            type : OPEN_IN_VIEW, // self or blank or iframe, can be overload
            // by className
            iframe : {
                name : '_openbrowser',
                options : {
                    scrolling : 'auto',
                    frameborder : 0
                },
                loading : {
                    name : '_openloader',
                    content : 'Please be patient, loading ...',
                    enable : true
                }
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
            autoload : true
        };
        var settings = $.extend({}, defaults, settings);

        $(this).bind('click', function(e) {
            e.preventDefault();
            open(this, settings);
        });
        if (settings.autoload) {
            open($(this).filter(':first'), settings);
        }
    };
})(jQuery);