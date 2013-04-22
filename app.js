/**
 * Module dependencies.
 */
var express = require('express'),
    jsdom = require('jsdom'),
    request = require('request'),
    url = require('url'),
    app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware({
        src: __dirname + '/public'
    }));
    app.use(app.router);
    //app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes
app.get('/', function (req, res) {
    res.render('index', {
        title: 'Express'
    });
});


// app.get('/public', function (req,res) {
//     res.render('public', {
//       title: 'Public',
//       assets: ['img','js']
//     });
// });

app.get('/eztv', function (req, res) {
    //Tell the request that we want to fetch URL, send the results to a callback function
    request({
        uri: 'http://eztv.it'
    }, function (err, response, body) {
        var self = this;
        self.items = new Array(); // Store results in array


        //Just a basic error check
        if (err && response.statusCode !== 200) {
            console.log('Request error.');
        }
        //Send the body param as the HTML code we will parse in jsdom
        //also tell jsdom to attach jQuery in the scripts
        jsdom.env({
            html: body,
            scripts: ['http://code.jquery.com/jquery-1.6.min.js']
        }, function (err, window) {
            //Use jQuery just as in any regular HTML page
            var $ = window.jQuery,
                $body = $('body'),
                $torlinks = $body.find('.epinfo');
            //I know .video-entry elements contain the regular sized thumbnails

            //for each one of those elements found
            $torlinks.each(function (i, item) {
                var $a = $(item);
                var $m = $(item).parent().siblings('.forum_thread_post').find('.magnet')
                self.items[i] = {
                    linktext: $a.text(),
                    linkurl:  $m.attr('href'),
                    //thumbnail:'http:'+$m.css('backgroundImage').replace(/^url|[\(\)]/g, '')
                    thumbnail:'img/icon-torrent.png'
                };
            });
            console.log(self.items);
            //We have all we came for, now let's build our views
            res.render('list', {
                title: 'EZTV Links',
                items: self.items
            });
        });
    });
});

//Pass the video id to the video view
app.get('/watch/:id', function (req, res) {
    res.render('video', {
        title: 'Watch',
        vid: req.params.id
    });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);