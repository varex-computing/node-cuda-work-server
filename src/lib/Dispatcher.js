//Dependencies
import uniqid from 'uniqid';
import Logger from 'winston';

//Local dependencies
import WorkClient from './WorkClient';

//Instantiated

const Dispatcher = class Dispatcher {
	constructor() {
		this._workClients = {};
	}

	////////////////////
	// PUBLIC METHODS //
	////////////////////

	addWorker(workerSocket) {
		// preserve context
		const _this = this;
		
		const clientId = uniqid();
		const client = new WorkClient(clientId, workerSocket);
		_this._workClients[clientId] = client;

		workerSocket.on(`disconnect`, _this.handleClientDisconnect.bind(_this, clientId));
	}

	////////////////////
	// EVENT HANDLERS //
	////////////////////

	handleClientDisconnect(clientId) {
		// preserve context
		const _this = this;
		
		Logger.info(`Client disconnected`);
		delete _this._workClients[clientId];
	}
};

export { Dispatcher };
export default Dispatcher;
