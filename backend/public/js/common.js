/**
 * Created by lex on 27.10.16.
 */
/* ----------------------------- begin view ----------------------------------*/
var view = {
    signIn: function(data){
        $('.msgErr').css('visibility', 'visible');
    }
};
/* ------------------------------- end view ----------------------------------*/

/* ------------------------------ begin model --------------------------------*/
var model = {
    signIn: function (data){
        console.log("Login sign in " + JSON.stringify(data));
        if(data.success){
            user.name = data.name;
            user.host = data.host;
            user.port = data.port;
            user.streamsId = data.streamsId;
            var date = new Date(new Date().getTime() + 60 * 10000);
            document.cookie = "token="+data.token+"; path=/; expires=" + date.toUTCString();
            location.href='/';
        } else {
            view.signIn(data);
        }
    }
};
/* ------------------------------- end model ---------------------------------*/

/* --------------------------- begin controller ------------------------------*/
var controller = {
    signIn: function(event) {
        // event.preventDefault();
        var email = $('#email').val();
        var password = $('#password').val();
        console.log(email+ " " + password);

        $.ajax({
            type: 'POST',
            url: '/api/v1/signIn',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "email": email,
                "password": password
            }),
            success: function(res) {
                model.signIn(res);
            },
            error: function() {
            }
        });
    }
};
/* --------------------------- end controller --------------------------------*/


/* ------------------- anonymous initialize function ------------------------ */

(function() {
    var user = {
        name: "Alex",
        host: 'localhost',
        port: '30000',
        streamsId: ['log', 'sys_log', 'nginx'],
        filter: '',
        reverseDirection: true
    };

    var app = {

        init: function() {
            this.main();
            this.event();
        },
        main: function() {
            // тут функции при загрузке главной страницы
        },
        event: function() { // тут навешиваем слушателей на события
            $(document).ready(function() {
                $('#signIn').click(function (event){
                    controller.signIn(event);
                });
            });
        }
    };
    app.init();

}());

/* ----------------- end anonymous initialize function ---------------------- */