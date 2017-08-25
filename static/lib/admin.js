'use strict';

/* globals define, $, socket, app, ajaxify, jQuery */

define('admin/plugins/custom-pages', [], function () {
	var admin = {};

	function addCloseHandler() {
		$('#custom-pages .fa-times').on('click', function () {
			$(this).parents('.well').remove();
		});
	}

	function addTagsInputForGroups(el) {
		el = el || $('#custom-pages .groups-list');

		el.tagsinput({
			confirmKeys: [13, 44],
			trimValue: true,
		});

		app.loadJQueryUI(function () {
			var input = $('.page-admin-custom-pages .bootstrap-tagsinput input');
			input.autocomplete({
				delay: 100,
				position: { my: 'left bottom', at: 'left top', collision: 'flip' },
				open: function () {
					$(this).autocomplete('widget').css('z-index', 20000);
				},
				source: ajaxify.data.groups,
				select: function () {
                    // when autocomplete is selected from the dropdown simulate a enter key down to turn it into a tag
					// http://stackoverflow.com/a/3276819/583363
					var e = jQuery.Event('keypress');
					e.which = 13;
					e.keyCode = 13;
					setTimeout(function () {
						input.trigger(e);
					}, 100);
				},
			});
		});
	}

	admin.init = function () {
		$('#add').on('click', function () {
			var clone = $('.template').clone().removeClass('template hidden');
			$('#custom-pages').append(clone);

			addCloseHandler();
			addTagsInputForGroups(clone.find('.groups-list'));
		});

		addCloseHandler();
		addTagsInputForGroups();

		$('#save').on('click', function () {
			var arr = [];
			$('#custom-pages .well form').each(function () {
				var data = $(this).serializeArray();
				if (data[1].value && !data[1].value.match(' ') && data[1].value !== '') {
					arr.push({
						name: data[0].value,
						route: data[1].value,
						groups: data[2].value,
					});
				}
			});

			socket.emit('admin.settings.saveCustomPages', arr, function () {
				app.alertSuccess('Custom pages saved and activated');
			});
		});
	};

	return admin;
});
