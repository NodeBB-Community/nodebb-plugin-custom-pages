'use strict';

const plugin = module.exports;

const mkdirp = require('mkdirp');
const async = require('async');

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');

const db = require.main.require('./src/database');
const user = require.main.require('./src/user');
const widgets = require.main.require('./src/widgets');
const groups = require.main.require('./src/groups');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const pubsub = require.main.require('./src/pubsub');

const fs = require('fs');
const path = require('path');

plugin.init = async function (params) {
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
			middlewares = [middleware.busyCheck, middleware.applyCSRF, middleware.buildHeader].concat(middlewares);
		}
		async.eachSeries(middlewares, function (middleware, next) {
			middleware(req, res, next);
		}, async function (err) {
			if (err) {
				return next(err);
			}
			await renderCustomPage(req, res, next);
		});
	});

	var SocketAdmin = require.main.require('./src/socket.io/admin');
	SocketAdmin.settings.saveCustomPages = async function (socket, data) {
		await resetWidgets(data);
		pubsub.publish('custom-pages:save', data);
		await db.set('plugins:custom-pages', JSON.stringify(data));
	};

	const pages = await getCustomPages();
	await plugin.saveTemplates(pages);
};

pubsub.on('custom-pages:save', async function (pages) {
	storeData(pages);
	await plugin.saveTemplates(pages);
});

function cleanPath(path) {
	return path.replace(/\/(api\/)?/, '').replace(/\/$/, '');
}

async function renderCustomPage(req, res) {
	var path = cleanPath(req.path);
	var groupList = plugin.pagesHash[path].groups ? plugin.pagesHash[path].groups.split(',') : [];

	const isAdmin = await user.isAdministrator(req.uid);

	if (!isAdmin && groupList.length) {
		const groupMembership = await groups.isMemberOfGroups(req.uid, groupList);
		if (!groupMembership.some(a => !!a)) {
			return controllerHelpers.notAllowed(req, res);
		}
	}
	const userData = await user.getUsers([req.uid], req.uid);
	res.render(path, {
		title: plugin.pagesHash[path].name,
		user: userData[0],
	});
}

async function renderAdmin(req, res) {
	const [pages, groups] = await Promise.all([
		getCustomPages(),
		getGroupList(),
	]);
	res.render('admin/plugins/custom-pages', {
		pages: pages,
		groups: groups,
	});
}

async function getCustomPages() {
	if (plugin.pagesCache) {
		return plugin.pagesCache;
	}

	const data = await db.get('plugins:custom-pages');
	storeData(JSON.parse(data));
	return plugin.pagesCache;
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

async function getGroupList() {
	const groupNames = await groups.getGroups('groups:createtime', 0, -1);
	return groupNames.filter(groupName => !groups.isPrivilegeGroup(groupName));
}

plugin.setWidgetAreas = async function (areas) {
	const data = await getCustomPages();

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
	return areas;
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Pages',
	});
	return header;
};

plugin.saveTemplates = async function (pages) {
	if (!nconf.get('isPrimary')) {
		return;
	}

	const bjs = require.main.require('benchpressjs');
	const customTPL = await fs.promises.readFile(path.join(__dirname, 'templates/custom-page.tpl'), 'utf-8');
	try {
		await async.each(pages, async function (pageObj) {
			const route = pageObj.route;

			const jsPath = path.join(nconf.get('views_dir'), route + '.js');
			const tplPath = path.join(nconf.get('views_dir'), route + '.tpl');

			const compiled = await bjs.precompile(customTPL, {});

			if (path.dirname(route) !== '.') {
				// Subdirectories specified
				await mkdirp(path.join(nconf.get('views_dir'), path.dirname(route)));
			}
			await saveFiles(jsPath, tplPath, compiled, customTPL);
		});
	} catch (err) {
		winston.error('[plugin/custom-pages] Could not save templates!');
		winston.error('  ' + err.message);
		throw err;
	}
};

async function saveFiles(jsPath, tplPath, compiled, customTPL) {
	await fs.promises.writeFile(jsPath, compiled);
	await fs.promises.writeFile(tplPath, customTPL);
}

async function resetWidgets(data) {
	var removedRoutes = [];
	if (plugin.pagesHash) {
		Object.keys(plugin.pagesHash).forEach(function (route) {
			var match = data.find(page => page.route === route);

			if (!match) {
				removedRoutes.push(route);
			}
		});
	}

	await widgets.resetTemplates(removedRoutes);
}
