//Dependencies
import Promise from 'bluebird';
import config from 'config';
import Logger from 'winston';
import http from 'http';
import https from 'https';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import io from 'socket.io';

//Local dependencies
import Dispatcher from './lib/Dispatcher';

//Instantiated
const PLUGIN_START = `node-cuda-`;
const PLUGIN_END = `-server-plugin`;
const SSL_CERT_PATH = path.resolve(`${__dirname}/../ssl`);
const networkConfig = config.get(`network`);

const app = express();
const dispatcher = new Dispatcher();

const plugins = {};
let httpServer;
let httpsServer;
let socket;
let sslSocket;

const App = class App {
	constructor() {
		throw new Error(`App is a static class and cannot be instantiated!`);
	}

	////////////////////////
	// GETTERS AND SETTERS//
	////////////////////////

	////////////////////
	// PUBLIC METHODS //
	////////////////////

	static start() {
		//Load plugins
		App._loadPlugins();
		App._createRoutes();
		App._startListeners()
			.then(() => {
				App._setSocketHandlers();
			})
			.catch((err) => {
				throw err;
			});
	}

	////////////////////
	// PRIVATE METHODS//
	////////////////////

	static _loadPlugins() {
		const enabledPlugins = config.get(`plugins`);

		enabledPlugins.forEach((pluginName) => {
			Logger.debug(`Loading plugin ${pluginName}`);
			const moduleName = `${PLUGIN_START}${pluginName}${PLUGIN_END}`;
			const pluginModule = require(moduleName); //eslint-disable-line global-require

			plugins[pluginName] = pluginModule;
		});

		Logger.info(`Loaded ${enabledPlugins.length} plugins`);
	}

	static _createRoutes() {

	}

	static _startListeners() {
		const promises = [];

		promises.push(App._startHttpListener());

		if (networkConfig.ports.https != null) {
			promises.push(App._startHttpsListener());
		}

		return Promise.all(promises);
	}

	static _startHttpListener() {
		httpServer = http.createServer(app);
		socket = io(httpServer);

		return new Promise((resolve, reject) => {
			httpServer.listen(networkConfig.ports.http, (err) => {
				if (err) {
					Logger.error(`Encountered an error starting HTTP listener`);
					reject(err);
				} else {
					Logger.info(`Started HTTP listener on port ${networkConfig.ports.http}`);
					resolve();
				}
			});
		});
	}

	static _startHttpsListener() {
		return App._readHttpsCredentials()
			.then((credentials) => {
				httpsServer = https.createServer(credentials, app);
				sslSocket = io(httpsServer);

				return new Promise((resolve, reject) => {
					httpsServer.listen(networkConfig.ports.https, (err) => {
						if (err) {
							Logger.error(`Encountered an error starting HTTPS listener`);
							reject(err);
						} else {
							Logger.info(`Started HTTPS listener on port ${networkConfig.ports.https}`);
							resolve();
						}
					});
				});
			});
	}

	static _readHttpsCredentials() {
		const keyPath = path.resolve(`${SSL_CERT_PATH}/server.key`);
		const certPath = path.resolve(`${SSL_CERT_PATH}/server.crt`);
		const caPath = path.resolve(`${SSL_CERT_PATH}/ca.crt`);

		return Promise.join(
			fs.readFile(keyPath),
			fs.readFile(certPath),
			fs.readFile(caPath)
				.catch((err) => Promise.resolve(null)), //The ca file may not exist; resolve with null in case of error
		)
			.then(([key, cert, ca]) => {
				const credentials = {
					key: key.toString(`utf8`),
					cert: cert.toString(`utf8`),
				};

				if (ca != null) {
					//The ca file exists, add it to the credentials
					credentials.ca = ca.toString(`utf8`);
				}

				return Promise.resolve(credentials);
			})
			.catch((err) => {
				Logger.error(`Encountered an error reading HTTPS credentials`);
				Logger.error(err);
			});
	}

	static _setSocketHandlers() {
		socket.on(`connection`, App.handleClientConnect);
	}

	////////////////////
	// EVENT HANDLERS //
	////////////////////

	static handleClientConnect(client) {
		Logger.info(`New client connected`);
		dispatcher.addWorker(client);
	}
};

export { App };
export default App;
