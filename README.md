jQuery-Open
===========

Enable various method to open links, as in iframe, in popup or in current window of course. Can manage all HTML tags with jQuery data "url" or basically with "a" tag.

## Examples ##

You can also specify 3 type of opening. By default "self", open it in current view, "popup" in new window and "iframe" enable to show url in iframe with loading message:

    $("span.a").open({type: 'blank'});

And, you can specify various properties to extend common behaviors, here for example we open the first element on load: 

    $("span.a").open({type: 'iframe', autoload: true});

Attach events when the element exits of the current view. The DOM element has been passed as first parameter:

    $("a, span.a").open({
        onExit : function (elem){ console.log('Bye'); },
    });

Finally you can overload common behavior of a list by adding classname on each element (self, blank or iframe): 
    <pre>
        <a href="http://www.twenga.fr">Twenga</a>
        <a href="http://www.google.fr" class="blank">Google</a>
        ...
        $("a").open({type: 'iframe'});
    </pre>
    
In this sample, Twenga will open in iframe and Google in new window.