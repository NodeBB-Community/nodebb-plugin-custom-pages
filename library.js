'use strict';

var plugin = module.exports;

var nconf = require.main.require('nconf');
var async = require.main.require('async');
var mkdirp = require.main.require('mkdirp');
var winston = require.main.require('winston');

var db = require.main.require('./src/database');
var user = require.main.require('./src/user');
var widgets = require.main.require('./src/widgets');
var groups = require.main.require('./src/groups');
var controllerHelpers = require.main.require('./src/controllers/helpers');
var pubsub = require.main.require('./src/pubsub');

var fs = require('fs');
var path = require('path');

pubsub.on('custom-pages:save', function (pages) {
	storeData(pages);
	plugin.saveTemplates();
});

function cleanPath(path) {
	return path.replace(/\/(api\/)?/, '').replace(/\/$/, '');
}

function renderCustomPage(req, res, next) {
	var path = cleanPath(req.path);
	var groupList = plugin.pagesHash[path].groups ? plugin.pagesHash[path].groups.split(',') : [];

	async.waterfall([
		function (next) {
			user.isAdministrator(req.uid, next);
		},
		function (isAdministrator, next) {
			if (!groupList.length || isAdministrator) {
				return next(null, [true]);
			}

			groups.isMemberOfGroups(req.uid, groupList, next);
		},
		function (groupMembership, next) {
			if (!groupMembership.some(function (a) { return a; })) {
				return controllerHelpers.notAllowed(req, res);
			}

			user.getUsers([req.uid], req.uid, next);
		},
		function (users) {
			res.render(path, {
				title: plugin.pagesHash[path].name,
				user: users[0],
			});
		},
	], next);
}

function renderAdmin(req, res, next) {
	async.parallel({
		pages: function (next) {
			getCustomPages(next);
		},
		groups: function (next) {
			getGroupList(next);
		},
	}, function (err, data) {
		if (err) {
			return next(err);
		}

		res.render('admin/plugins/custom-pages', {
			pages: data.pages,
			groups: data.groups,
		});
	});
}

function getCustomPages(callback) {
	if (plugin.pagesCache) {
		return callback(null, plugin.pagesCache);
	}

	db.get('plugins:custom-pages', function (err, data) {
		if (err) {
			return callback(err);
		}

		try {
			storeData(JSON.parse(data));

			callback(null, plugin.pagesCache);
		} catch (err) {
			callback(err);
		}
	});
}

function storeData(pages) {
	if (pages == null) {
		pages = [];
	}

	// Eliminate errors in route definition
	plugin.pagesCache = pages.map(function (pageObj) {
		pageObj.route = pageObj.route.replace(/^\/*/g, '');	// trim leading slashes from route
		return pageObj;
	});

	plugin.pagesHash = plugin.pagesCache.reduce(function (memo, cur) {
		memo[cur.route] = cur;
		return memo;
	}, {});
}

function getGroupList(callback) {
	groups.getGroups('groups:createtime', 0, -1, function (err, groupNames) {
		if (err) {
			return callback(err);
		}
		groupNames = groupNames.filter(groupName => !groups.isPrivilegeGroup(groupName));
		callback(null, groupNames);
	});
}

plugin.setWidgetAreas = function (areas, callback) {
	getCustomPages(function (err, data) {
		if (err) {
			return callback(err);
		}
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				areas = areas.concat([
					{
						name: data[d].name + ' Header',
						template: data[d].route + '.tpl',
						location: 'header',
					},
					{
						name: data[d].name + ' Footer',
						template: data[d].route + '.tpl',
						location: 'footer',
					},
					{
						name: data[d].name + ' Sidebar',
						template: data[d].route + '.tpl',
						location: 'sidebar',
					},
					{
						name: data[d].name + ' Content',
						template: data[d].route + '.tpl',
						location: 'content',
					},
				]);
			}
		}

		callback(null, areas);
	});
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Pages',
	});

	callback(null, header);
};

plugin.init = function (params, callback) {
	var app = params.router;
	var middleware = params.middleware;

	var helpers = require.main.require('./src/routes/helpers');
	helpers.setupAdminPageRoute(app, '/admin/plugins/custom-pages', middleware, [], renderAdmin);

	app.get('*', function routeToCustomPage(req, res, next) {
		if (!plugin.pagesHash || !plugin.pagesHash[cleanPath(req.path)]) {
			return setImmediate(next);
		}

		res.locals.isAPI = req.path.startsWith('/api');
		let middlewares = [middleware.maintenanceMode, middleware.registrationComplete, middleware.pageView, middleware.pluginHooks];
		if (!res.locals.isAPI) {
			middlewares = [middleware.busyCheck, middleware.buildHeader].concat(middlewares);
		}
		async.eachSeries(middlewares, function (middleware, next) {
			middleware(req, res, next);
		}, function (err) {
			if (err) {
				return next(err);
			}
			renderCustomPage(req, res, next);
		});
	});

	var SocketAdmin = require.main.require('./src/socket.io/admin');
	SocketAdmin.settings.saveCustomPages = function (socket, data, callback) {
		resetWidgets(data);

		pubsub.publish('custom-pages:save', data);

		db.set('plugins:custom-pages', JSON.stringify(data), callback);
	};
	plugin.saveTemplates(callback);
};

plugin.saveTemplates = function (callback) {
	callback = callback || function () { };

	if (nconf.get('isPrimary') !== 'true') {
		return setImmediate(callback);
	}

	var bjs = require.main.require('benchpressjs');

	fs.readFile(path.join(__dirname, 'templates/custom-page.tpl'), 'utf-8', function (err, customTPL) {
		if (err) {
			return callback(err);
		}

		getCustomPages(function (err, pages) {
			if (err) {
				return callback(err);
			}

			async.each(pages, function (pageObj, next) {
				var route = pageObj.route;

				var jsPath = path.join(nconf.get('views_dir'), route + '.js');
				var tplPath = path.join(nconf.get('views_dir'), route + '.tpl');

				bjs.precompile(customTPL, {}, function (err, compiled) {
					if (err) {
						return next(err);
					}

					if (path.dirname(route) !== '.') {
						// Subdirectories specified
						mkdirp(path.join(nconf.get('views_dir'), path.dirname(route)), function (err) {
							if (err) {
								return next(err);
							}
							saveFiles(jsPath, tplPath, compiled, customTPL, next);
						});
					} else {
						saveFiles(jsPath, tplPath, compiled, customTPL, next);
					}
				});
			}, function (err) {
				if (err) {
					winston.error('[plugin/custom-pages] Could not save templates!');
					winston.error('  ' + err.message);
				}

				callback(err);
			});
		});
	});
};

function saveFiles(jsPath, tplPath, compiled, customTPL, callback) {
	fs.writeFile(jsPath, compiled, function (err) {
		if (err) {
			return callback(err);
		}

		fs.writeFile(tplPath, customTPL, callback);
	});
}

function resetWidgets(data, callback) {
	var removedRoutes = [];
	if (plugin.pagesHash) {
		Object.keys(plugin.pagesHash).forEach(function (route) {
			var match = data.find(page => page.route === route);

			if (!match) {
				removedRoutes.push(route);
			}
		});
	}

	widgets.resetTemplates(removedRoutes, callback);
}
