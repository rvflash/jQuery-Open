jQuery-Open
===========

Enable various method to open links, as in iframe, in popup or in current window of course.
Can manage all HTML tags with jQuery data "url", data "erl" (link encode with rot13 method) or basically with "a" tag.

## Examples ##

You can also specify 3 type of opening. By default "self", open it in current view, "popup" in new window and "iframe" enable to show url in iframe with loading message:

    $("span.a").open({type: 'blank'});

And, you can specify various properties to extend common behaviors, here for example we open the first element on load: 

    $("span.a").open({type: 'iframe', autoload: true});

Attach events when the element exits of the current view. The DOM element has been passed as first parameter:

    $("a, span.a").open({
        onExit : function (elem){ console.log('Bye'); },
    });

You can use data "erl" to store URL encoded with Rot13 transformation. Perform to obfuscate some links.

Finally you can overload common behavior of a list by adding classname on each element (self, blank or iframe).