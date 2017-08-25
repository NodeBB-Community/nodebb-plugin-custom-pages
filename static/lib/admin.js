'use strict';

/* globals define, $, socket, app */

define('admin/plugins/custom-pages', [], function () {
	function addCloseHandler() {
		$('#custom-pages .fa-times').on('click', function () {
			$(this).parents('.well').remove();
		});
	}

	$('#add').on('click', function () {
		var clone = $('.template').clone().removeClass('template hidden');
		$('#custom-pages').append(clone);

		addCloseHandler();
	});

	addCloseHandler();

	$('#save').on('click', function () {
		var arr = [];
		$('#custom-pages .well form').each(function () {
			var data = $(this).serializeArray();
			if (data[1].value && !data[1].value.match(' ') && data[1].value !== '') {
				arr.push({
					name: data[0].value,
					route: data[1].value,
					class: data[2].value,
				});
			}
		});

		socket.emit('admin.settings.saveCustomPages', arr, function () {
			app.alertSuccess('Custom pages saved and activated');
		});
	});
});
