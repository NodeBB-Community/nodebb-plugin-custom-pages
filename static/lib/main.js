'use strict';

(function () {
	require(['hooks'], function (hooks) {
		hooks.on('filter:script.load', function (data) {
			if (ajaxify.data && ajaxify.data.customPage && data.tpl_url) {
				const autoDerived = data.tpl_url.startsWith('admin') ?
					data.tpl_url : 'forum/' + data.tpl_url;
				data.scripts = data.scripts.filter(function (script) {
					return script !== autoDerived;
				});
			}
			return data;
		});
	});
}());
