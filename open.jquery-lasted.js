/**
 * jQuery Open plugin
 *
 * @desc Enable to open links in iframe with loading message, in ajax, in current view or in a new window.
 * @desc Add possibility to open content in a confirm or dialog box.
 * @version 1.3.6
 * @author Hervé GOUCHET
 * @author Aurélie Le Bouguennec
 * @use jQuery 1.7+
 * @licenses Creative Commons BY-SA 2.0
 * @see https://github.com/rvflash/jQuery-Open
 * @note Now use Event as only one parameter passed to callback methods.
 *       Event has new property currentHref with url decoded as string inside
 */
;
(function($)
{
    var _workspace = {
        data : {
            base: null,
            id : '_openid',
            loaded : '_openloaded',
            loading : '_openloading'
        },
        type : {
            base : null,
            self : 'self',
            blank : 'blank',
            iframe : 'iframe',
            ajax : 'ajax',
            confirm : 'confirm'
        },
        popup : {
            height : 780,
            width : 420
        },
        confirm : {
            staticName : '_confirm'
        },
        noCloseIdentifier : 'noClose',
        uniqueIdentifier : 'unique',
        visibleIdentifier : 'visible',
        notOutIdentifier : 'notouter',
        disableIdentifier : 'sleeping'
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
                name : '_close',
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
        confirm : {
            title : null,
            content : null,
            name : "opConfirm",
            onSuccess : null,
            onCancel : null,
            buttons : {
                name : "confirmBts",
                successLabel : "Ok",
                cancelLabel : "Cancel"
            },
            modal : true,
            modalClass : 'modal',
            autoClose : false,
            onView : null,
            onExit : null
        },
        window : {
            onExit : null
        }
    };

    var open = function (e, settings)
    {
        e.preventDefault();

        // Clone event to prevent overloading
        e = $.extend(true, {}, e);

        var elem = $(e.currentTarget);
        if ('undefined' == typeof elem.data(_workspace.data.id)) {
            elem.data(_workspace.data.id, '_open' + Math.floor((Math.random() * 1001) + 1));
        }
        _workspace.data.base = elem.data(_workspace.data.id);

        // Type of browser to used
        if (elem.hasClass(_workspace.type.self)) {
            _workspace.type.base = _workspace.type.self;
        } else if (elem.hasClass(_workspace.type.blank)) {
            _workspace.type.base = _workspace.type.blank;
        } else if (elem.hasClass(_workspace.type.iframe)) {
            _workspace.type.base = _workspace.type.iframe;
        } else if (elem.hasClass(_workspace.type.ajax)) {
            _workspace.type.base = _workspace.type.ajax;
        } else {
            _workspace.type.base = _workspace.type.self;
        }

        if (null != (e.currentHref = _getCompleteUrl(elem, settings)) && settings.type != _workspace.type.confirm) {
            switch (_workspace.type.base) {
                case _workspace.type.ajax:
                    return _ajax(e, settings);
                case _workspace.type.iframe:
                    return _iframe(e, settings);
                case _workspace.type.blank:
                    return _popup(e, settings);
                case _workspace.type.confirm:
                    return _confirm(e, settings);
                default:
                    return _redirect(e, settings);
            }
        }

        if(settings.type == _workspace.type.confirm){
            _workspace.type.base = _workspace.type.confirm;
            return _confirm(e, settings);
        }
        return false;
    };

    var close = function(e, settings)
    {
        // Apply callback function on exit
        if ($.isFunction(settings[settings.type].onExit)) {
            settings[settings.type].onExit(e);
        }
        $(e.currentTab).hide().removeClass(_workspace.visibleIdentifier);

        // Has active browser ?
        var browser = $('#' + settings.browser.name);
        if (0 == browser.children('.' + _workspace.visibleIdentifier).length) {
            browser.removeClass(_workspace.data.loaded);
        }
        if(browser.hasClass(settings.confirm.modalClass)){
            browser.removeClass(settings.confirm.modalClass);
        }
    };

    var outerClosure = function (e, opener, settings)
    {
        if(true == $('div.' + _workspace.visibleIdentifier).hasClass(_workspace.noCloseIdentifier)) return false;

        var clicked = $(e.target);
        var elem = $('#' + settings.browser.name + ' div.' + _workspace.visibleIdentifier);

        if (0 < elem.length && 0 == clicked.closest('.'+_workspace.notOutIdentifier).length) {
            opener = clicked.parents(opener).first();
            if (0 < opener.length) {
                clicked = opener;
            }
            if (null == (opener = clicked.data(_workspace.data.id))) {
                opener = $('#' + opener);
            }
            if (0 == opener.length && clicked[0] != elem[0] && 0 == clicked.parents("#" + elem.attr('id')).length) {
                if (elem.children('iframe').length) {
                    _workspace.type.base = _workspace.type.iframe;
                } else if (elem.hasClass(_workspace.confirm.staticName)) {
                    _workspace.type.base = _workspace.type.confirm;
                } else {
                    _workspace.type.base = _workspace.type.ajax;
                }
                e.currentTab = elem[0];
                close(e, settings);
            }
        }
    };

    var _ajax = function (e, settings)
    {
        if (true !== $('#' + settings.name).data(_workspace.data.loading)) {
            _buildBrowser(e, settings);

            if (true !== $('#' + _workspace.data.base).data(_workspace.data.loaded)) {
                $('#' + settings.name).data(_workspace.data.loading, true);

                return $.get(e.currentHref, function(data)
                {
                    $('#' + settings.name).data(_workspace.data.loading, false);
                    $('#' + _workspace.data.base).append(data);
                }).success(function()
                    {
                        _loadedView(e, settings);
                    }).error(function()
                    {
                        if (settings.browser.error.enable) {
                            $('#' + settings.browser.error.name).show().delay(1000).hide();
                        }
                    }).always(function()
                    {
                        $(e.currentTarget).removeClass(_workspace.disableIdentifier);
                    });
            }

            return _loadedView(e, settings);
        }
    };

    var _iframe = function(e, settings)
    {
        _buildBrowser(e, settings);

        if (true !== $('#' + _workspace.data.base).data(_workspace.data.loaded)) {
            var properties = [];
            for (var opts in settings.iframe.options) {
                properties.push(opts + ' = "' + settings.iframe.options[opts] + '"');
            }
            $('#' + _workspace.data.base).append('<iframe ' + properties.join(' ') + '></iframe>');
        }

        var iframe = $('#' + _workspace.data.base + ' > iframe');
        if (settings.browser.loading.enable) {
            if ('' == iframe.attr('src')) {
                return iframe.attr('src', e.currentHref).load(function() {
                    _loadedView(e, settings);
                });
            }
        } else if ('' == iframe.attr('src')) {
            iframe.attr('src', e.currentHref);
        }
        return _loadedView(e, settings);
    };

    var _popup = function(e, settings)
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
        return window.open(e.currentHref, _workspace.data.base, header.join(','));
    };

    var _redirect = function(e, settings)
    {
        if ($.isFunction(settings.window.onExit)) {
            settings.window.onExit(e);
        }
        return window.location.href = e.currentHref;
    };

    var _confirm = function(e, settings)
    {
        _buildBrowser(e,settings);
        var container = $('#' + _workspace.data.base);

        if (container.children('.' + _workspace.type.confirm + 'Content').length == 0) {
            container.addClass(settings.confirm.name).addClass(_workspace.confirm.staticName);

            if(null == settings.confirm.content) return false;

            if(null != settings.confirm.title) {
                var ctTitle = $('<h1 class="'+ _workspace.type.confirm + 'Title">' + settings.confirm.title + '</h1>');
                container.append(ctTitle);
            }
            container.append('<div class="'+ _workspace.type.confirm + 'Content">' + settings.confirm.content + '</div>');


            var eEvent = e;
            var oSettings = settings;

            //create confirm buttons
            if(null != settings.confirm.onSuccess) {
                container.addClass(_workspace.noCloseIdentifier);
                var btContainer = $('<div class="'+ settings.confirm.buttons.name +'"></div>');
                var btOk = $('<button class="cfOk">'+ settings.confirm.buttons.successLabel +'</button>');
                btContainer.append(btOk);
                btOk.click(function(){
                    if ($.isFunction(oSettings.confirm.onSuccess)) {
                        oSettings.confirm.onSuccess(eEvent);
                    }
                    close(eEvent, oSettings);
                });

                var btCancel = $('<button class="cfCancel">'+ settings.confirm.buttons.cancelLabel +'</button>');
                btContainer.append(btCancel);
                btCancel.click(function(){
                    if ($.isFunction(oSettings.confirm.onCancel)) {
                        oSettings.confirm.onCancel(eEvent);
                    }
                    close(eEvent, oSettings);
                });
                container.append(btContainer);
            }
        }

        // add class for modal
        var browser = $('#' + settings.browser.name);
        if(settings.confirm.modal) browser.addClass(settings.confirm.modalClass);

        //activate autoClose
        if('number' == typeof settings.confirm.autoClose ) {
            setTimeout(function(){ close(eEvent, oSettings); }, oSettings.confirm.autoClose);
        }

        return _loadedView(e, settings);
    };

    var _buildBrowser = function(e, settings)
    {
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
        if (0 == $('#' + _workspace.data.base).length) {
            // Keep a maximum number of ajax container in DOM
            var browser = $('#' + settings.browser.name + ' > div');
            if (settings.browser.maxTab <= browser.length) {
                browser.filter(':first').remove();
            }
            var x = '';
            if (settings.browser.closure.enable) {
                x = '<div class="' + settings.browser.closure.name + '">' + settings.browser.closure.content + '</div>';
            }
            $('#' + settings.browser.name).append('<div id="' + _workspace.data.base + '">' + x + '</div>');
        }
        _closeIt(e, $('#' + settings.browser.name + ' > div.visible'), true);
    };

    var _loadedView = function(e, settings)
    {
        // Hide loading message
        if (settings.browser.loading.enable) {
            $('#' + settings.browser.loading.name).hide();
        }
        var elem = $('#' + _workspace.data.base);
        e.currentTab = elem[0];

        if (
            _workspace.type.ajax == _workspace.type.base && settings.ajax.toggle &&
                elem.hasClass(_workspace.visibleIdentifier)
            ) {
            close(e, settings);
        } else {
            // Tag browser as enabled
            $('#' + settings.browser.name).addClass(_workspace.data.loaded);

            // Show dedicated tabs
            if (settings.browser.displayInline) {
                elem.show();
            } else {
                elem.css('display', 'block');
            }
            elem.addClass(_workspace.visibleIdentifier);

            // Apply callback function on first loading
            if (true !== elem.data(_workspace.data.loaded)) {
                if ($.isFunction(settings[_workspace.type.base].onLoaded)) {
                    settings[_workspace.type.base].onLoaded(e);
                }
                elem.data(_workspace.data.loaded, true);
            }
            // Apply callback function on each view
            if ($.isFunction(settings[_workspace.type.base].onView)) {
                settings[_workspace.type.base].onView(e);
            }
        }

        if (settings.browser.closure.enable) {
            $(e.currentTab).find('.' + settings.browser.closure.name).data('base', {
                data: _workspace.data.base,
                type: _workspace.type.base
            });
        }

        if('undefined' == typeof window.jOpenSettings) {
            window.jOpenSettings = [];
        }
        window.jOpenSettings[_workspace.data.base] = settings;
        window.jOpenSettings[_workspace.data.base].type = _workspace.type.base;
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
            if (_workspace.type.ajax == _workspace.type.base && -1 != url.indexOf('#')) {
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

    var _closeIt = function (e, elem, force)
    {
        if ('undefined' == typeof force) {
            force = false;
        }
        e.currentTab = elem;
        if (e.currentTab.hasClass(_workspace.visibleIdentifier)) {
            var oCloseBt = elem.find('.' + _defaults.browser.closure.name);
            if(undefined != oCloseBt.data('base')){
                var base = oCloseBt.data('base');
                var options;
                if('undefined' != typeof window.jOpenSettings && 'undefined' != typeof window.jOpenSettings[base.data]){
                    options = window.jOpenSettings[base.data];
                }
                if(undefined !=  base.data) {
                    options.data = base.data;
                }
            }
            if(force){
                e.autoClosed = true;
            }
            if (force || options.browser.closure.enable) {
                close(e, options);
            }
        }
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
            var sNrl = elem.data('nrl'); // <span data-nrl='http://... ou uggc://... and https'>
            if (-1 !== sNrl.indexOf('uggc:') || -1 !== sNrl.indexOf('uggcf:')) {
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
            if (false == $(this).hasClass(_workspace.disableIdentifier)) {
                open(e, options);
            } else {
                e.preventDefault();
            }
            if (false == $(this).hasClass(_workspace.type.blank) && false == $(this).hasClass(_workspace.type.self)
                && (options.type == _workspace.type.ajax || $(this).hasClass(_workspace.type.ajax))
                && (undefined == $(this).data(_workspace.data.id) || $('#'+$(this).data(_workspace.data.id)).length == 0
                || true != $('#'+$(this).data(_workspace.data.id)).data(_workspace.data.loaded))) {
                $(this).addClass(_workspace.disableIdentifier);
            }
        }).on('click', '#' + options.browser.name + ' .' + options.browser.closure.name, function(e)
            {
                _closeIt(e, $(this).parent());
            }).on('click', function(e)
            {
                if (options.browser.outerClosure) {
                    outerClosure(e, pattern, options);
                }
            });
        if (options.autoload) {
            var e = $.Event('click');
            e.currentTarget = $(pattern).filter(':first');
            open(e, options);
        }
    };
})(jQuery);
