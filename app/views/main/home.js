$(document).ready( function() {

    function button_listener(action) {
        return function() {
            var business_name = $(this).attr("id");
            $.post(action, {'business_name': business_name}, fill_search_field);
        };
    }

    function register_listeners() {
        $('.follow_button').on( 'click', button_listener('/follow') );
        $('.unfollow_button').on( 'click', button_listener('/unfollow') );
    }

    function remove_listeners() {
        $('.follow_button').off( 'click', button_listener('/follow') );
        $('.unfollow_button').off( 'click', button_listener('/unfollow') );
    }

    function fill_search_field(data) {
        var html_result = '<table>';
        data.search_result.forEach( function(search_i) {
            html_result += '<tr>' +
                '<td rowspan="2">' +
                '<img src="' + search_i.image_url + '" alt="business_image" height="100" width="100">' +
                '</td>' +
                '<th>' +
                '<a href="' + search_i.url + '">' + search_i.name + '</a>' +
                '</th>' +
                '<td>';

            if( data.auth_status ) {
                if(search_i.followed_status)
                    html_result += '<input type="submit" value="Unfollow" class="unfollow_button" id="' + search_i.name + '">';
                else
                    html_result += '<input type="submit" value="Follow" class="follow_button" id="' + search_i.name + '">';
            }

            html_result += '</td>' +
                '</tr>' +
                '<tr>' +
                '<td colspan="2">' +
                search_i.snippet_text +
                '</td>' +
                '</tr>';
        });
        html_result += '</table>';

        $('#search_result_field').html( html_result );

        remove_listeners();
        register_listeners();
    }

    $('#search_button').on('click', function() {
        var location = $('#search_input_field').val();
        $.post('/search', {'location': location}, fill_search_field);
    });

    register_listeners();

});
