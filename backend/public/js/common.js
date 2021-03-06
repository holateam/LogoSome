/**
 * Created by lex on 27.10.16.
 */
/* ----------------------------- begin view ----------------------------------*/
var view = {
    msgErr: function (data) {
        $('.msgErr').text(data.msg.msg);
        $('.msgErr').css('visibility', 'visible');
    },
    addLogs: function (logs) {
        logs.forEach(function (li) {
            $("<li>" + li + "</li>").appendTo('ul');
        });
    }
};
/* ------------------------------- end view ----------------------------------*/

/* ------------------------------ begin model --------------------------------*/
var model = {
    signIn: function (data) {
        if (data.success) {
            // user.name = data.data.name;
            // user.host = data.data.host;
            // user.port = data.data.port;
            // user.streamsId = data.data.streamsId;
            var date = new Date(new Date().getTime() + 60 * 10000);
            document.cookie = "token=" + data.data.token + "; path=/; expires=" + date.toUTCString();
            location.href = '/';
        } else {
            view.msgErr(data);
        }
    },
    signUp: function (data) {
        if (data.success) {
            alert('Thank you successfully registered');
            location.href = '/';
        } else {
            view.msgErr(data);
        }

    },
    cookieSession: function (data) {
        console.log("You have cookie: " + JSON.stringify(data));
        // console.log(obj);
        // user = obj;
        // user.reverseDirection = true;
        // user.filters= "";
        // socket.emit('get logs old', user);
    },
    getCookie: function (name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }
};
/* ------------------------------- end model ---------------------------------*/

/* --------------------------- begin controller ------------------------------*/
var controller = {
    signIn: function (event) {
        event.preventDefault();
        var email = $('#email').val();
        var password = $('#password').val();

        $.ajax({
            url: '/api/v1/login',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "email": email,
                "password": password
            }),
            // statusCode: {
            //     403: function(jqXHR) {
            //         var error = JSON.parse(jqXHR.responseText);
            //         console.log('error: ' + JSON.stringify(error));
            //         alert('status: 403' + error);
            //     }
            // },
            success: function (res) {
                console.log('success: ' + JSON.stringify(res));
                model.signIn(res);
            },
            error: function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText);
                console.log(JSON.stringify(error));
            }
        });
    },
    signUp: function (event) {
        event.preventDefault();
        var username = $('#username').val();
        var email = $('#email').val();
        var password = $('#password').val();

        $.ajax({
            type: 'POST',
            url: '/api/v1/registration',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "username": username,
                "email": email,
                "password": password
            }),
            success: function (res) {
                console.log('success: ' + JSON.stringify(res));
                model.signUp(res);
            },
            error: function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText);
                console.log(JSON.stringify(error));
            }
        });

    },
    cookieSession: function (cookie) {
        $.ajax({
            type: 'POST',
            url: '/api/v1/cookie-session',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "cookie": cookie
            }),
            success: function (res) {
                model.cookieSession(res);
            },
            error: function (jqXHR) {
                var error = JSON.parse(jqXHR.responseText);
                console.log(JSON.stringify(error));
            }
        });
    }
};
/* --------------------------- end controller --------------------------------*/

var user = {
    name: "Alex",
    host: 'localhost',
    port: '30000',
    streamsId: ['log', 'sys_log', 'nginx'],
    filter: '',
    reverseDirection: true
};

let socket;
/* ------------------- anonymous initialize function ------------------------ */

(function () {

    var app = {

        init: function () {
            this.main();
            this.event();
        },
        main: function () {
            if (document.cookie) {
                controller.cookieSession(document.cookie);
                view.addLogs(["dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"
                    ,"aasdasddaasdasd","dasdasdasdas","aasdasddaasdasd","dasdasdasdas"]);
                socket = io.connect('http://localhost:3006');
                socket.emit('init', {"token": model.getCookie('token'), "filter": ""});
                socket.on('logs',function (logsForSend, direction) {
                    if (direction == 'older'){
                        view.addLogs(logs);
                    } else if (direction == 'newer'){
                        view.addLogs(logs.reverse());
                    }
                })
            }
        },
        event: function () { // тут навешиваем слушателей на события
            $(document).ready(function () {

                $('#signIn').click(function (event) {
                    controller.signIn(event);
                });
                $('#signUp').click(function (event) {
                    controller.signUp(event);
                });

                $('#dashboard').scroll(function () {
                    var $this = $(this);
                    var scrollTop = $this.scrollTop();
                    var height = $this.height();
                    var scrollHeight = $this[0].scrollHeight;

                    console.log($this.scrollTop());

                    if (scrollTop == 0) {
                        console.log('top found');
                        user.reverseDirection = true;
                        socket.emit('getLogs', "older");
                    }
                    if (scrollTop + height == scrollHeight) {
                        console.log('bottom found');
                        user.reverseDirection = false;
                        socket.emit('getLogs', "newer");
                    }
                });
            });
        }
    };
    app.init();

}());

/* ----------------- end anonymous initialize function ---------------------- */