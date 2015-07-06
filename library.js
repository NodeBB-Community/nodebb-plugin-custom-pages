"use strict";

var CustomPages = {},
	db = module.parent.require('./database'),
	emitter = module.parent.require('./emitter'),
	nconf = module.parent.require('nconf'),
	fs = require('fs'),
	path = require('path');

// quick fix for; checked in init()
// https://github.com/psychobunny/nodebb-plugin-custom-pages/issues/10
CustomPages.compiled = false;
emitter.on('templates:compiled', function() {
	CustomPages.compiled = true;
});

function renderCustomPage(req, res, next) {
	var path = req.path.replace(/\/(api\/)?/, '');
	res.render(path, {});
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

CustomPages.setAvailableTemplates = function(templates, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				templates.push(data[d].route + '.tpl');
			}
		}

		callback(err, templates);
	});
};

CustomPages.setWidgetAreas = function(areas, callback) {
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

CustomPages.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Static Pages'
	});

	callback(null, header);
};

CustomPages.addNavigation = function(header, callback) {
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

CustomPages.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;

	app.get('/admin/custom-pages', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/custom-pages', renderAdmin);

	fs.readFile(path.join(__dirname, 'templates/custom-page.tpl'), function(err, customTPL) {
		customTPL = customTPL.toString();

		getCustomPages(function(err, data) {
			for (var d in data) {
				if (data.hasOwnProperty(d)) {
					var route = data[d].route;
					app.get('/' + route, middleware.buildHeader, renderCustomPage);
					app.get('/api/' + route, renderCustomPage);

					if (CustomPages.compiled) {
						fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL);
					} else {
						emitter.on('templates:compiled', function() {
							fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL);
						});
					}
				}
			}
		});
	});

	var SocketAdmin = module.parent.require('./socket.io/admin');
	SocketAdmin.settings.saveCustomPages = function(socket, data, callback) {
		db.set('plugins:custom-pages', JSON.stringify(data), callback);
	};

	callback();
};

module.exports = CustomPages;
