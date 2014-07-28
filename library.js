"use strict";

var plugin = {},
	db = module.parent.require('./database');

function renderCustomPage(req, res, next) {
	res.render('custom-page', {});
}

function renderAdmin(req, res, next) {
	getCustomPages(function(err, data) {
		res.render('admin/custom-pages', {
			pages: data
		});
	});
}

function getCustomPages(callback) {
	db.get('plugins:custom-pages', function(err, data) {
		callback(err, JSON.parse(data));
	});
}

plugin.setAvailableTemplates = function(templates, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				templates.push(data[d].route + '.tpl');
			}
		}

		callback(err, templates);
	});
};

plugin.setWidgetAreas = function(areas, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				areas = areas.concat([
					{
						'name': data[d].name + ' Header',
						'template': data[d].route + '.tpl',
						'location': 'header'
					},
					{
						'name': data[d].name + ' Footer',
						'template': data[d].route + '.tpl',
						'location': 'footer'
					},
					{
						'name': data[d].name + ' Sidebar',
						'template': data[d].route + '.tpl',
						'location': 'sidebar'
					},
					{
						'name': data[d].name + ' Content',
						'template': data[d].route + '.tpl',
						'location': 'content'
					}
				]);
			}
		}

		callback(err, areas);
	});
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Static Pages'
	});

	callback(null, header);
};

plugin.addNavigation = function(header, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				header.navigation.push({
					"class": data[d].class,
					"route": "/" + data[d].route,
					"text": data[d].name,
					"title": data[d].name
				});
			}
		}

		callback(null, header);
	});
};

plugin.init = function(app, middleware, controllers, callback) {
	app.get('/admin/custom-pages', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/custom-pages', renderAdmin);

	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				var route = data[d].route;
				app.get('/' + route, middleware.buildHeader, renderCustomPage);
				app.get('/templates/' + route + '.tpl', renderCustomPage);
				app.get('/api/' + route, renderCustomPage);
			}
		}
	});

	var SocketAdmin = module.parent.require('./socket.io/admin');
	SocketAdmin.settings.saveCustomPages = function(socket, data, callback) {
		db.set('plugins:custom-pages', JSON.stringify(data), callback);
	};

	callback();
};

module.exports = plugin;