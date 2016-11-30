/**
 * Created by lex on 27.10.16.
 */
/* ----------------------------- begin view ----------------------------------*/
var view = {
    signIn: function (data) {
        $('.msgErr').text(data.msg.msg);
        $('.msgErr').css('visibility', 'visible');
    }
};
/* ------------------------------- end view ----------------------------------*/

/* ------------------------------ begin model --------------------------------*/
var model = {
    signIn: function (data) {
        console.log("Res:" + JSON.stringify(data));
        if (data.success) {
            console.log(data.data.token);
            // user.name = data.data.name;
            // user.host = data.data.host;
            // user.port = data.data.port;
            // user.streamsId = data.data.streamsId;
            var date = new Date(new Date().getTime() + 60 * 10000);
            document.cookie = "token=" + data.data.token + "; path=/; expires=" + date.toUTCString();
            location.href = '/';
        } else {
            view.signIn(data);
        }
    },
    cookieSession: function (data) {
        console.log("You have cookie: " + JSON.stringify(data));
        // console.log(obj);
        // user = obj;
        // user.reverseDirection = true;
        // user.filters= "";
        // socket.emit('get logs old', user);
    }
};
/* ------------------------------- end model ---------------------------------*/

/* --------------------------- begin controller ------------------------------*/
var controller = {
    signIn: function (event) {
        // event.preventDefault();
        var email = $('#email').val();
        var password = $('#password').val();
        console.log('Post : ' + email + " " + password);

        $.ajax({
            type: 'POST',
            url: '/api/v1/signIn',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "email": email,
                "password": password
            }),
            success: function (res) {
                model.signIn(res);
            },
            error: function () {
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
            error: function () {
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

/* ------------------- anonymous initialize function ------------------------ */

(function () {

    var app = {

        init: function () {
            this.main();
            this.event();
        },
        main: function () {
            // тут функции при загрузке главной страницы
        },
        event: function () { // тут навешиваем слушателей на события
            $(document).ready(function () {
                if (document.cookie) {
                    controller.cookieSession(document.cookie);
                }

                $('#signIn').click(function (event) {
                    controller.signIn(event);
                });
            });
        }
    };
    app.init();

}());

/* ----------------- end anonymous initialize function ---------------------- */